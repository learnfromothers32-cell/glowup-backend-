import { create } from "zustand";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export interface ConnectionState {
  status: ConnectionStatus;
  sessionId: string | null;
  error: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setSessionId: (id: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "disconnected",
  sessionId: null,
  error: null,
  setStatus: (status) => set({ status }),
  setSessionId: (sessionId) => set({ sessionId }),
  setError: (error) => set({ error }),
  reset: () => set({ status: "disconnected", sessionId: null, error: null }),
}));
