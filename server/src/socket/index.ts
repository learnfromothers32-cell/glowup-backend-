import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { appConfig } from '../config/app';
import { verifyAccessToken } from '../utils/token';
import { Queue } from '../models/Queue';
import { Conversation } from '../models/Conversation';
import { Stylist } from '../models/Stylist';
import logger from '../utils/logger';
import { toPublicQueue } from '../utils/queue';

let io: Server;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        const allowed = [
          appConfig.clientUrl,
          'http://localhost:5173',
          'http://localhost:5000',
        ];
        if (!origin || allowed.some((a) => origin?.startsWith(a))) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

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
        let queue = await Queue.findOne({ stylistId });

        if (!queue) {
          queue = await Queue.create({ stylistId, entries: [] });
        }

        const alreadyJoined = queue.entries.some(
          (e) => e.userId.toString() === userId && e.status === 'waiting'
        );
        if (alreadyJoined) {
          socket.emit('queue:error', { message: 'Already in queue' });
          return;
        }

        const waitingCount = queue.entries.filter(
          (e) => e.status === 'waiting'
        ).length;

        queue.entries.push({
          userId,
          position: waitingCount + 1,
          joinedAt: new Date(),
          estimatedServiceMins: queue.avgServiceDuration || 30,
          estimatedWaitMins: 0,
          status: 'waiting',
          bookingId: bookingId ? new mongoose.Types.ObjectId(bookingId) : undefined,
        });

        queue.recalculate();
        await queue.save();

        socket.join(`queue:${stylistId}`);
        socket.emit('queue:joined', { position: waitingCount + 1, queue: toPublicQueue(queue) });

        queueNsp.to(`queue:${stylistId}`).emit('queue:update', toPublicQueue(queue));
      } catch (err: any) {
        socket.emit('queue:error', { message: err.message });
      }
    });

    socket.on('queue:leave', async (data: { stylistId: string }) => {
      try {
        const { stylistId } = data;
        const queue = await Queue.findOne({ stylistId });
        if (!queue) return;

        queue.entries = queue.entries.filter(
          (e) => !(e.userId.toString() === userId && e.status === 'waiting')
        );

        queue.recalculate();
        await queue.save();

        socket.leave(`queue:${stylistId}`);
        socket.emit('queue:left');

        queueNsp.to(`queue:${stylistId}`).emit('queue:update', toPublicQueue(queue));
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
    }

    socket.on('disconnect', () => {});
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

    socket.on('disconnect', () => {});
  });

  // ── Live streaming namespace ──
  const liveNsp = io.of('/live');

  // ── Per-room moderation state ──
  const roomMutedUsers = new Map<string, Set<string>>();
  const roomBlockedUsers = new Map<string, Set<string>>();

  // ── Per-user rate limiting ──
  const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_WINDOW = 10_000; // 10 seconds
  const RATE_LIMIT_MAX = 30;        // max events per window

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

    // ── Helper: remove stale room state when leaving ──
    function cleanupModeration(room: string) {
      const clients = liveNsp.adapter.rooms?.get(room);
      if (!clients || clients.size === 0) {
        roomMutedUsers.delete(room);
        roomBlockedUsers.delete(room);
      }
    }

    socket.on('live:join-room', async (data: { stylistId: string }) => {
      const { stylistId } = data;
      currentRoom = `live:${stylistId}`;
      socket.join(currentRoom);

      if (userRole !== 'stylist') {
        try {
          const { LiveSession } = await import('../models/LiveSession');
          const session = await LiveSession.findOne({ stylistId, isLive: true });
          if (session) {
            session.viewerCount += 1;
            if (session.viewerCount > session.peakViewers) {
              session.peakViewers = session.viewerCount;
            }
            await session.save();
            const { Stylist } = await import('../models/Stylist');
            await Stylist.findByIdAndUpdate(stylistId, { viewerCount: session.viewerCount });
            liveNsp.to(currentRoom).emit('live:viewer-count', { viewerCount: session.viewerCount });
          }
        } catch (err) {
          logger.error('[live:join-room] error:', { error: (err as Error).message });
        }
      }

      const viewerId = userId || `anon_${socket.id.slice(-6)}`;
      liveNsp.to(currentRoom).emit('live:user-joined', { userId: viewerId, userRole, socketId: socket.id });
    });

    socket.on('live:leave-room', async () => {
      if (!currentRoom) return;
      const stylistId = currentRoom.replace('live:', '');

      if (userRole !== 'stylist') {
        try {
          const { LiveSession } = await import('../models/LiveSession');
          const session = await LiveSession.findOne({ stylistId, isLive: true });
          if (session && session.viewerCount > 0) {
            session.viewerCount -= 1;
            await session.save();
            const { Stylist } = await import('../models/Stylist');
            await Stylist.findByIdAndUpdate(stylistId, { viewerCount: session.viewerCount });
            liveNsp.to(currentRoom).emit('live:viewer-count', { viewerCount: session.viewerCount });
          }
        } catch (err) {
          logger.error('[live:leave-room] error:', { error: (err as Error).message });
        }
      }

      socket.leave(currentRoom);
      const viewerId = userId || `anon_${socket.id.slice(-6)}`;
      liveNsp.to(currentRoom).emit('live:user-left', { userId: viewerId, userRole, socketId: socket.id });
      cleanupModeration(currentRoom);
      currentRoom = null;
    });

    socket.on('live:send-message', async (data: { stylistId: string; message: string; parentId?: string }) => {
      if (!data.message?.trim()) return;
      const room = `live:${data.stylistId}`;

      // Rate limit
      const rateKey = `msg:${userId || socket.id}`;
      if (!checkRateLimit(rateKey)) {
        socket.emit('live:error', { message: 'Too many messages. Slow down.' });
        return;
      }

      // Moderation check
      const muted = roomMutedUsers.get(room);
      const blocked = roomBlockedUsers.get(room);
      if (userId) {
        if (blocked?.has(userId)) return;
        if (muted?.has(userId)) return;
      }

      try {
        const { LiveSession, LiveChatMessage } = await import('../models/LiveSession');
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
          message: data.message.trim()
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
          message: data.message.trim(),
          parentId: data.parentId,
          createdAt: msg.createdAt
        });
      } catch (err) {
        logger.error('[live:send-message] error:', { error: (err as Error).message });
      }
    });

    const sessionLikers = new Map<string, Set<string>>();

    socket.on('live:like', async (data: { stylistId: string }) => {
      const room = `live:${data.stylistId}`;
      const likerId = userId || socket.id;
      if (!sessionLikers.has(data.stylistId)) {
        sessionLikers.set(data.stylistId, new Set());
      }
      const likers = sessionLikers.get(data.stylistId)!;
      if (likers.has(likerId)) return;
      likers.add(likerId);
      try {
        const { LiveSession } = await import('../models/LiveSession');
        const session = await LiveSession.findOne({ stylistId: data.stylistId, isLive: true });
        if (session) {
          session.reactionCounts.like = likers.size;
          await session.save();
          liveNsp.to(room).emit('live:like-update', {
            totalLikes: likers.size,
            userId: likerId,
          });
        }
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
        const { LiveSession } = await import('../models/LiveSession');
        const session = await LiveSession.findOne({ stylistId: data.stylistId, isLive: true });
        if (session) {
          const key = `reactionCounts.${data.reaction}` as const;
          (session as any)[key] = ((session as any)[key] || 0) + 1;
          session.peakViewers = Math.max(session.peakViewers, session.viewerCount);
          await session.save();
        }
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
        const { LiveChatMessage } = await import('../models/LiveSession');
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
        const { LiveChatMessage } = await import('../models/LiveSession');
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
        const { LiveChatMessage } = await import('../models/LiveSession');
        await LiveChatMessage.findByIdAndDelete(data.messageId);
      } catch (err) {
        logger.error('[live:remove-message] error:', { error: (err as Error).message });
      }
      liveNsp.to(room).emit('live:message-removed', { messageId: data.messageId, userId: userId || socket.id });
    });

    socket.on('live:mute-user', (data: { stylistId: string; targetUserId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      if (!roomMutedUsers.has(room)) roomMutedUsers.set(room, new Set());
      roomMutedUsers.get(room)!.add(data.targetUserId);
      liveNsp.to(room).emit('live:user-muted', { targetUserId: data.targetUserId, userId: userId || socket.id });
    });

    socket.on('live:unmute-user', (data: { stylistId: string; targetUserId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      roomMutedUsers.get(room)?.delete(data.targetUserId);
      liveNsp.to(room).emit('live:user-unmuted', { targetUserId: data.targetUserId, userId: userId || socket.id });
    });

    socket.on('live:block-user', (data: { stylistId: string; targetUserId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      if (!roomBlockedUsers.has(room)) roomBlockedUsers.set(room, new Set());
      roomBlockedUsers.get(room)!.add(data.targetUserId);
      liveNsp.to(room).emit('live:user-blocked', { targetUserId: data.targetUserId, userId: userId || socket.id });
    });

    socket.on('live:unblock-user', (data: { stylistId: string; targetUserId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      roomBlockedUsers.get(room)?.delete(data.targetUserId);
      liveNsp.to(room).emit('live:user-unblocked', { targetUserId: data.targetUserId, userId: userId || socket.id });
    });

    socket.on('live:send-gift', async (data: { stylistId: string; giftId: string; giftName: string; giftIcon: string; coinAmount: number; animation: 'small' | 'medium' | 'large' }) => {
      const room = `live:${data.stylistId}`;
      const rateKey = `gift:${userId || socket.id}`;
      if (!checkRateLimit(rateKey)) return;
      try {
        const { GiftTransaction } = await import('../models/LiveGift');
        const { LiveSession } = await import('../models/LiveSession');
        const session = await LiveSession.findOne({ stylistId: data.stylistId, isLive: true });
        if (session) {
          const senderId = userId || `anon_${socket.id.slice(-6)}`;
          const senderName = userRole === 'stylist' ? 'Stylist' : (userId ? `Viewer_${userId.slice(-4)}` : `Guest_${socket.id.slice(-4)}`);

          await GiftTransaction.create({
            sessionId: session._id,
            fromUserId: senderId,
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
      } catch (err) {
        logger.error('[live:send-gift] error:', { error: (err as Error).message });
      }
      liveNsp.to(room).emit('live:gift-received', {
        userId: userId || socket.id,
        userName: userRole === 'stylist' ? 'Stylist' : (userId ? `Viewer_${userId.slice(-4)}` : `Guest_${socket.id.slice(-4)}`),
        giftId: data.giftId,
        giftName: data.giftName,
        giftIcon: data.giftIcon,
        coinAmount: data.coinAmount,
        animation: data.animation,
      });
    });

    socket.on('live:stream-end', async (data: { stylistId: string }) => {
      if (userRole !== 'stylist') return;
      const room = `live:${data.stylistId}`;
      liveNsp.to(room).emit('live:stream-ended', { stylistId: data.stylistId });
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
      if (currentRoom && userRole !== 'stylist') {
        const stylistId = currentRoom.replace('live:', '');
        try {
          const { LiveSession } = await import('../models/LiveSession');
          const session = await LiveSession.findOne({ stylistId, isLive: true });
          if (session && session.viewerCount > 0) {
            session.viewerCount -= 1;
            await session.save();
            const { Stylist } = await import('../models/Stylist');
            await Stylist.findByIdAndUpdate(stylistId, { viewerCount: session.viewerCount });
            liveNsp.to(currentRoom).emit('live:viewer-count', { viewerCount: session.viewerCount });
          }
        } catch (err) {
          logger.error('[live:disconnect] viewer decrement error:', { error: (err as Error).message });
        }
        cleanupModeration(currentRoom);
      } else if (userRole === 'stylist' && userId) {
        try {
          const { Stylist } = await import('../models/Stylist');
          const stylist = await Stylist.findOne({ userId });
          if (stylist && stylist.isLive) {
            const { LiveSession } = await import('../models/LiveSession');
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
