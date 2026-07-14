import { useEffect, useState, useCallback, useRef } from "react";
import { startLive, stopLive } from "../api/live";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../api/axios";
import { getSocketUrl } from "../services/socket";

export interface LiveChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: "client" | "stylist";
  message: string;
  createdAt: string;
}

export interface LiveGiftNotification {
  id: string;
  userName: string;
  giftName: string;
  giftIcon: string;
  coinAmount: number;
  animation: "small" | "medium" | "large";
  createdAt: number;
}

export function useLiveStream() {
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [giftNotifications, setGiftNotifications] = useState<LiveGiftNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const stylistIdRef = useRef<string | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    stylistIdRef.current = stylistId;
  }, [stylistId]);

  useEffect(() => {
    const token = getAccessToken() || undefined;

    const s = io(getSocketUrl("live"), {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    setSocket(s);

    s.on("live:viewer-count", (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount);
    });

    s.on("live:new-message", (msg: LiveChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    s.on("live:like-update", () => {
      setTotalLikes((prev) => prev + 1);
    });

    s.on("live:gift-received", (data: {
      userName: string; giftName: string; giftIcon: string;
      coinAmount: number; animation: "small" | "medium" | "large";
    }) => {
      setTotalGifts((prev) => prev + 1);
      setTotalCoins((prev) => prev + data.coinAmount);
      const notif: LiveGiftNotification = {
        id: `gift-${Date.now()}-${Math.random()}`,
        userName: data.userName,
        giftName: data.giftName,
        giftIcon: data.giftIcon,
        coinAmount: data.coinAmount,
        animation: data.animation,
        createdAt: Date.now(),
      };
      setGiftNotifications((prev) => [...prev, notif].slice(-20));
      setTimeout(() => {
        setGiftNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 5000);
    });

    s.on("connect", () => {
      joinedRef.current = false;
    });

    return () => {
      if (s.connected) {
        s.emit("live:leave-room");
      }
      s.removeAllListeners();
      s.disconnect();
      joinedRef.current = false;
    };
  }, []);

  // Join room AFTER stylistId is set and socket is connected.
  // Uses queueMicrotask so the parent component's WebRTC effects
  // (which register live:user-joined handlers) run first.
  useEffect(() => {
    if (!socket || !stylistId || !socket.connected || joinedRef.current) return;
    queueMicrotask(() => {
      if (socket.connected) {
        socket.emit("live:join-room", { stylistId });
        joinedRef.current = true;
      }
    });
  }, [socket, stylistId]);

  const goLive = useCallback(async (title?: string, category?: string, privacy?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const sess = await startLive(title, category, privacy);
      setSession(sess);
      setIsLive(true);
      setViewerCount(sess.viewerCount || 0);
      setTotalLikes(sess.totalLikes || 0);

      if (sess.stylistId) {
        setStylistId(sess.stylistId);
      }
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Failed to start stream:", err);
      setLoading(false);
      return false;
    }
  }, []);

  const endLive = useCallback(async () => {
    try {
      if (socket && stylistId) {
        socket.emit("live:stream-end", { stylistId });
        socket.emit("live:leave-room");
      }
      await stopLive();
    } catch (err) {
      console.error("Failed to stop stream:", err);
    }
    setIsLive(false);
    setSession(null);
    setStylistId(null);
    joinedRef.current = false;
    setViewerCount(0);
    setTotalLikes(0);
    setTotalGifts(0);
    setTotalCoins(0);
    setChatMessages([]);
    setGiftNotifications([]);
  }, [socket, stylistId]);

  const sendChat = useCallback(
    (message: string) => {
      if (!message.trim() || !socket || !stylistId) return;
      socket.emit("live:send-message", {
        stylistId,
        message: message.trim(),
      });
    },
    [socket, stylistId],
  );

  return {
    isLive,
    viewerCount,
    totalLikes,
    totalGifts,
    totalCoins,
    chatMessages,
    giftNotifications,
    loading,
    session,
    socket,
    stylistId,
    goLive,
    endLive,
    sendChat,
  };
}
