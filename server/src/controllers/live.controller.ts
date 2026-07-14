import { Request, Response } from 'express';
import { LiveSession, LiveChatMessage, LiveSchedule, ILiveSession } from '../models/LiveSession';
import { LiveReport } from '../models/LiveReport';
import { GiftTransaction } from '../models/LiveGift';
import { Stylist } from '../models/Stylist';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { getIO } from '../socket';
import logger from '../utils/logger';

export const startLive = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { title, description, category, privacy } = req.body;

  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const staleThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000);

  let session = await LiveSession.findOne({
    stylistId: stylist.id,
    isLive: true,
    startedAt: { $gte: staleThreshold },
  });
  if (session) {
    return sendSuccess(res, { session: toPublicSession(session) }, 'Already live');
  }

  const staleSessions = await LiveSession.find({
    stylistId: stylist.id,
    isLive: true,
    startedAt: { $lt: staleThreshold },
  });
  if (staleSessions.length > 0) {
    const staleIds = staleSessions.map((s) => s._id);
    await LiveChatMessage.deleteMany({ sessionId: { $in: staleIds } });
    await GiftTransaction.deleteMany({ sessionId: { $in: staleIds } });
    await LiveSession.deleteMany({ _id: { $in: staleIds } });
  }

  session = await LiveSession.create({
    stylistId: stylist.id,
    title: title || 'Live Session',
    description: description || '',
    category: category || 'hairstyling',
    privacy: privacy || 'public',
    isLive: true,
    startedAt: new Date(),
    viewerCount: 0,
    peakViewers: 0,
  });

  stylist.isLive = true;
  stylist.liveTitle = title || 'Live Session';
  stylist.viewerCount = 0;
  await stylist.save();

  try {
    const io = getIO();
    const payload = {
      stylistId: stylist.id,
      name: stylist.name,
      image: stylist.image,
      category: session.category,
      title: session.title,
    };
    io.of('/live').emit('live:stylist-online', payload);
    io.emit('live:stylist-online', payload);
  } catch (err) {
    logger.error('[live] broadcast error:', { error: (err as Error).message });
  }

  // Notify followers
  try {
    const followers = await User.find({ favorites: stylist.id });
    if (followers.length > 0) {
      const notifDocs = followers.map((f) => ({
        userId: f._id,
        type: 'live' as const,
        title: `${stylist.name} is now live`,
        message: session.title || `${stylist.name} just started a live stream`,
        link: `/app/live/${stylist.id}`,
      }));
      await Notification.insertMany(notifDocs);
    }
  } catch (err) {
    logger.error('[live] notification error:', { error: (err as Error).message });
  }

  return sendSuccess(res, { session: toPublicSession(session) }, 'Stream started', 201);
});

export const stopLive = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const session = await LiveSession.findOne({ stylistId: stylist.id, isLive: true });
  if (!session) throw new ApiError(404, 'No active live session');

  session.isLive = false;
  session.endedAt = new Date();
  if (session.startedAt) {
    session.durationMinutes = Math.round(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 60000
    );
  }
  await session.save();

  stylist.isLive = false;
  stylist.liveTitle = undefined;
  stylist.viewerCount = 0;
  await stylist.save();

  try {
    getIO().of('/live').emit('live:stylist-offline', { stylistId: stylist.id });
    getIO().emit('live:stylist-offline', { stylistId: stylist.id });
  } catch (err) {
    logger.error('[socket] broadcast stopLive error:', { error: (err as Error).message });
  }

  return sendSuccess(res, { session: toPublicSession(session) }, 'Stream ended');
});

