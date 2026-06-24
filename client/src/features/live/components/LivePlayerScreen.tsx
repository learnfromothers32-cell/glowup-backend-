import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Users, BadgeCheck, Share2, Flag,
  Heart, Gift, MessageCircle, Volume2, VolumeX, Send,
} from "lucide-react";
import { FloatingReactions } from "./FloatingReactions";
import { GiftPanel } from "./GiftPanel";
import { GiftAnimation } from "./GiftAnimation";
import type { GiftItem, FloatingReaction } from "../types/live.types";

interface Props {
  stream?: MediaStream | null;
  onFollow?: () => void;
  isFollowing?: boolean;
  hostName?: string;
  hostImage?: string;
  hostId?: string;
  isVerified?: boolean;
  viewerCount?: number;
  streamTitle?: string;
  onSendGift?: (gift: GiftItem) => void;
  onShare?: () => void;
  onReport?: () => void;
  onBook?: () => void;
  onHostClick?: () => void;
  giftBalance?: number;
  giftAnimations?: Array<{
    id: string; userName: string; giftName: string;
    giftIcon: string; animation: "small" | "medium" | "large"; color: string;
  }>;
  onGiftAnimComplete?: (id: string) => void;
  remoteReactions?: FloatingReaction[];
  isMuted?: boolean;
  onToggleMute?: () => void;
  onReaction?: (type: string) => void;
  totalLikes?: number;
  hasLiked?: boolean;
  onClose?: () => void;
  socket?: {
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string) => void;
    sendMessage: (message: string, parentId?: string) => void;
  };
}

const DOUBLE_TAP_DELAY = 280;

