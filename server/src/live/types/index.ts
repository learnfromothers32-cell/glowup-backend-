import { Types } from 'mongoose';

// ── Session Status ──
export type LiveSessionStatus = 'scheduled' | 'live' | 'paused' | 'ended';

// ── Session Settings ──
export interface LiveSessionSettings {
  chatEnabled: boolean;
  slowModeMs: number;
  followersOnly: boolean;
  giftsEnabled: boolean;
  recordingEnabled: boolean;
  maxViewers: number;
}

// ── Pinned Items ──
export interface PinnedProduct {
  productId: Types.ObjectId;
  pinnedAt: Date;
}

export interface PinnedService {
  serviceId: Types.ObjectId;
  pinnedAt: Date;
}

// ── Session Metrics ──
export interface LiveSessionMetrics {
  viewerCount: number;
  peakViewerCount: number;
  totalViews: number;
  uniqueViewerCount: number;
  likeCount: number;
  chatMessageCount: number;
  giftCount: number;
  totalGiftValue: number;
  bookingCount: number;
}

// ── Create Session Input ──
export interface CreateLiveSessionInput {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  scheduledAt?: Date;
}

// ── Update Session Input ──
export interface UpdateLiveSessionInput {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  settings?: Partial<LiveSessionSettings>;
}

// ── Session Query Filters ──
export interface LiveSessionQueryFilters {
  status?: LiveSessionStatus;
  category?: string;
  tag?: string;
  stylistId?: string;
  hostUserId?: string;
  sort?: 'trending' | 'newest' | 'popular';
  limit?: number;
  cursor?: string;
}

// ── Participant Role ──
export type ParticipantRole = 'host' | 'moderator' | 'viewer';

// ── Moderation Action ──
export type ModerationAction =
  | 'mute'
  | 'unmute'
  | 'kick'
  | 'ban'
  | 'unban'
  | 'delete_message'
  | 'report'
  | 'slow_mode_change'
  | 'chat_toggle'
  | 'gifts_toggle';

// ── Session State Machine ──
export const SESSION_STATUS_TRANSITIONS: Record<LiveSessionStatus, LiveSessionStatus[]> = {
  scheduled: ['live', 'ended'],
  live: ['paused', 'ended'],
  paused: ['live', 'ended'],
  ended: [],
};

// ── Service Result Types ──
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// ── Session with Populated Fields ──
export interface LiveSessionPopulated {
  _id: Types.ObjectId;
  stylistId: {
    _id: Types.ObjectId;
    name: string;
    image?: string;
    category: string;
  };
  hostUserId: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: LiveSessionStatus;
  roomName: string;
  viewerCount: number;
  peakViewerCount: number;
  totalViews: number;
  uniqueViewerCount: number;
  likeCount: number;
  chatMessageCount: number;
  giftCount: number;
  totalGiftValue: number;
  bookingCount: number;
  settings: LiveSessionSettings;
  pinnedProducts: PinnedProduct[];
  pinnedServices: PinnedService[];
  scheduledAt?: Date;
  startedAt?: Date;
  pausedAt?: Date;
  endedAt?: Date;
  durationMs: number;
  replayUrl?: string;
  thumbnailUrl?: string;
  replayStatus: 'none' | 'processing' | 'ready' | 'failed';
  averageWatchTimeMs: number;
  reportCount: number;
  isUnderReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}
