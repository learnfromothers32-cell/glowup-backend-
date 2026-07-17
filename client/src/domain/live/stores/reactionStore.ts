import { create } from "zustand";

export type ReactionType = "love" | "fire" | "clap" | "wow" | "glow";

export interface ActiveReaction {
  id: string;
  type: ReactionType;
  x: number;
  createdAt: number;
}

export interface ReactionState {
  counts: Record<ReactionType, number>;
  activeReactions: ActiveReaction[];
  myLastReactionTime: number;
  setCounts: (counts: Record<string, number>) => void;
  addReaction: (type: ReactionType, userId: string) => void;
  canSendReaction: () => boolean;
  reset: () => void;
}

const RATE_LIMIT_MS = 500;
let reactionIdCounter = 0;

export const useReactionStore = create<ReactionState>((set, get) => ({
  counts: { love: 0, fire: 0, clap: 0, wow: 0, glow: 0 },
  activeReactions: [],
  myLastReactionTime: 0,
  setCounts: (counts) =>
    set({
      counts: {
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
  canSendReaction: () => Date.now() - get().myLastReactionTime >= RATE_LIMIT_MS,
  reset: () =>
    set({
      counts: { love: 0, fire: 0, clap: 0, wow: 0, glow: 0 },
      activeReactions: [],
      myLastReactionTime: 0,
    }),
}));