function LocalFloatingHearts({ hearts }: { hearts: Array<{ id: string; x: number }> }) {
  return (
    <AnimatePresence>
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0.4, y: 0, x: `${h.x}%` }}
          animate={{ opacity: 0, scale: 1.5, y: -300 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.2, ease: "ease-out" }}
          className="absolute bottom-20 z-30 pointer-events-none"
          style={{ left: `${h.x}%` }}
        >
          <span className="text-3xl">❤️</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export function LivePlayerScreen({
  stream, onFollow, isFollowing, hostName, hostImage, hostId, isVerified,
  viewerCount = 0, streamTitle = "", onSendGift, onShare, onReport,
  onBook, onHostClick, giftBalance = 100, giftAnimations = [], onGiftAnimComplete,
  remoteReactions = [], isMuted = true, onToggleMute, onReaction,
  totalLikes = 0, hasLiked = false, onClose, socket,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [localReactions, setLocalReactions] = useState<FloatingReaction[]>([]);
  const [localHearts, setLocalHearts] = useState<Array<{ id: string; x: number }>>([]);
  const [showFollowAnim, setShowFollowAnim] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [comments, setComments] = useState<Array<{ id: string; userName: string; message: string }>>([]);
  const [likesCount, setLikesCount] = useState(totalLikes);

  useEffect(() => { setLikesCount(totalLikes); }, [totalLikes]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: any) => {
      const newMsg = {
        id: msg.id || Date.now().toString(),
        userName: msg.userName || "User",
        message: msg.message || "",
      };
      if (!newMsg.message) return;
      setComments((prev) => [...prev, newMsg].slice(-20));
    };
    socket.on("live:new-message", handler);
    return () => socket.off("live:new-message");
  }, [socket]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, isMuted]);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [comments]);

  const spawnHeart = useCallback(() => {
    const id = `h-${Date.now()}-${Math.random()}`;
    const x = 15 + Math.random() * 70;
    setLocalHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setLocalHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2400);
  }, []);

  const spawnReaction = useCallback((type = "heart") => {
    const x = 15 + Math.random() * 70;
    const r: FloatingReaction = {
      id: `local-${Date.now()}-${Math.random()}`,
      type,
      icon: "❤️",
      x,
      createdAt: Date.now(),
    };
    setLocalReactions((prev) => [...prev, r].slice(-20));
    spawnHeart();
    setTimeout(() => {
      setLocalReactions((prev) => prev.filter((rr) => rr.id !== r.id));
    }, 2500);
  }, [spawnHeart]);

  const handleVideoClick = useCallback(() => {
    const now = Date.now();
    const diff = now - lastTapRef.current;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    if (diff < DOUBLE_TAP_DELAY) {
      spawnHeart();
      setTimeout(() => spawnHeart(), 80);
      setTimeout(() => spawnHeart(), 160);
      onReaction?.("heart");
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  }, [spawnHeart, onReaction]);

  const handleSendChat = () => {
    if (!chatInput.trim() || !socket) return;
    socket.sendMessage(chatInput.trim());
    setChatInput("");
  };

  const allReactions = [...localReactions, ...remoteReactions];
  const visibleComments = comments.slice(-8);
  const hostInitial = (hostName || "H")[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black select-none"
    >
      {/* Desktop blurred bg */}
      {stream && <div className="hidden lg:block absolute inset-0 bg-black/60" />}

      {/* Video */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className="relative w-full h-full lg:w-auto lg:h-full lg:aspect-[9/16] lg:max-h-screen cursor-pointer"
          onClick={handleVideoClick}
        >
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 skeleton-pulse flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{hostInitial}</span>
              </div>
              <p className="text-white/50 text-xs">Waiting for stream...</p>
            </div>
          )}

          {/* Local floating hearts (single-tap sends these) */}
          <LocalFloatingHearts hearts={localHearts} />

          {/* Floating reactions */}
          <FloatingReactions reactions={allReactions} />

          {/* Gradient overlays */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />

          {/* ── TOP BAR ── */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 z-20" style={{ paddingTop: "calc(10px + env(safe-area-inset-top))" }}>
            <button
              onClick={(e) => { e.stopPropagation(); onClose?.(); }}
              className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-white/10 active:scale-90 transition-all"
            >
              <X size={20} className="text-white" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm shadow-lg">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-wider">LIVE</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm shadow-lg border border-white/[0.06]">
                <Users size={11} className="text-white" />
                <span className="text-[11px] text-white font-semibold">{viewerCount}</span>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ROW: host info + comments + input ── */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-1.5 px-3 pb-5 pt-20 bg-gradient-to-t from-black/85 to-transparent pointer-events-none"
            style={{ paddingBottom: "calc(14px + env(safe-area-inset-bottom))" }}
          >
            {/* Comments */}
            <div
              ref={chatListRef}
              className="overflow-hidden pointer-events-auto"
              style={{ maxHeight: 152 }}
            >
              <AnimatePresence initial={false}>
                {showChat && visibleComments.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -32, y: 8 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="mb-1"
                  >
                    <div className="inline-flex items-start gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md" style={{ background: "rgba(0,0,0,0.55)", maxWidth: "88%" }}>
                      <span className="shrink-0 font-bold text-[12px] leading-5 text-white/90 drop-shadow-md">
                        {msg.userName}
                      </span>
                      <span className="text-white text-[13px] leading-5 break-words min-w-0 drop-shadow-md">
                        {msg.message}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Host info + Follow/Book */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onHostClick?.(); }}
                  className="w-11 h-11 rounded-full border-2 border-white/50 overflow-hidden shrink-0 bg-gradient-to-br from-gray-600 to-gray-500 flex items-center justify-center shadow-lg cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                >
                  {hostImage ? (
                    <img src={hostImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-base">{hostInitial}</span>
                  )}
                </button>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onHostClick?.(); }}
                    className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white font-bold text-sm drop-shadow-lg truncate max-w-[130px]">{hostName || "Host"}</span>
                    {isVerified && <BadgeCheck size={14} className="text-blue-400 shrink-0 drop-shadow-lg" />}
                  </button>
                  <div className="flex items-center gap-1.5">
                    {onFollow && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); onFollow();
                          setShowFollowAnim(true);
                          setTimeout(() => setShowFollowAnim(false), 1000);
                        }}
                        className="px-4 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border leading-5 drop-shadow-md"
                        style={{
                          background: isFollowing ? "rgba(255,255,255,0.15)" : "#FE2C55",
                          borderColor: isFollowing ? "rgba(255,255,255,0.3)" : "transparent",
                          color: "white",
                        }}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                    {onBook && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onBook(); }}
                        className="px-4 py-1 rounded-full text-[11px] font-bold leading-5 transition-all active:scale-95 drop-shadow-md border border-white/20"
                        style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat input */}
            {showChat && stream && (
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/[0.08] pointer-events-auto shadow-lg">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendChat(); }}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/35 outline-none"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="p-1.5 disabled:opacity-25 active:scale-90 transition-all"
                >
                  <Send size={18} style={{ color: "#FE2C55" }} />
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: Action buttons ── */}
          <div
            className="absolute right-3 z-20 flex flex-col items-center gap-4"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            {onToggleMute && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/[0.06]">
                  {isMuted ? <VolumeX size={19} className="text-white" /> : <Volume2 size={19} className="text-white" />}
                </div>
                <span className="text-[9px] text-white/60 drop-shadow-lg">{isMuted ? "Unmute" : "Mute"}</span>
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); if (!hasLiked) { spawnReaction("heart"); onReaction?.("heart"); } }}
              disabled={hasLiked}
              className={`flex flex-col items-center gap-0.5 transition-transform relative ${hasLiked ? "scale-90" : "active:scale-90"}`}
            >
              <motion.div
                className="w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg border"
                style={{
                  background: hasLiked ? "rgba(254,44,85,0.25)" : "rgba(0,0,0,0.45)",
                  borderColor: hasLiked ? "rgba(254,44,85,0.4)" : "rgba(255,255,255,0.06)",
                }}
                animate={hasLiked ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Heart
                  size={19}
                  className={hasLiked ? "text-red-400" : "text-white"}
                  fill={hasLiked ? "#f43f5e" : "white"}
                  fillOpacity={hasLiked ? 1 : 0.3}
                />
              </motion.div>
              <span className={`text-[9px] drop-shadow-lg ${hasLiked ? "text-red-400/70" : "text-white/60"}`}>
                {hasLiked ? "Liked" : "Like"}
              </span>
              <AnimatePresence>
                {likesCount > 0 && (
                  <motion.span
                    key={likesCount}
                    initial={{ scale: 1.3, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none shadow-lg"
                    style={{ background: "#FE2C55", color: "white", minWidth: 18, textAlign: "center" }}
                  >
                    {likesCount > 99 ? "99+" : likesCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setShowChat((p) => !p); }}
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/[0.06] relative">
                <MessageCircle size={19} className="text-white" />
                {comments.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1" style={{ background: "#FE2C55" }}>
                    <span className="text-white text-[8px] font-bold">{comments.length > 9 ? "9+" : comments.length}</span>
                  </span>
                )}
              </div>
              <span className="text-[9px] text-white/60 drop-shadow-lg">Chat</span>
            </button>

            {onSendGift && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowGiftPanel(true); }}
                className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/[0.06] relative">
                  <Gift size={19} className="text-pink-400" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center"
                    style={{ background: "#FE2C55" }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-white text-[8px] font-bold">G</span>
                  </motion.div>
                </div>
                <span className="text-[9px] text-white/60 drop-shadow-lg">Gift</span>
              </button>
            )}

            {onShare && (
              <button
                onClick={(e) => { e.stopPropagation(); onShare(); }}
                className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/[0.06]">
                  <Share2 size={19} className="text-white" />
                </div>
                <span className="text-[9px] text-white/60 drop-shadow-lg">Share</span>
              </button>
            )}

            {onReport && (
              <button
                onClick={(e) => { e.stopPropagation(); onReport(); }}
                className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/[0.06]">
                  <Flag size={16} className="text-white/60" />
                </div>
                <span className="text-[9px] text-white/60 drop-shadow-lg">Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gift Panel */}
      {onSendGift && (
        <GiftPanel
          isOpen={showGiftPanel}
          onClose={() => setShowGiftPanel(false)}
          onSendGift={(gift) => { onSendGift(gift); setShowGiftPanel(false); }}
          balance={giftBalance}
        />
      )}

      <GiftAnimation gifts={giftAnimations} onComplete={(id) => onGiftAnimComplete?.(id)} />

      <AnimatePresence>
        {showFollowAnim && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[310] pointer-events-none"
          >
            <div className="px-6 py-2 rounded-full backdrop-blur-md" style={{ background: "rgba(254,44,85,0.9)" }}>
              <span className="text-white text-sm font-bold">
                {isFollowing ? `Following ${hostName}` : `Unfollowed ${hostName}`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
