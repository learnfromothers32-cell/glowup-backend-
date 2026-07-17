import { create } from "zustand";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export interface ConnectionState {
  /** Combined status derived from socket + media. Worst-case of the two. */
  status: ConnectionStatus;
  /** Socket.IO connection status */
  socketStatus: ConnectionStatus;
  /** LiveKit WebRTC connection status */
  mediaStatus: ConnectionStatus;
  sessionId: string | null;
  error: string | null;
  setSocketStatus: (status: ConnectionStatus) => void;
  setMediaStatus: (status: ConnectionStatus) => void;
  setSessionId: (id: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const STATUS_PRIORITY: Record<ConnectionStatus, number> = {
  disconnected: 0,
  failed: 1,
  reconnecting: 2,
  connecting: 3,
  connected: 4,
};

function deriveStatus(a: ConnectionStatus, b: ConnectionStatus): ConnectionStatus {
  return STATUS_PRIORITY[a] >= STATUS_PRIORITY[b] ? a : b;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: "disconnected",
  socketStatus: "disconnected",
  mediaStatus: "disconnected",
  sessionId: null,
  error: null,
  setSocketStatus: (socketStatus) =>
    set((s) => ({
      socketStatus,
      status: deriveStatus(socketStatus, s.mediaStatus),
    })),
  setMediaStatus: (mediaStatus) =>
    set((s) => ({
      mediaStatus,
      status: deriveStatus(s.socketStatus, mediaStatus),
    })),
  setSessionId: (sessionId) => set({ sessionId }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      status: "disconnected",
      socketStatus: "disconnected",
      mediaStatus: "disconnected",
      sessionId: null,
      error: null,
    }),
}));
