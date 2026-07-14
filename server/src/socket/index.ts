import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { appConfig } from '../config/app';
import { verifyAccessToken } from '../utils/token';
import { Queue } from '../models/Queue';
import { Conversation } from '../models/Conversation';
import { Stylist } from '../models/Stylist';
import { LiveSession, LiveChatMessage } from '../models/LiveSession';
import { GiftTransaction } from '../models/LiveGift';
import logger from '../utils/logger';
import { toPublicQueue } from '../utils/queue';

let io: Server;

function sanitizeMessage(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 500);
}

// ── In-memory user socket map ──
const userSockets = new Map<string, Set<string>>();

// ── Redis-backed room state (muted/blocked/likers) ──
class RoomState {
  private redis: Redis | null;
  private prefix: string;
  private fallback: Map<string, Set<string>>;
  private lastAccessed: Map<string, number>;
  private static readonly ROOM_TTL = 30 * 60 * 1000;

  constructor(redis: Redis | null, prefix: string) {
    this.redis = redis;
    this.prefix = prefix;
    this.fallback = new Map();
    this.lastAccessed = new Map();
  }

  async add(room: string, member: string): Promise<void> {
    if (this.redis) {
      await this.redis.sadd(`${this.prefix}:${room}`, member);
      await this.redis.expire(`${this.prefix}:${room}`, 86400);
    } else {
      if (!this.fallback.has(room)) this.fallback.set(room, new Set());
      this.fallback.get(room)!.add(member);
      this.lastAccessed.set(room, Date.now());
    }
  }

  async has(room: string, member: string): Promise<boolean> {
    if (this.redis) {
      return (await this.redis.sismember(`${this.prefix}:${room}`, member)) === 1;
    }
    this.lastAccessed.set(room, Date.now());
    return this.fallback.get(room)?.has(member) ?? false;
  }

  async remove(room: string, member: string): Promise<void> {
    if (this.redis) {
      await this.redis.srem(`${this.prefix}:${room}`, member);
    } else {
      this.fallback.get(room)?.delete(member);
      this.lastAccessed.set(room, Date.now());
    }
  }

  async removeRoom(room: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(`${this.prefix}:${room}`);
    } else {
      this.fallback.delete(room);
      this.lastAccessed.delete(room);
    }
  }

  async size(room: string): Promise<number> {
    if (this.redis) {
      return await this.redis.scard(`${this.prefix}:${room}`);
    }
    return this.fallback.get(room)?.size ?? 0;
  }

  cleanup(): void {
    if (this.redis) return;
    const now = Date.now();
    for (const [room, members] of this.fallback) {
      const lastAccess = this.lastAccessed.get(room) ?? 0;
      if (members.size === 0 || now - lastAccess > RoomState.ROOM_TTL) {
        this.fallback.delete(room);
        this.lastAccessed.delete(room);
      }
    }
  }
}

// ── Per-room rate limiting (in-memory, best-effort) ──
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 10_000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX;
}

function cleanupRateLimitBuckets() {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (now > bucket.resetAt) rateLimitBuckets.delete(key);
  }
  for (const [key, bucket] of queueRateLimitBuckets) {
    if (now > bucket.resetAt) queueRateLimitBuckets.delete(key);
  }
}

setInterval(cleanupRateLimitBuckets, 60_000);

// ── Room state cleanup (every 5 minutes) ──
const roomStateInstances: RoomState[] = [];
function registerRoomState(rs: RoomState) { roomStateInstances.push(rs); }
function cleanupAllRoomStates() {
  for (const rs of roomStateInstances) rs.cleanup();
}
const roomCleanupInterval = setInterval(cleanupAllRoomStates, 5 * 60 * 1000);
process.on('SIGTERM', () => { clearInterval(roomCleanupInterval); cleanupAllRoomStates(); });
process.on('SIGINT', () => { clearInterval(roomCleanupInterval); cleanupAllRoomStates(); });

// ── Queue namespace rate limiting ──
const queueRateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const QUEUE_RATE_LIMIT_WINDOW = 10_000;
const QUEUE_RATE_LIMIT_MAX = 20;

function checkQueueRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = queueRateLimitBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    queueRateLimitBuckets.set(key, { count: 1, resetAt: now + QUEUE_RATE_LIMIT_WINDOW });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= QUEUE_RATE_LIMIT_MAX;
}

