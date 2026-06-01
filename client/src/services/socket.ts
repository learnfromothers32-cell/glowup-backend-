import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../api/axios";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let queueSocket: Socket | null = null;

export function getQueueSocket(): Socket {
  if (!queueSocket) {
    queueSocket = io(`${SOCKET_URL}/queue`, {
      auth: { token: getAccessToken() },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return queueSocket;
}

export function connectQueue() {
  const s = getQueueSocket();
  if (!s.connected) {
    s.auth = { token: getAccessToken() };
    s.connect();
  }
}

export function disconnectQueue() {
  if (queueSocket?.connected) {
    queueSocket.disconnect();
  }
}

export function joinQueue(stylistId: string, bookingId?: string) {
  const s = getQueueSocket();
  if (!s.connected) connectQueue();
  s.emit("queue:join", { stylistId, bookingId });
}

export function leaveQueue(stylistId: string) {
  const s = getQueueSocket();
  if (s.connected) {
    s.emit("queue:leave", { stylistId });
  }
}

export function subscribeToQueue(stylistId: string) {
  const s = getQueueSocket();
  if (!s.connected) connectQueue();
  s.emit("queue:subscribe", { stylistId });
}

export function unsubscribeFromQueue(stylistId: string) {
  const s = getQueueSocket();
  if (s.connected) {
    s.emit("queue:unsubscribe", { stylistId });
  }
}

export function getMyQueueStatus(stylistId: string) {
  const s = getQueueSocket();
  if (!s.connected) connectQueue();
  s.emit("queue:status", { stylistId });
}
