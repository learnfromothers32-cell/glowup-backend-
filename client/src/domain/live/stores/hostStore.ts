import { create } from "zustand";
import type { LiveSessionStatus } from "../live.types";

export interface HostState {
  isHost: boolean;
  sessionId: string | null;
  status: LiveSessionStatus;
  isHostOnline: boolean;
  token: string | null;
  setHost: (isHost: boolean) => void;
  setSessionId: (id: string | null) => void;
  setStatus: (status: LiveSessionStatus) => void;
  setHostOnline: (online: boolean) => void;
  setToken: (token: string | null) => void;
  reset: () => void;
}

export const useHostStore = create<HostState>((set) => ({
  isHost: false,
  sessionId: null,
  status: "scheduled",
  isHostOnline: false,
  token: null,
  setHost: (isHost) => set({ isHost }),
  setSessionId: (sessionId) => set({ sessionId }),
  setStatus: (status) => set({ status }),
  setHostOnline: (isHostOnline) => set({ isHostOnline }),
  setToken: (token) => set({ token }),
  reset: () =>
    set({
      isHost: false,
      sessionId: null,
      status: "scheduled",
      isHostOnline: false,
      token: null,
    }),
}));
