import { create } from "zustand";
import type { ChatMessage } from "../live.types";

export interface ChatState {
  messages: ChatMessage[];
  pendingMessageIds: Set<string>;
  historyCursor: string | null;
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;
  slowModeMs: number;
  pinnedMessageId: string | null;
  addMessage: (msg: ChatMessage) => void;
  addPendingMessage: (messageId: string) => void;
  confirmPendingMessage: (messageId: string, serverId: string) => void;
  removePendingMessage: (messageId: string) => void;
  setHistory: (messages: ChatMessage[], hasMore: boolean, cursor?: string) => void;
  prependHistory: (messages: ChatMessage[], hasMore: boolean, cursor?: string) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  deleteMessage: (messageId: string) => void;
  pinMessage: (messageId: string) => void;
  setSlowModeMs: (ms: number) => void;
  reset: () => void;
}

const MAX_MESSAGES = 200;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  pendingMessageIds: new Set(),
  historyCursor: null,
  hasMoreHistory: true,
  isLoadingHistory: false,
  slowModeMs: 0,
  pinnedMessageId: null,
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
  setHistory: (messages, hasMore, cursor) =>
    set({
      messages,
      hasMoreHistory: hasMore,
      historyCursor: cursor ?? null,
      isLoadingHistory: false,
    }),
  prependHistory: (newMessages, hasMore, cursor) =>
    set((s) => ({
      messages: [...newMessages, ...s.messages],
      hasMoreHistory: hasMore,
      historyCursor: cursor ?? s.historyCursor,
      isLoadingHistory: false,
    })),
  setIsLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
  deleteMessage: (messageId) =>
    set((s) => ({
      messages: s.messages.filter((m) => m.messageId !== messageId && m.id !== messageId),
    })),
  pinMessage: (messageId) => set({ pinnedMessageId: messageId }),
  setSlowModeMs: (ms) => set({ slowModeMs: ms }),
  reset: () =>
    set({
      messages: [],
      pendingMessageIds: new Set(),
      historyCursor: null,
      hasMoreHistory: true,
      isLoadingHistory: false,
      slowModeMs: 0,
      pinnedMessageId: null,
    }),
}));