export const initSocket = async (server: HttpServer): Promise<Server> => {
  io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        const allowed = [
          appConfig.clientUrl,
          'http://localhost:5173',
          'http://localhost:5000',
        ];
        if (!origin || allowed.some((a) => origin === a || origin?.startsWith(a + '/'))) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'));
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
      logger.info('Socket.IO Redis adapter initialized');
    } catch (err) {
      logger.warn('Socket.IO Redis adapter failed, running in single-instance mode', { error: (err as Error).message });
    }
  } else {
    logger.info('Socket.IO running in single-instance mode (REDIS_URL not configured)');
  }

  // ── Redis-backed moderation state ──
  const roomMutedUsers = new RoomState(redisPub, 'live:muted');
  const roomBlockedUsers = new RoomState(redisPub, 'live:blocked');
  const sessionLikers = new RoomState(redisPub, 'live:likers');
  registerRoomState(roomMutedUsers);
  registerRoomState(roomBlockedUsers);
  registerRoomState(sessionLikers);

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const payload = verifyAccessToken(token as string);
        (socket as any).user = payload;
      } catch {
        return next(new Error('Invalid token'));
      }
    }
    next();
  });

  const queueNsp = io.of('/queue');

  queueNsp.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).user = payload;
    } catch {
      return next(new Error('Invalid token'));
    }
    next();
  });

  queueNsp.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id;

    socket.on('queue:join', async (data: { stylistId: string; bookingId?: string }) => {
      const rateKey = `queue:join:${userId || socket.id}`;
      if (!checkQueueRateLimit(rateKey)) {
        socket.emit('queue:error', { message: 'Too many requests. Slow down.' });
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
          status: 'waiting' as const,
          bookingId: bookingId ? new mongoose.Types.ObjectId(bookingId) : undefined,
        };

        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            await Queue.findOneAndUpdate(
              { stylistId },
              {
                $pull: { entries: { userId: userOid, status: 'waiting' } },
                $push: { entries: entry },
                $setOnInsert: {
                  stylistId,
                  currentPosition: 0,
                  predictedWaitMins: 0,
                  avgServiceDuration: 30,
                  lastUpdated: new Date(),
                },
              },
              { upsert: true, session }
            );

            const queue = await Queue.findOne({ stylistId }).session(session);
            if (queue) {
              queue.recalculate();
              await queue.save({ session });

              socket.join(`queue:${stylistId}`);
              socket.emit('queue:joined', { queue: toPublicQueue(queue) });
              queueNsp.to(`queue:${stylistId}`).emit('queue:update', toPublicQueue(queue));
            }
          });
        } finally {
          session.endSession();
        }
      } catch (err: any) {
        socket.emit('queue:error', { message: err.message });
      }
    });

    socket.on('queue:leave', async (data: { stylistId: string }) => {
      try {
        const { stylistId } = data;
        const userOid = new mongoose.Types.ObjectId(userId);

        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            await Queue.findOneAndUpdate(
              { stylistId },
              { $pull: { entries: { userId: userOid, status: 'waiting' } } },
              { session }
            );

            const queue = await Queue.findOne({ stylistId }).session(session);
            if (queue) {
              queue.recalculate();
              await queue.save({ session });

              socket.leave(`queue:${stylistId}`);
              socket.emit('queue:left');
              queueNsp.to(`queue:${stylistId}`).emit('queue:update', toPublicQueue(queue));
            }
          });
        } finally {
          session.endSession();
        }
      } catch (err: any) {
        socket.emit('queue:error', { message: err.message });
      }
    });

    socket.on('queue:status', async (data: { stylistId: string }) => {
      try {
        const { stylistId } = data;
        const queue = await Queue.findOne({ stylistId });
        if (!queue) {
          socket.emit('queue:status', { queue: null });
          return;
        }

        const userEntry = queue.entries.find(
          (e) => e.userId.toString() === userId
        );

        socket.join(`queue:${stylistId}`);

        socket.emit('queue:status', {
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
        socket.emit('queue:error', { message: err.message });
      }
    });

    socket.on('queue:subscribe', async (data: { stylistId: string }) => {
      socket.join(`queue:${data.stylistId}`);
      const queue = await Queue.findOne({ stylistId: data.stylistId });
      if (queue) {
        socket.emit('queue:update', toPublicQueue(queue));
      }
    });

    socket.on('queue:unsubscribe', (data: { stylistId: string }) => {
      socket.leave(`queue:${data.stylistId}`);
    });

    if (userId) {
      socket.join(`user:${userId}`);
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
    }

    socket.on('disconnect', () => {
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
  const conversationNsp = io.of('/conversations');

  conversationNsp.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).user = payload;
    } catch {
      return next(new Error('Invalid token'));
    }
    next();
  });

  conversationNsp.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id;

    socket.on('conversation:join', async (conversationId: string) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('conversation:error', { message: 'Conversation not found' });
          return;
        }

        const userId = (socket as any).user.id;
        const userRole = (socket as any).user.role;

        let authorized = false;
        if (userRole === 'stylist') {
          const stylist = await Stylist.findOne({ userId });
          if (stylist && conversation.stylistId.toString() === stylist.id) {
            authorized = true;
          }
        }
        if (userRole === 'client') {
          if (conversation.clientId.toString() === userId) {
            authorized = true;
          }
        }
        if (userRole === 'admin') {
          authorized = true;
        }

        if (!authorized) {
          socket.emit('conversation:error', { message: 'Not authorized' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch {
        socket.emit('conversation:error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('conversation:typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${data.conversationId}`).emit('conversation:typing', {
        userId,
        isTyping: data.isTyping,
      });
    });

    socket.on('disconnect', () => {
      if (userId) {
        userSockets.get(userId)?.delete(socket.id);
        if (userSockets.get(userId)?.size === 0) {
          userSockets.delete(userId);
        }
      }
      socket.removeAllListeners();
    });
  });

  // ── Live streaming namespace ──
  const liveNsp = io.of('/live');

  liveNsp.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).user = payload;
    } catch {
      return next(new Error('Invalid or expired token'));
    }
    next();
  });

  liveNsp.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    const userId = user?.id;
    const userRole = user?.role;
    let currentRoom: string | null = null;
    let hasLeftRoom = false;

    socket.on('live:join-room', async (data: { stylistId: string }) => {
      const { stylistId } = data;
      const MAX_VIEWERS = 50;

      if (userRole !== 'stylist') {
        try {
          const session = await LiveSession.findOne({ stylistId, isLive: true });
          if (!session) {
            socket.emit('live:error', { message: 'Stream not found.' });
            return;
          }
          if (session.viewerCount >= MAX_VIEWERS) {
            socket.emit('live:error', { message: 'Stream is full. Try again later.' });
            return;
          }
        } catch (err) {
          logger.error('[live:join-room] validation error:', { error: (err as Error).message });
        }
      }

      currentRoom = `live:${stylistId}`;
      hasLeftRoom = false;
      socket.join(currentRoom);

      if (userRole !== 'stylist') {
        try {
          const updatedSession = await LiveSession.findOneAndUpdate(
            { stylistId, isLive: true },
            [
              {
                $set: {
                  viewerCount: { $add: ['$viewerCount', 1] },
                  peakViewers: {
                    $max: ['$peakViewers', { $add: ['$viewerCount', 1] }],
                  },
                },
              },
            ],
            { new: true }
          );
          if (updatedSession) {
            await Stylist.findByIdAndUpdate(stylistId, { viewerCount: updatedSession.viewerCount });
            liveNsp.to(currentRoom).emit('live:viewer-count', { viewerCount: updatedSession.viewerCount });
          }
        } catch (err) {
          logger.error('[live:join-room] error:', { error: (err as Error).message });
        }
      }

      const viewerId = userId || `anon_${socket.id.slice(-6)}`;
      liveNsp.to(currentRoom).emit('live:user-joined', { userId: viewerId, userRole, socketId: socket.id });

      // When a stylist joins, send them all existing consumers in the room
      // so they can establish WebRTC with each one.
      if (userRole === 'stylist') {
        const roomMembers = liveNsp.adapter.rooms.get(currentRoom);
        if (roomMembers) {
          for (const memberId of roomMembers) {
            if (memberId === socket.id) continue;
            const memberSocket = liveNsp.sockets.get(memberId);
            if (!memberSocket) continue;
            const memberUser = (memberSocket as any).user;
            if (memberUser?.role !== 'stylist') {
              const memberUserId = memberUser?.id || `anon_${memberId.slice(-6)}`;
              socket.emit('live:user-joined', { userId: memberUserId, userRole: memberUser?.role || 'client', socketId: memberId });
            }
          }
        }
      }
    });

    socket.on('live:leave-room', async () => {
      if (!currentRoom) return;
      if (hasLeftRoom) return;
      hasLeftRoom = true;
      const stylistId = currentRoom.replace('live:', '');

      if (userRole !== 'stylist') {
        try {
          const updatedSession = await LiveSession.findOneAndUpdate(
            { stylistId, isLive: true, viewerCount: { $gt: 0 } },
            { $inc: { viewerCount: -1 } },
            { new: true }
          );
          if (updatedSession) {
            await Stylist.findByIdAndUpdate(stylistId, { viewerCount: updatedSession.viewerCount });
            liveNsp.to(currentRoom).emit('live:viewer-count', { viewerCount: updatedSession.viewerCount });
          }
        } catch (err) {
          logger.error('[live:leave-room] error:', { error: (err as Error).message });
        }
      }

      socket.leave(currentRoom);
      const viewerId = userId || `anon_${socket.id.slice(-6)}`;
      liveNsp.to(currentRoom).emit('live:user-left', { userId: viewerId, userRole, socketId: socket.id });
      currentRoom = null;
    });

    socket.on('live:send-message', async (data: { stylistId: string; message: string; parentId?: string }) => {
      if (!data.message?.trim()) return;
      const room = `live:${data.stylistId}`;

      const rateKey = `msg:${userId || socket.id}`;
      if (!checkRateLimit(rateKey)) {
        socket.emit('live:error', { message: 'Too many messages. Slow down.' });
        return;
      }

      if (userId) {
        if (await roomBlockedUsers.has(room, userId)) return;
        if (await roomMutedUsers.has(room, userId)) return;
      }

      try {
        const session = await LiveSession.findOne({ stylistId: data.stylistId, isLive: true });
        if (!session) return;

        const senderId = userId || `anon_${socket.id.slice(-6)}`;
        const role = userRole || 'client';
        const userName = role === 'stylist' ? 'Stylist' : (userId ? `Viewer_${userId.slice(-4)}` : `Guest_${socket.id.slice(-4)}`);

        const msgData: any = {
          sessionId: session._id,
          userId: senderId,
          userName,
          userRole: role,
          message: sanitizeMessage(data.message)
        };
        if (data.parentId) {
          msgData.parentId = data.parentId;
        }

        const msg = await LiveChatMessage.create(msgData);

        liveNsp.to(room).emit('live:new-message', {
          id: msg._id,
          userId: senderId,
          userName,
          userRole: role,
          message: sanitizeMessage(data.message),
          parentId: data.parentId,
          createdAt: msg.createdAt
        });
      } catch (err) {
        logger.error('[live:send-message] error:', { error: (err as Error).message });
      }
    });

    socket.on('live:like', async (data: { stylistId: string }) => {
      const likerId = userId || socket.id;
      const alreadyLiked = await sessionLikers.has(data.stylistId, likerId);
      if (alreadyLiked) return;
      await sessionLikers.add(data.stylistId, likerId);
      try {
        const totalLikes = await sessionLikers.size(data.stylistId);
        await LiveSession.findOneAndUpdate(
          { stylistId: data.stylistId, isLive: true },
          { $set: { 'reactionCounts.like': totalLikes } }
        );
        liveNsp.to(`live:${data.stylistId}`).emit('live:like-update', {
          totalLikes,
          userId: likerId,
        });
      } catch (err) {
        logger.error('[live:like] error:', { error: (err as Error).message });
      }
    });

    socket.on('live:reaction', async (data: { stylistId: string; reaction: string }) => {
      const room = `live:${data.stylistId}`;
      const validReactions = ['heart', 'like', 'fire', 'laugh', 'wow'];
      if (!validReactions.includes(data.reaction)) return;
      const rateKey = `reaction:${userId || socket.id}`;
      if (!checkRateLimit(rateKey)) return;
      try {
        const key = `reactionCounts.${data.reaction}`;
        await LiveSession.findOneAndUpdate(
          { stylistId: data.stylistId, isLive: true },
          { $inc: { [key]: 1 } }
        );
      } catch (err) {
        logger.error('[live:reaction] error:', { error: (err as Error).message });
      }
      liveNsp.to(room).emit('live:reaction-update', {
        userId: userId || socket.id,
        reaction: data.reaction,
      });
    });

    socket.on('live:pin-message', async (data: { stylistId: string; messageId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      try {
        await LiveChatMessage.findByIdAndUpdate(data.messageId, { isPinned: true });
      } catch (err) {
        logger.error('[live:pin-message] error:', { error: (err as Error).message });
      }
      liveNsp.to(room).emit('live:message-pinned', { messageId: data.messageId, userId: userId || socket.id });
    });

    socket.on('live:unpin-message', async (data: { stylistId: string; messageId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      try {
        await LiveChatMessage.findByIdAndUpdate(data.messageId, { isPinned: false });
      } catch (err) {
        logger.error('[live:unpin-message] error:', { error: (err as Error).message });
      }
      liveNsp.to(room).emit('live:message-unpinned', { messageId: data.messageId, userId: userId || socket.id });
    });

    socket.on('live:remove-message', async (data: { stylistId: string; messageId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      try {
        await LiveChatMessage.findByIdAndDelete(data.messageId);
      } catch (err) {
        logger.error('[live:remove-message] error:', { error: (err as Error).message });
      }
      liveNsp.to(room).emit('live:message-removed', { messageId: data.messageId, userId: userId || socket.id });
    });

    socket.on('live:mute-user', async (data: { stylistId: string; targetUserId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      await roomMutedUsers.add(room, data.targetUserId);
      liveNsp.to(room).emit('live:user-muted', { targetUserId: data.targetUserId, userId: userId || socket.id });
    });

    socket.on('live:unmute-user', async (data: { stylistId: string; targetUserId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      await roomMutedUsers.remove(room, data.targetUserId);
      liveNsp.to(room).emit('live:user-unmuted', { targetUserId: data.targetUserId, userId: userId || socket.id });
    });

    socket.on('live:block-user', async (data: { stylistId: string; targetUserId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      await roomBlockedUsers.add(room, data.targetUserId);
      liveNsp.to(room).emit('live:user-blocked', { targetUserId: data.targetUserId, userId: userId || socket.id });
    });

    socket.on('live:unblock-user', async (data: { stylistId: string; targetUserId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      await roomBlockedUsers.remove(room, data.targetUserId);
      liveNsp.to(room).emit('live:user-unblocked', { targetUserId: data.targetUserId, userId: userId || socket.id });
    });

    socket.on('live:send-gift', async (data: { stylistId: string; giftId: string; giftName: string; giftIcon: string; coinAmount: number; animation: 'small' | 'medium' | 'large' }) => {
      const room = `live:${data.stylistId}`;
      const rateKey = `gift:${userId || socket.id}`;
      if (!checkRateLimit(rateKey)) return;

      if (!socket.rooms.has(room)) return;

      if (!userId || userRole === 'stylist') {
        socket.emit('live:error', { message: 'Only authenticated viewers can send gifts.' });
        return;
      }

      if (!data.coinAmount || data.coinAmount <= 0 || data.coinAmount > 10000) return;

      try {
        const { User: UserModel } = await import('../models/User');
        const updatedUser = await UserModel.findOneAndUpdate(
          { _id: userId, points: { $gte: data.coinAmount } },
          { $inc: { points: -data.coinAmount } },
          { new: true }
        );
        if (!updatedUser) {
          socket.emit('live:error', { message: 'Insufficient coin balance.' });
          return;
        }

        const session = await LiveSession.findOne({ stylistId: data.stylistId, isLive: true });
        if (session) {
          const senderName = `Viewer_${userId.slice(-4)}`;

          await GiftTransaction.create({
            sessionId: session._id,
            fromUserId: userId,
            fromUserName: senderName,
            toStylistId: data.stylistId,
            giftId: data.giftId,
            giftName: data.giftName,
            giftIcon: data.giftIcon,
            coinAmount: data.coinAmount,
            animation: data.animation,
          });

          session.totalGifts = (session.totalGifts || 0) + 1;
          session.totalCoins = (session.totalCoins || 0) + data.coinAmount;
          await session.save();
        }

        liveNsp.to(room).emit('live:gift-received', {
          userId: userId,
          userName: `Viewer_${userId.slice(-4)}`,
          giftId: data.giftId,
          giftName: data.giftName,
          giftIcon: data.giftIcon,
          coinAmount: data.coinAmount,
          animation: data.animation,
        });
      } catch (err) {
        logger.error('[live:send-gift] error:', { error: (err as Error).message });
      }
    });

    socket.on('live:stream-end', async (data: { stylistId: string }) => {
      if (userRole !== 'stylist') return;
      try {
        const session = await LiveSession.findOne({ stylistId: data.stylistId, isLive: true });
        if (!session) return;
        const stylist = await Stylist.findOne({ userId });
        if (!stylist || stylist.id.toString() !== session.stylistId.toString()) {
          socket.emit('live:error', { message: 'You do not own this stream.' });
          return;
        }
      } catch (err) {
        logger.error('[live:stream-end] ownership check error:', { error: (err as Error).message });
        return;
      }
      const room = `live:${data.stylistId}`;
      liveNsp.to(room).emit('live:stream-ended', { stylistId: data.stylistId });
      roomMutedUsers.removeRoom(room).catch(() => {});
      roomBlockedUsers.removeRoom(room).catch(() => {});
      sessionLikers.removeRoom(room).catch(() => {});
    });

    socket.on('live:webrtc-offer', (data: { stylistId: string; offer: any; targetSocketId: string }) => {
      socket.to(data.targetSocketId).emit('live:webrtc-offer', {
        offer: data.offer,
        senderSocketId: socket.id,
      });
    });

    socket.on('live:webrtc-answer', (data: { stylistId: string; answer: any; targetSocketId: string }) => {
      socket.to(data.targetSocketId).emit('live:webrtc-answer', {
        answer: data.answer,
        senderSocketId: socket.id,
      });
    });

    socket.on('live:webrtc-ice-candidate', (data: { stylistId: string; candidate: any; targetSocketId: string }) => {
      socket.to(data.targetSocketId).emit('live:webrtc-ice-candidate', {
        candidate: data.candidate,
        senderSocketId: socket.id,
      });
    });

    socket.on('disconnect', async () => {
      if (currentRoom && userRole !== 'stylist' && !hasLeftRoom) {
        hasLeftRoom = true;
        const stylistId = currentRoom.replace('live:', '');
        try {
          const updatedSession = await LiveSession.findOneAndUpdate(
            { stylistId, isLive: true, viewerCount: { $gt: 0 } },
            { $inc: { viewerCount: -1 } },
            { new: true }
          );
          if (updatedSession) {
            await Stylist.findByIdAndUpdate(stylistId, { viewerCount: updatedSession.viewerCount });
            liveNsp.to(currentRoom).emit('live:viewer-count', { viewerCount: updatedSession.viewerCount });
          }
        } catch (err) {
          logger.error('[live:disconnect] viewer decrement error:', { error: (err as Error).message });
        }
      } else if (userRole === 'stylist' && userId) {
        try {
          const stylist = await Stylist.findOne({ userId });
          if (stylist && stylist.isLive) {
            const session = await LiveSession.findOne({ stylistId: stylist.id, isLive: true });
            if (session) {
              session.isLive = false;
              session.endedAt = new Date();
              if (session.startedAt) {
                session.durationMinutes = Math.round(
                  (session.endedAt.getTime() - session.startedAt.getTime()) / 60000
                );
              }
              await session.save();
            }
            stylist.isLive = false;
            stylist.liveTitle = undefined;
            stylist.viewerCount = 0;
            await stylist.save();
            liveNsp.emit('live:stylist-offline', { stylistId: stylist.id });
            io.emit('live:stylist-offline', { stylistId: stylist.id });
            const cleanupRoom = `live:${stylist.id}`;
            roomMutedUsers.removeRoom(cleanupRoom).catch(() => {});
            roomBlockedUsers.removeRoom(cleanupRoom).catch(() => {});
            sessionLikers.removeRoom(cleanupRoom).catch(() => {});
          }
        } catch (err) {
          logger.error('[live:disconnect] stylist cleanup error:', { error: (err as Error).message });
        }
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};