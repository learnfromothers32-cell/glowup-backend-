import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import * as liveService from '../services/live.service';
import { getIO } from '../socket';
import logger from '../utils/logger';

export const createLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');

  const { title, category, thumbnail } = req.body;
  if (!title || !category) {
    throw new ApiError(400, 'Title and category are required');
  }

  const { session, token, wsUrl } = await liveService.createSession(userId, title, category, thumbnail);
  sendSuccess(res, { session, token, wsUrl }, 'Session created', 201);
});

export const startLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');

  const { id } = req.params;
  const session = await liveService.startSession(id, userId);

  try {
    const io = getIO();
    io.of('/live').emit('live:session-started', {
      sessionId: session._id,
      stylistId: session.stylistId,
      title: session.title,
      category: session.category,
      thumbnail: session.thumbnail,
      startedAt: session.startedAt,
    });
  } catch (err) {
    logger.warn('Failed to broadcast live:session-started', { error: err });
  }

  sendSuccess(res, { session });
});

export const endLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');

  const { id } = req.params;
  const session = await liveService.endSession(id, userId);

  try {
    const io = getIO();
    io.of('/live').emit('live:session-ended', {
      sessionId: session._id,
      stylistId: session.stylistId,
    });
  } catch (err) {
    logger.warn('Failed to broadcast live:session-ended', { error: err });
  }

  sendSuccess(res, { session });
});

export const getActiveLiveSessions = asyncHandler(async (_req: Request, res: Response) => {
  const sessions = await liveService.getActiveSessions();
  sendSuccess(res, { sessions });
});

export const getLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = await liveService.getSessionById(id);
  if (!session) throw new ApiError(404, 'Session not found');
  sendSuccess(res, { session });
});

export const joinLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, 'Authentication required');

  const { id } = req.params;
  const { token, wsUrl, session } = await liveService.joinSession(id, userId);
  sendSuccess(res, { token, wsUrl, session });
});

export const liveSessionWebhook = asyncHandler(async (req: Request, res: Response) => {
  try {
    await liveService.handleWebhook(req.body);
  } catch (err) {
    logger.error('Webhook processing failed', { error: err });
  }
  res.status(200).json({ ok: true });
});

export const cleanupStaleSessions = asyncHandler(async (_req: Request, res: Response) => {
  const count = await liveService.cleanupStaleSessions();
  sendSuccess(res, { cleaned: count }, 'Stale sessions cleaned');
});