export const getLiveSession = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId } = req.params;
  const userId = req.user?.id;

  const session = await LiveSession.findOne({ stylistId, isLive: true });
  if (!session) {
    return sendSuccess(res, { session: null }, 'No active session');
  }

  if (session.privacy === 'private') {
    if (!userId) throw new ApiError(403, 'This is a private stream');
    const stylist = await Stylist.findById(stylistId).select('userId');
    if (stylist?.userId?.toString() !== userId) {
      throw new ApiError(403, 'This is a private stream');
    }
  }

  if (session.privacy === 'followers') {
    if (!userId) throw new ApiError(403, 'This stream is for followers only');
    const user = await User.findById(userId).select('favorites');
    const isFollower = user?.favorites?.some((f) => f.toString() === stylistId);
    if (!isFollower) {
      throw new ApiError(403, 'This stream is for followers only');
    }
  }

  const recentMessages = await LiveChatMessage.find({ sessionId: session._id })
    .sort({ createdAt: -1 })
    .limit(50);

  return sendSuccess(res, {
    session: toPublicSession(session),
    messages: recentMessages.reverse()
  });
});

export const getLiveMessages = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { before } = req.query;

  const filter: any = { sessionId };
  if (before) {
    filter._id = { $lt: before };
  }

  const messages = await LiveChatMessage.find(filter)
    .sort({ createdAt: -1 })
    .limit(30);

  return sendSuccess(res, { messages: messages.reverse() });
});

export const getTrendingStreams = asyncHandler(async (req: Request, res: Response) => {
  const { category, limit = '20' } = req.query;
  const userId = req.user?.id;

  const filter: any = { isLive: true };
  if (category && category !== 'all') {
    filter.category = category;
  }

  const sessions = await LiveSession.find(filter)
    .sort({ viewerCount: -1 })
    .limit(parseInt(limit as string, 10))
    .populate('stylistId', 'name image category location isVerified');

  let followedIds = new Set<string>();
  if (userId) {
    const user = await User.findById(userId).select('favorites');
    if (user?.favorites) {
      followedIds = new Set(user.favorites.map((f) => f.toString()));
    }
  }

  const streams = await Promise.all(sessions.map(async (s) => {
    const stylist = s.stylistId as any;
    const stylistIdStr = (stylist?._id || s.stylistId).toString();
    return {
      id: s._id,
      stylistId: stylist?._id || s.stylistId,
      stylist: {
        id: stylist?._id || s.stylistId,
        name: stylist?.name || 'Unknown',
        image: stylist?.image,
        isVerified: stylist?.isVerified || false,
        isFollowing: followedIds.has(stylistIdStr),
        role: 'stylist',
      },
      title: s.title,
      category: s.category,
      viewerCount: s.viewerCount,
      isLive: s.isLive,
      startedAt: s.startedAt,
    };
  }));

  return sendSuccess(res, { streams });
});

export const getLiveCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await LiveSession.distinct('category', { isLive: true });
  return sendSuccess(res, { categories });
});

export const reportStream = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { sessionId, reason, details } = req.body;

  if (!sessionId || !reason) {
    throw new ApiError(400, 'Session ID and reason are required');
  }

  await LiveReport.create({
    sessionId,
    reportedBy: userId || 'anonymous',
    reason,
    details,
    status: 'pending',
  });

  return sendSuccess(res, null, 'Report submitted');
});

export const reportComment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { messageId, sessionId, reason } = req.body;

  if (!messageId || !reason) {
    throw new ApiError(400, 'Message ID and reason are required');
  }

  await LiveReport.create({
    sessionId,
    messageId,
    reportedBy: userId || 'anonymous',
    reason,
    type: 'comment',
    status: 'pending',
  });

  return sendSuccess(res, null, 'Comment reported');
});

