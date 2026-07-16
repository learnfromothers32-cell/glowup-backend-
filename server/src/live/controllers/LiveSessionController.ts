import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { LiveSessionService } from '../services/LiveSessionService';
import { getMediaProvider } from '../providers/factory';
import {
  CreateLiveSessionInput,
  UpdateLiveSessionInput,
  LiveSessionQueryFilters,
} from '../types';

// Initialize service with provider from environment config
// Provider is selected via LIVE_PROVIDER env var (mock or livekit)
const mediaProvider = getMediaProvider();
const sessionService = new LiveSessionService(mediaProvider);

/**
 * POST /api/live
 * Create a new live session.
 */
export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // TODO: Get stylistId from user's stylist profile
  // For now, use userId as stylistId (will be replaced when Stylist model integration is done)
  const stylistId = userId;

  const input: CreateLiveSessionInput = {
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    tags: req.body.tags,
    scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
  };

  const session = await sessionService.createSession(stylistId, userId, input);

  return sendSuccess(res, { session }, 'Session created successfully', 201);
});

/**
 * GET /api/live
 * Get sessions with filters (discovery feed).
 */
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const filters: LiveSessionQueryFilters = {
    category: req.query.category as string,
    tag: req.query.tag as string,
    stylistId: req.query.stylistId as string,
    sort: req.query.sort as 'trending' | 'newest' | 'popular',
    limit: parseInt(req.query.limit as string) || 20,
    cursor: req.query.cursor as string,
  };

  const sessions = await sessionService.discoverSessions(filters);

  return sendSuccess(res, { sessions }, 'Sessions retrieved successfully');
});

/**
 * GET /api/live/:id
 * Get session details.
 */
export const getSessionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const session = await sessionService.getSessionById(id);

  return sendSuccess(res, { session }, 'Session retrieved successfully');
});

/**
 * PATCH /api/live/:id
 * Update session details.
 */
export const updateSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { id } = req.params;

  const input: UpdateLiveSessionInput = {
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    tags: req.body.tags,
    settings: req.body.settings,
  };

  const session = await sessionService.updateSession(id, userId, input);

  return sendSuccess(res, { session }, 'Session updated successfully');
});

/**
 * DELETE /api/live/:id
 * Delete a session.
 */
export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { id } = req.params;

  await sessionService.deleteSession(id, userId);

  return sendSuccess(res, null, 'Session deleted successfully');
});

/**
 * POST /api/live/:id/start
 * Start a live session.
 */
export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { id } = req.params;

  const result = await sessionService.startSession(id, userId);

  return sendSuccess(res, result, 'Session started successfully');
});

/**
 * POST /api/live/:id/end
 * End a live session.
 */
export const endSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { id } = req.params;

  const session = await sessionService.endSession(id, userId);

  return sendSuccess(res, { session }, 'Session ended successfully');
});

/**
 * POST /api/live/:id/pause
 * Pause a live session.
 */
export const pauseSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { id } = req.params;

  const session = await sessionService.pauseSession(id, userId);

  return sendSuccess(res, { session }, 'Session paused successfully');
});

/**
 * POST /api/live/:id/resume
 * Resume a paused session.
 */
export const resumeSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { id } = req.params;

  const session = await sessionService.resumeSession(id, userId);

  return sendSuccess(res, { session }, 'Session resumed successfully');
});

/**
 * GET /api/live/:id/status
 * Get session status.
 */
export const getSessionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const status = await sessionService.getSessionStatus(id);

  return sendSuccess(res, status, 'Session status retrieved successfully');
});

/**
 * GET /api/live/featured
 * Get featured live sessions.
 */
export const getFeaturedSessions = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;

  const sessions = await sessionService.getFeaturedSessions(limit);

  return sendSuccess(res, { sessions }, 'Featured sessions retrieved successfully');
});

/**
 * POST /api/live/:id/join
 * Join a live session as a viewer (or host returning). Returns LiveKit token + server URL.
 */
export const joinSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { id } = req.params;

  const result = await sessionService.joinSession(id, userId);

  // Also return the LiveKit server URL for the client to connect to
  const provider = getMediaProvider();
  const health = await provider.healthCheck();

  return sendSuccess(res, {
    session: result.session,
    token: result.token,
    liveKitUrl: health.liveKitUrl || null,
  }, 'Joined session successfully');
});
