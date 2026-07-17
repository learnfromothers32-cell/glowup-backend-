import { create } from "zustand";
import type { LiveSessionStatus, ChatMessage, PresenceEntry } from "../live.types";

// ── Types ──

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "failed";
export type LiveAvailability = "available" | "busy" | "fully-booked" | "on-break" | "queue-only";
export type ReactionType = "love" | "fire" | "clap" | "wow" | "glow";
export type GuestRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface ActiveReaction {
  id: string;
  type: ReactionType;
  x: number;
  createdAt: number;
}

export interface PinnedServiceData {
  serviceId: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

export interface LiveService {
  _id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  popular?: boolean;
}

export interface LiveProduct {
  _id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  description?: string;
}

export interface LiveStylistProfile {
  _id: string;
  name: string;
  image?: string;
  category: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  followerCount: number;
  isFollowing: boolean;
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

export interface LiveRoomState {
  // ── Connection ──
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  connectionError: string | null;

  // ── Session ──
  isHost: boolean;
  sessionStatus: LiveSessionStatus;
  isHostOnline: boolean;
  token: string | null;

  // ── Viewers ──
  viewerCount: number;
  presence: PresenceEntry[];

  // ── Media ──
  cameraEnabled: boolean;
  micEnabled: boolean;
  speaking: boolean;

  // ── Commerce ──
  pinnedService: PinnedServiceData | null;
  availability: LiveAvailability;
  shelfVisible: boolean;
  services: LiveService[];
  products: LiveProduct[];
  stylistProfile: LiveStylistProfile | null;
  bookingCount: number;
  revenueToday: number;
  productsSold: number;

  // ── Chat ──
  messages: ChatMessage[];
  pendingMessageIds: Set<string>;
  historyCursor: string | null;
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;
  slowModeMs: number;
  pinnedMessageId: string | null;

  // ── Reactions ──
  reactionCounts: Record<ReactionType, number>;
  activeReactions: ActiveReaction[];
  myLastReactionTime: number;

  // ── Moderation ──
  mutedUsers: Set<string>;
  bannedUsers: Set<string>;
  pendingReports: number;

  // ── Guest Requests ──
  myRequestStatus: GuestRequestStatus | null;
  pendingRequests: GuestRequest[];
}

export interface LiveRoomActions {
  // ── Connection ──
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSessionId: (id: string | null) => void;
  setConnectionError: (error: string | null) => void;

  // ── Session ──
  setIsHost: (isHost: boolean) => void;
  setSessionStatus: (status: LiveSessionStatus) => void;
  setHostOnline: (online: boolean) => void;
  setToken: (token: string | null) => void;

  // ── Viewers ──
  setViewerCount: (count: number) => void;
  setPresence: (entries: PresenceEntry[]) => void;
  addPresence: (entry: PresenceEntry) => void;
  removePresence: (socketId: string) => void;

