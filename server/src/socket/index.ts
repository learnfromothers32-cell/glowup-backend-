import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { appConfig } from "../config/app";
import { verifyAccessToken } from "../utils/token";
import { Queue } from "../models/Queue";
import { Conversation } from "../models/Conversation";
import { Stylist } from "../models/Stylist";
import logger from "../utils/logger";
import { toPublicQueue } from "../utils/queue";

let io: Server;

// ── In-memory user socket map ──
const userSockets = new Map<string, Set<string>>();

// ── Per-room rate limiting (in-memory, best-effort) ──
const queueRateLimitBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();
const QUEUE_RATE_LIMIT_WINDOW = 10_000;
const QUEUE_RATE_LIMIT_MAX = 20;

function checkQueueRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = queueRateLimitBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    queueRateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + QUEUE_RATE_LIMIT_WINDOW,
    });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= QUEUE_RATE_LIMIT_MAX;
}

function cleanupQueueRateLimitBuckets() {
  const now = Date.now();
  for (const [key, bucket] of queueRateLimitBuckets) {
    if (now > bucket.resetAt) queueRateLimitBuckets.delete(key);
  }
}
setInterval(cleanupQueueRateLimitBuckets, 60_000);

export const initSocket = async (server: HttpServer): Promise<Server> => {
  io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        const allowed = [
          appConfig.clientUrl,
          "http://localhost:5173",
          "http://localhost:5000",
        ];
        if (
          !origin ||
          allowed.some((a) => origin === a || origin?.startsWith(a + "/"))
        ) {
          cb(null, true);
        } else {
          cb(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    connectTimeout: 10000,
  });

  // ── Redis adapter for multi-instance support ──
  let redisPub: Redis | null = null;
  let redisSub: Redis | null = null;
  if (appConfig.redisUrl) {
    try {
      redisPub = new Redis(appConfig.redisUrl);
      redisSub = redisPub.duplicate();
      io.adapter(createAdapter(redisPub, redisSub));
      logger.info("Socket.IO Redis adapter initialized");
    } catch (err) {
      logger.warn(
        "Socket.IO Redis adapter failed, running in single-instance mode",
        { error: (err as Error).message },
      );
    }
  } else {
    logger.info(
      "Socket.IO running in single-instance mode (REDIS_URL not configured)",
    );
  }

  // ── Redis-backed moderation state ──

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const payload = verifyAccessToken(token as string);
        (socket as any).user = payload;
      } catch {
        return next(new Error("Invalid token"));
      }
    }
    next();
  });

  const queueNsp = io.of("/queue");

  queueNsp.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).user = payload;
    } catch {
      return next(new Error("Invalid token"));
    }
    next();
  });

  queueNsp.on("connection", (socket: Socket) => {
    const userId = (socket as any).user?.id;

    socket.on(
      "queue:join",
      async (data: { stylistId: string; bookingId?: string }) => {
        const rateKey = `queue:join:${userId || socket.id}`;
        if (!checkQueueRateLimit(rateKey)) {
          socket.emit("queue:error", {
            message: "Too many requests. Slow down.",
          });
          return;
        }
        try {
          const { stylistId, bookingId } = data;
          const userOid = new mongoose.Types.ObjectId(userId);
          const entry = {
            userId: userOid,
            position: 0,
            joinedAt: new Date(),
            estimatedServiceMins: 30,
            estimatedWaitMins: 0,
            status: "waiting" as const,
            bookingId: bookingId
              ? new mongoose.Types.ObjectId(bookingId)
              : undefined,
          };

          const session = await mongoose.startSession();
          try {
            await session.withTransaction(async () => {
              await Queue.findOneAndUpdate(
                { stylistId },
                {
                  $pull: { entries: { userId: userOid, status: "waiting" } },
                  $push: { entries: entry },
                  $setOnInsert: {
                    stylistId,
                    currentPosition: 0,
                    predictedWaitMins: 0,
                    avgServiceDuration: 30,
                    lastUpdated: new Date(),
                  },
                },
                { upsert: true, session },
              );

              const queue = await Queue.findOne({ stylistId }).session(session);
              if (queue) {
                queue.recalculate();
                await queue.save({ session });

                socket.join(`queue:${stylistId}`);
                socket.emit("queue:joined", { queue: toPublicQueue(queue) });
                queueNsp
                  .to(`queue:${stylistId}`)
                  .emit("queue:update", toPublicQueue(queue));
              }
            });
          } finally {
            session.endSession();
          }
        } catch (err: any) {
          socket.emit("queue:error", { message: err.message });
        }
      },
    );

    socket.on("queue:leave", async (data: { stylistId: string }) => {
      try {
        const { stylistId } = data;
        const userOid = new mongoose.Types.ObjectId(userId);

        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            await Queue.findOneAndUpdate(
              { stylistId },
              { $pull: { entries: { userId: userOid, status: "waiting" } } },
              { session },
            );

            const queue = await Queue.findOne({ stylistId }).session(session);
            if (queue) {
              queue.recalculate();
              await queue.save({ session });

              socket.leave(`queue:${stylistId}`);
              socket.emit("queue:left");
              queueNsp
                .to(`queue:${stylistId}`)
                .emit("queue:update", toPublicQueue(queue));
            }
          });
        } finally {
          session.endSession();
        }
      } catch (err: any) {
        socket.emit("queue:error", { message: err.message });
      }
    });

    socket.on("queue:status", async (data: { stylistId: string }) => {
      try {
        const { stylistId } = data;
        const queue = await Queue.findOne({ stylistId });
        if (!queue) {
          socket.emit("queue:status", { queue: null });
          return;
        }

        const userEntry = queue.entries.find(
          (e) => e.userId.toString() === userId,
        );

        socket.join(`queue:${stylistId}`);

        socket.emit("queue:status", {
          queue: toPublicQueue(queue),
          myEntry: userEntry
            ? {
                position: userEntry.position,
                status: userEntry.status,
                estimatedServiceMins: userEntry.estimatedServiceMins,
                estimatedWaitMins: userEntry.estimatedWaitMins ?? 0,
                joinedAt: userEntry.joinedAt,
              }
            : null,
        });
      } catch (err: any) {
        socket.emit("queue:error", { message: err.message });
      }
    });

    socket.on("queue:subscribe", async (data: { stylistId: string }) => {
      socket.join(`queue:${data.stylistId}`);
      const queue = await Queue.findOne({ stylistId: data.stylistId });
      if (queue) {
        socket.emit("queue:update", toPublicQueue(queue));
      }
    });

    socket.on("queue:unsubscribe", (data: { stylistId: string }) => {
      socket.leave(`queue:${data.stylistId}`);
    });

    if (userId) {
      socket.join(`user:${userId}`);
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
    }

    socket.on("disconnect", () => {
      if (userId) {
        userSockets.get(userId)?.delete(socket.id);
        if (userSockets.get(userId)?.size === 0) {
          userSockets.delete(userId);
        }
      }
      socket.removeAllListeners();
    });
  });

  // ── Conversation namespace ──
  const conversationNsp = io.of("/conversations");

  conversationNsp.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).user = payload;
    } catch {
      return next(new Error("Invalid token"));
    }
    next();
  });

  conversationNsp.on("connection", (socket: Socket) => {
    const userId = (socket as any).user?.id;

    socket.on("conversation:join", async (conversationId: string) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("conversation:error", {
            message: "Conversation not found",
          });
          return;
        }

        const userId = (socket as any).user.id;
        const userRole = (socket as any).user.role;

        let authorized = false;
        if (userRole === "stylist") {
          const stylist = await Stylist.findOne({ userId });
          if (stylist && conversation.stylistId.toString() === stylist.id) {
            authorized = true;
          }
        }
        if (userRole === "client") {
          if (conversation.clientId.toString() === userId) {
            authorized = true;
          }
        }
        if (userRole === "admin") {
          authorized = true;
        }

        if (!authorized) {
          socket.emit("conversation:error", { message: "Not authorized" });
          return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch {
        socket.emit("conversation:error", {
          message: "Failed to join conversation",
        });
      }
    });

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on(
      "conversation:typing",
      (data: { conversationId: string; isTyping: boolean }) => {
        socket
          .to(`conversation:${data.conversationId}`)
          .emit("conversation:typing", {
            userId,
            isTyping: data.isTyping,
          });
      },
    );

    socket.on("disconnect", () => {
      if (userId) {
        userSockets.get(userId)?.delete(socket.id);
        if (userSockets.get(userId)?.size === 0) {
          userSockets.delete(userId);
        }
      }
      socket.removeAllListeners();
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
