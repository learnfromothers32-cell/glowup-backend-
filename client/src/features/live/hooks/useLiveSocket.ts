import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectLive,
  disconnectLive,
  joinRoom,
  leaveRoom,
  sendHeartbeat,
  getLiveSocket,
  onJoined,
  offJoined,
  onPresence,
  offPresence,
  onViewerCount,
  offViewerCount,
  onStatus,
  offStatus,
  onHostOnline,
  offHostOnline,
  onHostOffline,
  offHostOffline,
  onLiveError,
  offLiveError,
} from "@/services/liveSocket";
import { useConnectionStore } from "@/domain/live/stores/connectionStore";
import { useViewerStore } from "@/domain/live/stores/viewerStore";
import { useHostStore } from "@/domain/live/stores/hostStore";
import type { PresenceEntry } from "@/domain/live/live.types";

const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 30_000;

export function useLiveSocket() {
  const setStatus = useConnectionStore((s) => s.setSocketStatus);
  const setSessionId = useConnectionStore((s) => s.setSessionId);
  const setError = useConnectionStore((s) => s.setError);
  const setViewerCount = useViewerStore((s) => s.setViewerCount);
  const setPresence = useViewerStore((s) => s.setPresence);
  const addPresence = useViewerStore((s) => s.addPresence);
  const removePresence = useViewerStore((s) => s.removePresence);
  const setHostOnline = useHostStore((s) => s.setHostOnline);
  const setStatusLive = useHostStore((s) => s.setStatus);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const joinInfoRef = useRef<{ sessionId: string; role: string; displayName?: string } | null>(null);
  const socketConnectingRef = useRef(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Store handler refs for proper cleanup (fixes memory leak)
  const socketConnectRef = useRef<(() => void) | null>(null);
  const socketDisconnectRef = useRef<((reason: string) => void) | null>(null);
  const reconnectAttemptRef = useRef<((attempt: number) => void) | null>(null);
  const reconnectFailedRef = useRef<(() => void) | null>(null);

  const handleJoined = useCallback(
    (data: { sessionId: string; presence: PresenceEntry[]; viewerCount: number }) => {
      setSessionId(data.sessionId);
      setStatus("connected");
      setPresence(data.presence);
      setViewerCount(data.viewerCount);
      reconnectAttemptsRef.current = 0;
      setReconnectAttempt(0);
    },
    [setSessionId, setStatus, setPresence, setViewerCount],
  );

  const handlePresence = useCallback(
    (data: { sessionId: string; action: "join" | "leave"; user: PresenceEntry }) => {
      if (data.action === "join") {
        addPresence(data.user);
      } else {
        removePresence(data.user.socketId);
      }
    },
    [addPresence, removePresence],
  );

  const handleViewerCount = useCallback(
    (data: { sessionId: string; count: number }) => {
      setViewerCount(data.count);
    },
    [setViewerCount],
  );

  const handleStatus = useCallback(
    (data: { sessionId: string; status: string }) => {
      setStatusLive(data.status as any);
    },
    [setStatusLive],
  );

  const handleHostOnline = useCallback(
    (_data: { sessionId: string }) => {
      setHostOnline(true);
    },
    [setHostOnline],
  );

  const handleHostOffline = useCallback(
    (_data: { sessionId: string }) => {
      setHostOnline(false);
    },
    [setHostOnline],
  );

  const handleError = useCallback(
    (data: { code: string; message: string }) => {
      setError(data.message);
    },
    [setError],
  );

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    heartbeatRef.current = setInterval(() => {
      const sessionId = useConnectionStore.getState().sessionId;
      if (sessionId) {
        sendHeartbeat(sessionId);
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const attemptReconnect = useCallback(() => {
    const joinInfo = joinInfoRef.current;
    if (!joinInfo) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus("failed");
      setError("Unable to reconnect. Please refresh the page.");
      return;
    }

    reconnectAttemptsRef.current += 1;
    setReconnectAttempt(reconnectAttemptsRef.current);
    setStatus("reconnecting");

    const delay = Math.min(2000 * Math.pow(1.5, reconnectAttemptsRef.current - 1), 30000);

    setTimeout(() => {
      const socket = getLiveSocket();
      if (!socket.connected) {
        connectLive();
      } else {
        joinRoom(joinInfo.sessionId, joinInfo.role, joinInfo.displayName);
      }
    }, delay);
  }, [setStatus, setError]);

  const cleanupSocketListeners = useCallback(() => {
    const socket = getLiveSocket();
    if (socketConnectRef.current) {
      socket.off("connect", socketConnectRef.current);
      socketConnectRef.current = null;
    }
    if (socketDisconnectRef.current) {
      socket.off("disconnect", socketDisconnectRef.current);
      socketDisconnectRef.current = null;
    }
    if (reconnectAttemptRef.current) {
      socket.io.off("reconnect_attempt", reconnectAttemptRef.current);
      reconnectAttemptRef.current = null;
    }
    if (reconnectFailedRef.current) {
      socket.io.off("reconnect_failed", reconnectFailedRef.current);
      reconnectFailedRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (socketConnectingRef.current) return;
    socketConnectingRef.current = true;
    setStatus("connecting");
    connectLive();

    onJoined(handleJoined);
    onPresence(handlePresence);
    onViewerCount(handleViewerCount);
    onStatus(handleStatus);
    onHostOnline(handleHostOnline);
    onHostOffline(handleHostOffline);
    onLiveError(handleError);

    startHeartbeat();

    const socket = getLiveSocket();

    // Clean up any previous anonymous listeners first
    cleanupSocketListeners();

    const onSocketConnect = () => {
      socketConnectingRef.current = false;
      const joinInfo = joinInfoRef.current;
      if (joinInfo && useConnectionStore.getState().socketStatus !== "connected") {
        joinRoom(joinInfo.sessionId, joinInfo.role, joinInfo.displayName);
      }
    };

    const onSocketDisconnect = (reason: string) => {
      if (reason === "io server disconnect") {
        setStatus("failed");
        setError("Disconnected by server");
        return;
      }
      if (joinInfoRef.current) {
        attemptReconnect();
      }
    };

    const onReconnectAttempt = (attempt: number) => {
      setReconnectAttempt(attempt);
      if (useConnectionStore.getState().socketStatus !== "reconnecting") {
        setStatus("reconnecting");
      }
    };

    const onReconnectFailed = () => {
      setStatus("failed");
      setError("Connection lost. Please check your network and try again.");
    };

    socket.on("connect", onSocketConnect);
    socket.on("disconnect", onSocketDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);

    // Store refs for cleanup
    socketConnectRef.current = onSocketConnect;
    socketDisconnectRef.current = onSocketDisconnect;
    reconnectAttemptRef.current = onReconnectAttempt;
    reconnectFailedRef.current = onReconnectFailed;
  }, [
    setStatus,
    setError,
    handleJoined,
    handlePresence,
    handleViewerCount,
    handleStatus,
    handleHostOnline,
    handleHostOffline,
    handleError,
    startHeartbeat,
    attemptReconnect,
    cleanupSocketListeners,
  ]);

  const disconnect = useCallback(() => {
    socketConnectingRef.current = false;
    stopHeartbeat();

    offJoined(handleJoined);
    offPresence(handlePresence);
    offViewerCount(handleViewerCount);
    offStatus(handleStatus);
    offHostOnline(handleHostOnline);
    offHostOffline(handleHostOffline);
    offLiveError(handleError);

    // Clean up anonymous socket listeners
    cleanupSocketListeners();

    const sessionId = useConnectionStore.getState().sessionId;
    if (sessionId) {
      leaveRoom(sessionId);
    }

    joinInfoRef.current = null;
    reconnectAttemptsRef.current = 0;
    setReconnectAttempt(0);

    disconnectLive();
    setStatus("disconnected");
    setSessionId(null);
    setError(null);
  }, [
    setStatus,
    setSessionId,
    setError,
    handleJoined,
    handlePresence,
    handleViewerCount,
    handleStatus,
    handleHostOnline,
    handleHostOffline,
    handleError,
    stopHeartbeat,
    cleanupSocketListeners,
  ]);

  const join = useCallback(
    (sessionId: string, role: string, displayName?: string) => {
      joinInfoRef.current = { sessionId, role, displayName };
      reconnectAttemptsRef.current = 0;
      setReconnectAttempt(0);
      connect();
      joinRoom(sessionId, role, displayName);
    },
    [connect],
  );

  const manualReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    attemptReconnect();
  }, [attemptReconnect]);

  useEffect(() => {
    return () => {
      stopHeartbeat();
      cleanupSocketListeners();
    };
  }, [stopHeartbeat, cleanupSocketListeners]);

  return { connect, disconnect, join, manualReconnect, reconnectAttempt };
}