  // ── Media ──
  setCameraEnabled: (enabled: boolean) => void;
  setMicEnabled: (enabled: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  toggleCamera: () => void;
  toggleMic: () => void;

  // ── Commerce ──
  setPinnedService: (service: PinnedServiceData | null) => void;
  setAvailability: (availability: LiveAvailability) => void;
  setShelfVisible: (visible: boolean) => void;
  setServices: (services: LiveService[]) => void;
  setProducts: (products: LiveProduct[]) => void;
  setStylistProfile: (profile: LiveStylistProfile | null) => void;
  incrementBookingCount: () => void;
  addRevenue: (amount: number) => void;
  incrementProductsSold: () => void;

  // ── Chat ──
  addMessage: (msg: ChatMessage) => void;
  addPendingMessage: (messageId: string) => void;
  confirmPendingMessage: (messageId: string, serverId: string) => void;
  removePendingMessage: (messageId: string) => void;
  setChatHistory: (messages: ChatMessage[], hasMore: boolean, cursor?: string) => void;
  prependChatHistory: (messages: ChatMessage[], hasMore: boolean, cursor?: string) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  deleteMessage: (messageId: string) => void;
  pinMessage: (messageId: string) => void;
  setSlowModeMs: (ms: number) => void;

  // ── Reactions ──
  setReactionCounts: (counts: Record<string, number>) => void;
  addReaction: (type: ReactionType, userId: string) => void;
  canSendReaction: () => boolean;

  // ── Moderation ──
  addMutedUser: (userId: string) => void;
  removeMutedUser: (userId: string) => void;
  addBannedUser: (userId: string) => void;
  removeBannedUser: (userId: string) => void;
  incrementPendingReports: () => void;

  // ── Guest Requests ──
  setMyRequestStatus: (status: GuestRequestStatus | null) => void;
  addPendingRequest: (request: GuestRequest) => void;
  removePendingRequest: (requestId: string) => void;

  // ── Reset ──
  resetRoom: () => void;
}

const MAX_MESSAGES = 200;
const RATE_LIMIT_MS = 500;
let reactionIdCounter = 0;

const initialRoomState: LiveRoomState = {
  connectionStatus: "disconnected",
  sessionId: null,
  connectionError: null,
  isHost: false,
  sessionStatus: "scheduled",
  isHostOnline: false,
  token: null,
  viewerCount: 0,
  presence: [],
  cameraEnabled: true,
  micEnabled: true,
  speaking: false,
  pinnedService: null,
  availability: "available",
  shelfVisible: false,
  services: [],
  products: [],
  stylistProfile: null,
  bookingCount: 0,
  revenueToday: 0,
  productsSold: 0,
  messages: [],
  pendingMessageIds: new Set(),
  historyCursor: null,
  hasMoreHistory: true,
  isLoadingHistory: false,
  slowModeMs: 0,
  pinnedMessageId: null,
  reactionCounts: { love: 0, fire: 0, clap: 0, wow: 0, glow: 0 },
  activeReactions: [],
  myLastReactionTime: 0,
  mutedUsers: new Set(),
  bannedUsers: new Set(),
  pendingReports: 0,
  myRequestStatus: null,
  pendingRequests: [],
};

export const useLiveStore = create<LiveRoomState & LiveRoomActions>((set, get) => ({
  ...initialRoomState,

  // ── Connection ──
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSessionId: (sessionId) => set({ sessionId }),
  setConnectionError: (connectionError) => set({ connectionError }),

  // ── Session ──
  setIsHost: (isHost) => set({ isHost }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  setHostOnline: (isHostOnline) => set({ isHostOnline }),
  setToken: (token) => set({ token }),

  // ── Viewers ──
  setViewerCount: (viewerCount) => set({ viewerCount }),
  setPresence: (presence) => set({ presence }),
  addPresence: (entry) =>
    set((s) => ({
      presence: [...s.presence.filter((p) => p.socketId !== entry.socketId), entry],
    })),
  removePresence: (socketId) =>
    set((s) => ({
      presence: s.presence.filter((p) => p.socketId !== socketId),
    })),

  // ── Media ──
  setCameraEnabled: (cameraEnabled) => set({ cameraEnabled }),
  setMicEnabled: (micEnabled) => set({ micEnabled }),
  setSpeaking: (speaking) => set({ speaking }),
  toggleCamera: () => set((s) => ({ cameraEnabled: !s.cameraEnabled })),
  toggleMic: () => set((s) => ({ micEnabled: !s.micEnabled })),

  // ── Commerce ──
  setPinnedService: (pinnedService) => set({ pinnedService }),
  setAvailability: (availability) => set({ availability }),
  setShelfVisible: (shelfVisible) => set({ shelfVisible }),
  setServices: (services) => set({ services }),
  setProducts: (products) => set({ products }),
  setStylistProfile: (stylistProfile) => set({ stylistProfile }),
  incrementBookingCount: () => set((s) => ({ bookingCount: s.bookingCount + 1 })),
  addRevenue: (amount) => set((s) => ({ revenueToday: s.revenueToday + amount })),
  incrementProductsSold: () => set((s) => ({ productsSold: s.productsSold + 1 })),

  // ── Chat ──
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages.slice(-MAX_MESSAGES + 1), msg],
    })),
  addPendingMessage: (messageId) =>
    set((s) => {
      const next = new Set(s.pendingMessageIds);
      next.add(messageId);
      return { pendingMessageIds: next };
    }),
  confirmPendingMessage: (messageId, serverId) =>
    set((s) => {
      const next = new Set(s.pendingMessageIds);
      next.delete(messageId);
      return {
        pendingMessageIds: next,
        messages: s.messages.map((m) =>
          m.messageId === messageId ? { ...m, id: serverId } : m,
        ),
      };
    }),
  removePendingMessage: (messageId) =>
    set((s) => {
      const next = new Set(s.pendingMessageIds);
      next.delete(messageId);
      return {
        pendingMessageIds: next,
        messages: s.messages.filter((m) => m.messageId !== messageId),
      };
    }),
  setChatHistory: (messages, hasMore, cursor) =>
    set({
      messages,
      hasMoreHistory: hasMore,
      historyCursor: cursor ?? null,
      isLoadingHistory: false,
    }),
  prependChatHistory: (newMessages, hasMore, cursor) =>
    set((s) => ({
      messages: [...newMessages, ...s.messages],
      hasMoreHistory: hasMore,
      historyCursor: cursor ?? s.historyCursor,
      isLoadingHistory: false,
    })),
  setIsLoadingHistory: (isLoadingHistory) => set({ isLoadingHistory }),
  deleteMessage: (messageId) =>
    set((s) => ({
      messages: s.messages.filter((m) => m.messageId !== messageId && m.id !== messageId),
    })),
  pinMessage: (messageId) => set({ pinnedMessageId: messageId }),
  setSlowModeMs: (slowModeMs) => set({ slowModeMs }),

