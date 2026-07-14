import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../api/axios";
import { getSocketUrl } from "../services/socket";

export function useLiveSocket(stylistId?: string) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, (...args: any[]) => void>>(new Map());
  const joinedRef = useRef(false);

  // Socket lifecycle — create and destroy when stylistId changes
  useEffect(() => {
    if (!stylistId) return;
    joinedRef.current = false;

    const token = getAccessToken() || undefined;
    const socket = io(getSocketUrl("live"), {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Re-attach all stored listeners so they work after reconnect
      listenersRef.current.forEach((handler, event) => {
        socket.off(event);
        socket.on(event, handler);
      });
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      joinedRef.current = false;
    });

    // Re-attach any listeners that were registered before connection
    listenersRef.current.forEach((handler, event) => {
      socket.off(event);
      socket.on(event, handler);
    });

    return () => {
      // Leave room BEFORE removing listeners so the server receives the event
      if (socket.connected) {
        socket.emit("live:leave-room");
      }
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      joinedRef.current = false;
    };
  }, [stylistId]);

  // Join room ONLY after connected AND handlers are registered.
  // This effect runs after React has committed the current render,
  // meaning any on() calls from component effects have already attached
  // their handlers to the socket. Only then do we join the room.
  useEffect(() => {
    if (!connected || !stylistId || joinedRef.current) return;
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    // Delay join to next microtask so that child effects (WebRTC handlers)
    // have time to register via on() before the server sends back events
    queueMicrotask(() => {
      if (socket.connected) {
        socket.emit("live:join-room", { stylistId });
        joinedRef.current = true;
      }
    });
  }, [connected, stylistId]);

  const on = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      listenersRef.current.set(event, handler);
      const socket = socketRef.current;
      if (socket && (connected || socket.connected)) {
        socket.off(event);
        socket.on(event, handler);
      }
    },
    [connected],
  );

  const off = useCallback((event: string) => {
    listenersRef.current.delete(event);
    socketRef.current?.off(event);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const sendMessage = useCallback(
    (message: string, parentId?: string) => {
      if (!stylistId) return;
      socketRef.current?.emit("live:send-message", { stylistId, message, parentId });
    },
    [stylistId],
  );

  const sendLike = useCallback(() => {
    if (!stylistId) return;
    socketRef.current?.emit("live:like", { stylistId });
  }, [stylistId]);

  return { connected, on, off, emit, sendMessage, sendLike };
}