export const getLiveFeed = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { page = '1', limit = '10', filter = 'all' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  let query: any = { isLive: true };

  if (filter === 'following' && userId) {
    const user = await User.findById(userId);
    const followedStylistIds = user?.favorites || [];
    query.stylistId = { $in: followedStylistIds };
  } else if (filter !== 'all' && filter !== 'following') {
    query.category = filter;
  }

  const [sessions, total] = await Promise.all([
    LiveSession.find(query)
      .sort({ viewerCount: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('stylistId', 'name image category location isVerified'),
    LiveSession.countDocuments(query),
  ]);

  let followedIds = new Set<string>();
  if (userId) {
    const user = await User.findById(userId).select('favorites');
    if (user?.favorites) {
      followedIds = new Set(user.favorites.map((f) => f.toString()));
    }
  }

  const streams = sessions.map((s) => {
    const stylist = s.stylistId as any;
    const stylistIdStr = (stylist?._id || s.stylistId).toString();
    return {
      id: s._id,
      stylistId: stylist?._id || s.stylistId,
      stylist: {
        id: stylist?._id || s.stylistId,
        name: stylist?.name || 'Unknown',
        image: stylist?.image,
        isVerified: stylist?.isVerified || false,
        isFollowing: followedIds.has(stylistIdStr),
        role: 'stylist',
      },
      title: s.title,
      category: s.category,
      viewerCount: s.viewerCount,
      isLive: s.isLive,
      startedAt: s.startedAt,
    };
  });

  return sendSuccess(res, {
    streams,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      hasMore: skip + sessions.length < total,
    },
  });
});

export const scheduleLive = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { title, description, category, scheduledAt, durationMinutes } = req.body;

  if (!title || !scheduledAt) {
    throw new ApiError(400, 'Title and scheduled time are required');
  }

  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const schedule = await LiveSchedule.create({
    stylistId: stylist.id,
    title,
    description: description || '',
    category: category || 'hairstyling',
    scheduledAt: new Date(scheduledAt),
    durationMinutes: durationMinutes || 30,
  });

  return sendSuccess(res, { schedule }, 'Session scheduled', 201);
});

export const getUpcomingSessions = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = { scheduledAt: { $gte: new Date() }, isCancelled: false };

  const [schedules, total] = await Promise.all([
    LiveSchedule.find(query)
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limitNum)
      .populate('stylistId', 'name image isVerified'),
    LiveSchedule.countDocuments(query),
  ]);

  const sessions = schedules.map((s) => {
    const stylist = s.stylistId as any;
    return {
      id: s._id,
      hostId: stylist?._id || s.stylistId,
      host: {
        id: stylist?._id || s.stylistId,
        name: stylist?.name || 'Unknown',
        image: stylist?.image,
        isVerified: stylist?.isVerified || false,
        isFollowing: false,
      },
      title: s.title,
      description: s.description,
      category: s.category,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      reminder: false,
    };
  });

  return sendSuccess(res, {
    upcoming: sessions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      hasMore: skip + schedules.length < total,
    },
  });
});

export const getPastSessions = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', category } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const query: any = { isLive: false, endedAt: { $exists: true } };
  if (category && category !== 'all') {
    query.category = category;
  }

  const [sessions, total] = await Promise.all([
    LiveSession.find(query)
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('stylistId', 'name image isVerified'),
    LiveSession.countDocuments(query),
  ]);

  const past = sessions.map((s) => {
    const stylist = s.stylistId as any;
    return {
      id: s._id,
      hostId: stylist?._id || s.stylistId,
      host: {
        id: stylist?._id || s.stylistId,
        name: stylist?.name || 'Unknown',
        image: stylist?.image,
        isVerified: stylist?.isVerified || false,
      },
      title: s.title,
      description: s.description,
      category: s.category,
      recordedAt: s.endedAt,
      durationMinutes: s.durationMinutes,
      viewCount: s.peakViewers || s.viewerCount,
      thumbnail: undefined as string | undefined,
      recordingUrl: s.recordingUrl,
    };
  });

  return sendSuccess(res, {
    past,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      hasMore: skip + sessions.length < total,
    },
  });
});

function toPublicSession(session: ILiveSession) {
  return {
    id: session._id,
    stylistId: session.stylistId,
    title: session.title,
    description: session.description,
    category: session.category,
    privacy: session.privacy,
    isLive: session.isLive,
    startedAt: session.startedAt,
    scheduledAt: session.scheduledAt,
    endedAt: session.endedAt,
    durationMinutes: session.durationMinutes,
    viewerCount: session.viewerCount,
    peakViewers: session.peakViewers,
    recordingUrl: session.recordingUrl,
    tags: session.tags,
  };
}
