import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { appConfig } from '../config/app';
import { verifyAccessToken } from '../utils/token';
import { Queue } from '../models/Queue';

let io: Server;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: appConfig.clientUrl,
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const payload = verifyAccessToken(token as string);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  const queueNsp = io.of('/queue');

  queueNsp.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id;

    socket.on('queue:join', async (data: { stylistId: string; bookingId?: string }) => {
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
          status: 'waiting',
          bookingId: bookingId ? new (require('mongoose').Types.ObjectId)(bookingId) : undefined,
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

    socket.on('disconnect', () => {});
  });

  return io;
};

function toPublicQueue(queue: any) {
  return {
    id: queue._id || queue.id,
    stylistId: queue.stylistId,
    currentPosition: queue.currentPosition,
    predictedWaitMins: queue.predictedWaitMins,
    avgServiceDuration: queue.avgServiceDuration,
    lastUpdated: queue.lastUpdated,
    entries: queue.entries
      .filter((e: any) => e.status !== 'done' && e.status !== 'skipped')
      .map((e: any) => ({
        userId: e.userId,
        position: e.position,
        status: e.status,
        estimatedServiceMins: e.estimatedServiceMins,
        joinedAt: e.joinedAt,
      })),
  };
}

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};
