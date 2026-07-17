import { Types, FilterQuery, QueryOptions } from 'mongoose';
import { LiveSession, ILiveSession } from '../models/LiveSession';
import { LiveSessionStatus, LiveSessionQueryFilters } from '../types';

export class LiveSessionRepository {
  async findById(id: string): Promise<ILiveSession | null> {
    return LiveSession.findById(id);
  }

  async findByIdWithPopulate(id: string): Promise<ILiveSession | null> {
    return LiveSession.findById(id).populate('stylistId', 'name image category');
  }

  async findByRoomName(roomName: string): Promise<ILiveSession | null> {
    return LiveSession.findOne({ roomName });
  }

  async findActiveSessionByStylist(stylistId: string): Promise<ILiveSession | null> {
    return LiveSession.findOne({
      stylistId: new Types.ObjectId(stylistId),
      status: { $in: ['live', 'paused'] },
    });
  }

  async create(data: {
    stylistId: string;
    hostUserId: string;
    title: string;
    description?: string;
    category: string;
    tags?: string[];
    roomName: string;
    scheduledAt?: Date;
  }): Promise<ILiveSession> {
    return LiveSession.create({
      stylistId: new Types.ObjectId(data.stylistId),
      hostUserId: new Types.ObjectId(data.hostUserId),
      title: data.title,
      description: data.description || '',
      category: data.category,
      tags: data.tags || [],
      roomName: data.roomName,
      scheduledAt: data.scheduledAt,
      status: data.scheduledAt ? 'scheduled' : 'scheduled',
    });
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      category: string;
      tags: string[];
      settings: Partial<ILiveSession['settings']>;
    }>
  ): Promise<ILiveSession | null> {
    return LiveSession.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async updateStatus(
    id: string,
    status: LiveSessionStatus,
    additionalData?: Partial<{
      startedAt: Date;
      pausedAt: Date;
      endedAt: Date;
      durationMs: number;
    }>
  ): Promise<ILiveSession | null> {
    const updateData: Record<string, any> = { status };
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }
    return LiveSession.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  async incrementViewerCount(id: string): Promise<ILiveSession | null> {
    return LiveSession.findByIdAndUpdate(
      id,
      [
        {
          $set: {
            viewerCount: { $add: ['$viewerCount', 1] },
            totalViews: { $add: ['$totalViews', 1] },
            peakViewerCount: {
              $max: [{ $add: ['$viewerCount', 1] }, '$peakViewerCount'],
            },
          },
        },
      ],
      { new: true }
    );
  }

  async decrementViewerCount(id: string): Promise<ILiveSession | null> {
    return LiveSession.findByIdAndUpdate(
      id,
      { $inc: { viewerCount: -1 } },
      { new: true }
    );
  }

  async incrementLikeCount(id: string): Promise<ILiveSession | null> {
    return LiveSession.findByIdAndUpdate(
      id,
      { $inc: { likeCount: 1 } },
      { new: true }
    );
  }

  async incrementChatMessageCount(id: string): Promise<ILiveSession | null> {
    return LiveSession.findByIdAndUpdate(
      id,
      { $inc: { chatMessageCount: 1 } },
      { new: true }
    );
  }

  async incrementGiftCount(id: string, totalCredits: number): Promise<ILiveSession | null> {
    return LiveSession.findByIdAndUpdate(
      id,
      {
        $inc: {
          giftCount: 1,
          totalGiftValue: totalCredits,
        },
      },
      { new: true }
    );
  }

  async findSessions(filters: LiveSessionQueryFilters): Promise<ILiveSession[]> {
    const query: FilterQuery<ILiveSession> = {};

    if (filters.status) {
      query.status = filters.status;
    } else {
      // Default to only showing joinable sessions
      query.status = { $in: ['live', 'paused'] };
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.tag) {
      query.tags = filters.tag;
    }

    if (filters.stylistId) {
      query.stylistId = new Types.ObjectId(filters.stylistId);
    }

    if (filters.hostUserId) {
      query.hostUserId = new Types.ObjectId(filters.hostUserId);
    }

    const sort: Record<string, 1 | -1> = {};
    switch (filters.sort) {
      case 'trending':
        sort.peakViewerCount = -1;
        sort.likeCount = -1;
        break;
      case 'popular':
        sort.peakViewerCount = -1;
        break;
      case 'newest':
      default:
        sort.startedAt = -1;
        break;
    }

    // Apply cursor filter to query
    if (filters.cursor) {
      const cursorDate = new Date(filters.cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.startedAt = { $lt: cursorDate } as any;
      }
    }

    const limit = Math.min(filters.limit || 20, 50);

    const queryBuilder = LiveSession.find(query).sort(sort).limit(limit);

    return queryBuilder.populate('stylistId', 'name image category');
  }

  async findFeaturedSessions(limit: number = 20): Promise<ILiveSession[]> {
    return LiveSession.find({ status: 'live' })
      .sort({ peakViewerCount: -1, likeCount: -1 })
      .limit(Math.min(limit, 50))
      .populate('stylistId', 'name image category');
  }

  async delete(id: string): Promise<ILiveSession | null> {
    return LiveSession.findByIdAndDelete(id);
  }

  async countActiveSessions(): Promise<number> {
    return LiveSession.countDocuments({ status: { $in: ['live', 'paused'] } });
  }

  async findScheduledSessions(): Promise<ILiveSession[]> {
    return LiveSession.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() },
    });
  }
}

export const liveSessionRepository = new LiveSessionRepository();
