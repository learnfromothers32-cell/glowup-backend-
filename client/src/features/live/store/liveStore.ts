import { create } from "zustand";
import type {
  LiveSession,
  UpcomingSession,
  DiscussionMessage,
  PastSession,
  LiveNotification,
  HostStreamSettings,
} from "../types/live.types";

interface LiveState {
  // Sessions
  liveSessions: LiveSession[];
  upcomingSessions: UpcomingSession[];
  pastSessions: PastSession[];
  recommendedSessions: LiveSession[];

  // Active session
  activeSession: LiveSession | null;
  isPlayerOpen: boolean;

  // Discussion
  discussionMessages: DiscussionMessage[];

  // Host
  isStreaming: boolean;
  streamSettings: HostStreamSettings;
  duration: number;

  // Notifications
  notifications: LiveNotification[];
  unreadCount: number;

  // Moderation
  mutedUsers: string[];
  blockedUsers: string[];

  // UI
  loading: boolean;

  // Feed actions
  setLiveSessions: (sessions: LiveSession[]) => void;
  setUpcomingSessions: (sessions: UpcomingSession[]) => void;
  setPastSessions: (sessions: PastSession[]) => void;
  setRecommendedSessions: (sessions: LiveSession[]) => void;
  setLoading: (loading: boolean) => void;

  // Player actions
  openPlayer: (session: LiveSession) => void;
  closePlayer: () => void;
  updateViewerCount: (count: number) => void;

  // Discussion
  setDiscussionMessages: (messages: DiscussionMessage[]) => void;
  addDiscussionMessage: (message: DiscussionMessage) => void;
  removeDiscussionMessage: (id: string) => void;
  pinMessage: (id: string) => void;

  // Host
  setStreaming: (isStreaming: boolean) => void;
  updateStreamSettings: (settings: Partial<HostStreamSettings>) => void;
  tickDuration: () => void;
  resetStream: () => void;

  // Moderation
  addMutedUser: (id: string) => void;
  removeMutedUser: (id: string) => void;
  addBlockedUser: (id: string) => void;
  removeBlockedUser: (id: string) => void;

  // Notifications
  setNotifications: (notifications: LiveNotification[]) => void;
  addNotification: (notif: LiveNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const defaultStreamSettings: HostStreamSettings = {
  title: "",
  description: "",
  category: "hairstyling",
  isMuted: false,
  isVideoOn: true,
  commentsEnabled: true,
};

export const useLiveStore = create<LiveState>((set) => ({
  liveSessions: [],
  upcomingSessions: [],
  pastSessions: [],
  recommendedSessions: [],
  activeSession: null,
  isPlayerOpen: false,
  discussionMessages: [],
  isStreaming: false,
  streamSettings: defaultStreamSettings,
  duration: 0,
  mutedUsers: [],
  blockedUsers: [],
  notifications: [],
  unreadCount: 0,
  loading: false,

  setLiveSessions: (sessions) => set({ liveSessions: sessions }),
  setUpcomingSessions: (sessions) => set({ upcomingSessions: sessions }),
  setPastSessions: (sessions) => set({ pastSessions: sessions }),
  setRecommendedSessions: (sessions) => set({ recommendedSessions: sessions }),
  setLoading: (loading) => set({ loading }),

  openPlayer: (session) =>
    set({ activeSession: session, isPlayerOpen: true, discussionMessages: [] }),
  closePlayer: () =>
    set({ activeSession: null, isPlayerOpen: false, discussionMessages: [] }),
  updateViewerCount: (count) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, viewerCount: count }
        : null,
    })),

  setDiscussionMessages: (messages) => set({ discussionMessages: messages }),
  addDiscussionMessage: (msg) =>
    set((state) => {
      if (msg.parentId) {
        return {
          discussionMessages: state.discussionMessages.map((m) =>
            m.id === msg.parentId
              ? { ...m, replies: [...m.replies, msg], replyCount: m.replyCount + 1 }
              : m
          ),
        };
      }
      return { discussionMessages: [...state.discussionMessages, msg] };
    }),
  removeDiscussionMessage: (id) =>
    set((state) => ({
      discussionMessages: state.discussionMessages.filter((m) => m.id !== id),
    })),
  pinMessage: (id) =>
    set((state) => ({
      discussionMessages: state.discussionMessages.map((m) =>
        m.id === id ? { ...m, isPinned: !m.isPinned } : m
      ),
    })),

  setStreaming: (isStreaming) => set({ isStreaming }),
  updateStreamSettings: (updates) =>
    set((state) => ({
      streamSettings: { ...state.streamSettings, ...updates },
    })),
  tickDuration: () => set((state) => ({ duration: state.duration + 1 })),
  resetStream: () =>
    set({
      isStreaming: false,
      streamSettings: defaultStreamSettings,
      duration: 0,
    }),

  addMutedUser: (id) =>
    set((state) => ({ mutedUsers: [...state.mutedUsers, id] })),
  removeMutedUser: (id) =>
    set((state) => ({ mutedUsers: state.mutedUsers.filter((u) => u !== id) })),
  addBlockedUser: (id) =>
    set((state) => ({ blockedUsers: [...state.blockedUsers, id] })),
  removeBlockedUser: (id) =>
    set((state) => ({ blockedUsers: state.blockedUsers.filter((u) => u !== id) })),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
  addNotification: (notif) =>
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));
