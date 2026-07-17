import { create } from "zustand";
import type { PresenceEntry } from "../live.types";

export interface ViewerState {
  viewerCount: number;
  presence: PresenceEntry[];
  setViewerCount: (count: number) => void;
  setPresence: (entries: PresenceEntry[]) => void;
  addPresence: (entry: PresenceEntry) => void;
  removePresence: (socketId: string) => void;
  reset: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  viewerCount: 0,
  presence: [],
  setViewerCount: (count) => set({ viewerCount: count }),
  setPresence: (entries) => set({ presence: entries }),
  addPresence: (entry) =>
    set((s) => ({
      presence: [...s.presence.filter((p) => p.socketId !== entry.socketId), entry],
    })),
  removePresence: (socketId) =>
    set((s) => ({
      presence: s.presence.filter((p) => p.socketId !== socketId),
    })),
  reset: () => set({ viewerCount: 0, presence: [] }),
}));
