export type LiveSessionStatus = "scheduled" | "live" | "paused" | "ended";

export interface LiveSessionSettings {
  chatEnabled: boolean;
  slowModeMs: number;
  followersOnly: boolean;
  giftsEnabled: boolean;
  recordingEnabled: boolean;
  maxViewers: number;
}

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

export interface LiveSessionStylist {
  _id: string;
  name: string;
  image?: string;
  category: string;
}

export interface LiveSession {
  _id: string;
  stylistId: LiveSessionStylist | string;
  hostUserId: string;
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
  scheduledAt?: string;
  startedAt?: string;
  pausedAt?: string;
  endedAt?: string;
  durationMs: number;
  thumbnailUrl?: string;
  replayUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoverSessionsParams {
  status?: LiveSessionStatus;
  category?: string;
  tag?: string;
  sort?: "trending" | "newest" | "popular";
  cursor?: string;
  limit?: number;
  stylistId?: string;
}

export interface DiscoverSessionsResponse {
  sessions: LiveSession[];
}

export interface CreateLiveSessionParams {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  scheduledAt?: string;
}

export interface StartSessionResponse {
  session: LiveSession;
  token: string;
}

export interface JoinSessionResponse {
  session: LiveSession;
  token: string;
  liveKitUrl: string | null;
}

export interface SessionStatusResponse {
  status: LiveSessionStatus;
  viewerCount: number;
  likeCount: number;
  chatMessageCount: number;
}

export interface PresenceEntry {
  userId: string;
  socketId: string;
  role: "host" | "viewer" | "moderator" | "admin" | "guest";
  displayName: string;
  joinedAt: number;
  lastHeartbeat: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageId: string;
  sequenceNumber: number;
  type: string;
  replyTo?: string;
  createdAt: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ChatSendInput {
  sessionId: string;
  content: string;
  messageId: string;
  replyTo?: string;
}

export interface ChatAckResponse {
  success: boolean;
  messageId: string;
  serverMessageId: string;
  sequenceNumber: number;
}

export type SocketRole = "host" | "viewer" | "moderator" | "admin" | "guest";

// ── Moderation ──

export type ReactionType = "love" | "fire" | "clap" | "wow" | "glow";

export type GuestRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface ModerationNotification {
  sessionId: string;
  type: "muted" | "banned" | "message-removed" | "report-confirmed";
  message: string;
}

export interface GuestRequest {
  id: string;
  sessionId: string;
  viewerId: string;
  displayName: string;
  status: GuestRequestStatus;
  reason?: string;
  createdAt: string;
}

export interface ReactionReceived {
  sessionId: string;
  type: ReactionType;
  userId: string;
  counts: Record<string, number>;
}

export interface HostAnalytics {
  sessionId: string;
  reactionCounts: Record<string, number>;
  pendingRequests: number;
  mutedUsers: number;
  bannedUsers: number;
  viewerCount: number;
}