  // ── Reactions ──
  setReactionCounts: (counts) =>
    set({
      reactionCounts: {
        love: counts.love || 0,
        fire: counts.fire || 0,
        clap: counts.clap || 0,
        wow: counts.wow || 0,
        glow: counts.glow || 0,
      },
    }),
  addReaction: (type, _userId) => {
    const id = `r_${++reactionIdCounter}`;
    const x = Math.random() * 80 + 10;

    set((state) => ({
      activeReactions: [
        ...state.activeReactions.slice(-15),
        { id, type, x, createdAt: Date.now() },
      ],
      myLastReactionTime: Date.now(),
    }));

    setTimeout(() => {
      set((state) => ({
        activeReactions: state.activeReactions.filter((r) => r.id !== id),
      }));
    }, 3000);
  },
  canSendReaction: () => {
    return Date.now() - get().myLastReactionTime >= RATE_LIMIT_MS;
  },

  // ── Moderation ──
  addMutedUser: (userId) =>
    set((s) => {
      const next = new Set(s.mutedUsers);
      next.add(userId);
      return { mutedUsers: next };
    }),
  removeMutedUser: (userId) =>
    set((s) => {
      const next = new Set(s.mutedUsers);
      next.delete(userId);
      return { mutedUsers: next };
    }),
  addBannedUser: (userId) =>
    set((s) => {
      const next = new Set(s.bannedUsers);
      next.add(userId);
      return { bannedUsers: next };
    }),
  removeBannedUser: (userId) =>
    set((s) => {
      const next = new Set(s.bannedUsers);
      next.delete(userId);
      return { bannedUsers: next };
    }),
  incrementPendingReports: () =>
    set((s) => ({ pendingReports: s.pendingReports + 1 })),

  // ── Guest Requests ──
  setMyRequestStatus: (myRequestStatus) => set({ myRequestStatus }),
  addPendingRequest: (request) =>
    set((s) => ({
      pendingRequests: [...s.pendingRequests, request],
    })),
  removePendingRequest: (requestId) =>
    set((s) => ({
      pendingRequests: s.pendingRequests.filter((r) => r.id !== requestId),
    })),

  // ── Reset ──
  resetRoom: () => set({
    ...initialRoomState,
    pendingMessageIds: new Set(),
    mutedUsers: new Set(),
    bannedUsers: new Set(),
  }),
}));
