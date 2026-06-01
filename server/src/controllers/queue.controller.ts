import { Request, Response } from 'express';
import { Queue } from '../models/Queue';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { getIO } from '../socket';

export const getQueueStatus = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId } = req.params;

  const queue = await Queue.findOne({ stylistId });
  if (!queue) {
    return sendSuccess(res, {
      queue: {
        stylistId,
        entries: [],
        currentPosition: 0,
        predictedWaitMins: 0,
      }
    });
  }

  return sendSuccess(res, { queue: toPublicQueue(queue) });
});

export const advanceQueue = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { stylistId } = req.params;

  const stylist = await Stylist.findOne({ userId });
  if (!stylist || stylist.id !== stylistId) {
    throw new ApiError(403, 'Only the stylist can advance their queue');
  }

  const queue = await Queue.findOne({ stylistId });
  if (!queue) {
    throw new ApiError(404, 'Queue not found');
  }

  const inService = queue.entries.some(e => e.status === 'in-service');
  if (inService) {
    throw new ApiError(400, 'A customer is already being served. Mark them as done first.');
  }

  const nextWaiting = queue.entries.find(e => e.status === 'waiting');
  if (!nextWaiting) {
    return sendSuccess(res, { queue: toPublicQueue(queue) }, 'No waiting entries');
  }

  nextWaiting.status = 'in-service';
  queue.recalculate();
  await queue.save();

  emitQueueUpdate(stylistId, queue);

  return sendSuccess(res, { queue: toPublicQueue(queue) }, 'Queue advanced');
});

export const markDone = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { stylistId, entryUserId } = req.params;

  const stylist = await Stylist.findOne({ userId });
  if (!stylist || stylist.id !== stylistId) {
    throw new ApiError(403, 'Only the stylist can manage their queue');
  }

  const queue = await Queue.findOne({ stylistId });
  if (!queue) {
    throw new ApiError(404, 'Queue not found');
  }

  const entry = queue.entries.find(
    e => e.userId.toString() === entryUserId && e.status === 'in-service'
  );
  if (!entry) {
    throw new ApiError(404, 'Entry not found or not in service');
  }

  entry.status = 'done';

  const nextWaiting = queue.entries.find(e => e.status === 'waiting');
  if (nextWaiting) {
    nextWaiting.status = 'in-service';
  }

  queue.recalculate();
  await queue.save();

  emitQueueUpdate(stylistId, queue);

  return sendSuccess(res, { queue: toPublicQueue(queue) }, 'Customer marked as done');
});

function emitQueueUpdate(stylistId: string, queue: any) {
  try {
    const nsp = getIO().of('/queue');
    nsp.to(`queue:${stylistId}`).emit('queue:update', toPublicQueue(queue));
  } catch {}
}

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
