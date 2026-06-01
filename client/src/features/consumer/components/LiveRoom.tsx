// src/features/consumer/components/LiveRoom.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStylists } from "../../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import BookingModal from "./BookingModal";
import { isConsumerAuthenticated } from "../../../api/mock/auth";
import AuthModal from "./AuthModal";
import {
  Heart,
  Send,
  X,
  MapPin,
  Star,
  Share2,
  Gift,
  Users,
  ChevronUp,
  Sparkles,
  VolumeX,
} from "lucide-react";

// ─── Types (unchanged) ──────────────────────────────────────────────────────
interface Comment {
  id: number;
  user: string;
  text: string;
  time: string;
  avatar: string;
  isHighlighted?: boolean;
}

interface FloatingHeart {
  id: number;
  x: number;
  emoji: string;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATARS = [
  "https://i.pravatar.cc/32?img=1",
  "https://i.pravatar.cc/32?img=2",
  "https://i.pravatar.cc/32?img=5",
  "https://i.pravatar.cc/32?img=8",
  "https://i.pravatar.cc/32?img=11",
  "https://i.pravatar.cc/32?img=14",
];

const HEART_EMOJIS = ["❤️", "🧡", "💛", "💜", "💖", "💗", "🩷"];
const HEART_COLORS = [
  "#ff4d6d",
  "#ff9a3c",
  "#ffd166",
  "#c77dff",
  "#ff6b9d",
  "#ff85a1",
];

/** Safely extract a displayable location string */
function getLocationString(loc: any): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object" && "area" in loc) return loc.area;
  return String(loc);
}

const generateMockComments = (): Comment[] => [
  {
    id: 1,
    user: "Efua",
    text: "🔥🔥🔥 love this!",
    time: "0:12",
    avatar: AVATARS[0],
    isHighlighted: true,
  },
  {
    id: 2,
    user: "Kwame",
    text: "That colour is stunning!",
    time: "0:45",
    avatar: AVATARS[1],
  },
  {
    id: 3,
    user: "Adwoa",
    text: "How long does this take?",
    time: "1:20",
    avatar: AVATARS[2],
  },
  {
    id: 4,
    user: "Yaw",
    text: "👏🏾 beautiful work",
    time: "2:05",
    avatar: AVATARS[3],
  },
  {
    id: 5,
    user: "Akua",
    text: "I want exactly this!",
    time: "2:58",
    avatar: AVATARS[4],
    isHighlighted: true,
  },
];

let commentIdCounter = 100;

// ─── Component ──────────────────────────────────────────────────────────────
export default function LiveRoom() {
  const { stylistId } = useParams();
  const navigate = useNavigate();
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState(1247);
  const [likes, setLikes] = useState(8342);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [showViewerBadge, setShowViewerBadge] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [giftToast, setGiftToast] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingStylist, setPendingStylist] = useState<Stylist | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load stylist
  useEffect(() => {
    getStylists().then((data) => {
      const found = data.find((s) => s.id === stylistId);
      setStylist(found || null);
      setLoading(false);
    });
  }, [stylistId]);

  // Viewer count drift
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers((v) => Math.max(500, v + Math.floor(Math.random() * 31) - 10));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Spawn hearts
  const spawnHearts = useCallback((count = 3) => {
    const newHearts: FloatingHeart[] = Array.from({ length: count }, () => ({
      id: Date.now() + Math.random(),
      x: 30 + Math.random() * 40,
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    }));
    setFloatingHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((h) => !newHearts.find((nh) => nh.id === h.id)),
      );
    }, 1800);
  }, []);

  // Auto‑comments
  useEffect(() => {
    if (!stylist) return;
    const mockComments = generateMockComments();
    let index = 0;
    const interval = setInterval(() => {
      const randAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      const newC: Comment =
        index < mockComments.length
          ? mockComments[index++]
          : {
              id: ++commentIdCounter,
              user: ["Naana", "Kofi", "Esi", "Ama", "Kojo", "Abena"][
                Math.floor(Math.random() * 6)
              ],
              text: [
                "Amazing! 😍",
                "❤️❤️❤️",
                "I love it so much",
                "🔥 fire look!",
                "Where is the studio?",
                "Booking tomorrow!",
                "She's so talented",
              ][Math.floor(Math.random() * 7)],
              time: "now",
              avatar: randAvatar,
            };
      setComments((prev) => {
        const next = [...prev, newC];
        return next.length > 40 ? next.slice(-40) : next;
      });
      if (Math.random() > 0.5) spawnHearts(1);
    }, 3000);
    return () => clearInterval(interval);
  }, [stylist, spawnHearts]);

  // Auto‑scroll comments
  useEffect(() => {
    if (!inputFocused) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, inputFocused]);

  // Viewer badge flash
  useEffect(() => {
    const t1 = setTimeout(() => setShowViewerBadge(true), 0);
    const t2 = setTimeout(() => setShowViewerBadge(false), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [viewers]);

  const handleLike = () => {
    setLikes((l) => l + 1);
    spawnHearts(2 + Math.floor(Math.random() * 3));
  };

  const sendComment = () => {
    if (!newComment.trim()) return;
    const c: Comment = {
      id: ++commentIdCounter,
      user: "You",
      text: newComment.trim(),
      time: "now",
      avatar: "https://i.pravatar.cc/32?img=20",
      isHighlighted: true,
    };
    setComments((prev) => [...prev, c]);
    setNewComment("");
    inputRef.current?.blur();
  };

  const formatCount = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);

  const handleFollow = () => {
    setIsFollowing((prev) => !prev);
    const msg = !isFollowing
      ? `Now following ${stylist?.name}`
      : `Unfollowed ${stylist?.name}`;
    setGiftToast(msg);
    setTimeout(() => setGiftToast(null), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setGiftToast("Link copied to clipboard!");
      setTimeout(() => setGiftToast(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Share not supported. Copy the URL manually.");
    }
  };

  const handleGift = () => {
    setGiftToast("✨ Gift feature coming soon!");
    setTimeout(() => setGiftToast(null), 2000);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // ✅ Authentication‑protected booking
  const handleBookClick = () => {
    if (!stylist) return;
    if (!isConsumerAuthenticated()) {
      setPendingStylist(stylist);
      setShowAuthModal(true);
    } else {
      setShowBooking(true);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingStylist) {
      setShowBooking(true);
      setPendingStylist(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-[#fe2c55] animate-spin" />
        <span className="text-white/60 text-sm tracking-widest uppercase">
          Joining live...
        </span>
      </div>
    );
  }

  if (!stylist) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white/60">
        Stylist not found
      </div>
    );
  }

  const specialty =
    stylist.category || stylist.services[0]?.name || "Hair Styling";

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden select-none">
      <video
        ref={videoRef}
        src="https://www.w3schools.com/html/mov_bbb.mp4"
        autoPlay
        loop
        playsInline
        muted={isMuted}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {isMuted && (
        <button
          onClick={toggleMute}
          className="absolute bottom-24 left-4 z-30 bg-black/50 backdrop-blur-md p-2 rounded-full text-white text-xs flex items-center gap-1"
        >
          <VolumeX size={14} /> Tap for sound
        </button>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent via-40% to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {floatingHearts.map((h) => (
          <span
            key={h.id}
            className="absolute bottom-32 text-2xl animate-float-heart"
            style={{ left: `${h.x}%` }}
          >
            {h.emoji}
          </span>
        ))}
      </div>

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-10 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={stylist.image}
              className="w-10 h-10 rounded-full border-2 border-[#fe2c55] object-cover"
              alt={stylist.name}
            />
            <span className="absolute -inset-0.5 rounded-full border border-[#fe2c55]/60 animate-ping" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">
              {stylist.name}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-white/70">
              <Star size={9} className="fill-amber-400 text-amber-400" />{" "}
              {stylist.rating}
              <span className="mx-0.5">·</span>
              <MapPin size={9} /> {getLocationString(stylist.location)}{" "}
              {/* ✅ fixed */}
            </div>
          </div>
          <button
            onClick={handleFollow}
            className={`ml-1 text-white text-xs font-bold px-3 py-1 rounded-full leading-none transition-all ${
              isFollowing
                ? "bg-white/20 backdrop-blur-sm border border-white/30"
                : "bg-[#fe2c55]"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 transition-all duration-500 ${
              showViewerBadge ? "scale-110" : "scale-100"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe2c55] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#fe2c55]" />
            </span>
            <span className="text-white/90 text-xs font-semibold tracking-wide">
              LIVE
            </span>
            <span className="text-white/60 text-xs">·</span>
            <Users size={10} className="text-white/60" />
            <span className="text-white text-xs font-medium">
              {formatCount(viewers)}
            </span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-black/50 backdrop-blur-md p-1.5 rounded-full active:scale-95 transition-transform"
          >
            <X size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Heart size={22} className="text-[#fe2c55] fill-[#fe2c55]" />
          </div>
          <span className="text-white text-[11px] font-semibold">
            {formatCount(likes)}
          </span>
        </button>
        <button
          onClick={handleGift}
          className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Gift size={22} className="text-white" />
          </div>
          <span className="text-white text-[11px]">Gift</span>
        </button>
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Share2 size={22} className="text-white" />
          </div>
          <span className="text-white text-[11px]">Share</span>
        </button>
      </div>

      {/* COMMENT FEED */}
      <div
        ref={commentBoxRef}
        className="absolute left-0 right-20 bottom-24 max-h-[38vh] overflow-y-auto flex flex-col gap-1.5 px-3 pb-1 pointer-events-auto z-20 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2 animate-slide-in">
            <img
              src={c.avatar}
              className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border border-white/20"
              alt={c.user}
            />
            <div
              className={`inline-flex flex-wrap items-baseline gap-1 text-sm leading-snug px-2.5 py-1 rounded-2xl max-w-[90%] ${
                c.user === "You"
                  ? "bg-[#fe2c55]/30 backdrop-blur-sm border border-[#fe2c55]/40"
                  : "bg-black/40 backdrop-blur-sm"
              }`}
            >
              <span
                className={`font-bold text-xs ${c.user === "You" ? "text-[#fe2c55]" : "text-white/90"}`}
              >
                {c.user}
              </span>
              <span className="text-white/90 text-xs break-words">
                {c.text}
              </span>
            </div>
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>

      {/* BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-7 pt-2 flex items-center gap-2">
        <div
          className={`flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5 border transition-all duration-200 ${
            inputFocused ? "border-white/40 bg-white/15" : "border-white/10"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendComment()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Say something..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none min-w-0"
          />
          {newComment.trim() && (
            <button
              onClick={sendComment}
              className="text-[#fe2c55] flex-shrink-0 active:scale-90 transition-transform"
            >
              <Send size={16} />
            </button>
          )}
        </div>

        <button
          onClick={handleLike}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 flex-shrink-0 active:scale-90 transition-transform text-base"
        >
          ❤️
        </button>

        {/* ✅ Book button with auth check */}
        <button
          onClick={handleBookClick}
          className="flex items-center gap-1.5 bg-[#fe2c55] text-white font-bold text-sm px-4 py-2.5 rounded-full flex-shrink-0 active:opacity-80 transition-opacity shadow-lg shadow-[#fe2c55]/30"
        >
          <Sparkles size={14} />
          Book
        </button>
      </div>

      {/* PRODUCT SHELF */}
      <div className="absolute top-[70px] left-0 right-0 z-20 flex px-3">
        <button
          onClick={handleBookClick}
          className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 max-w-[220px] active:scale-95 transition-transform"
        >
          <img
            src={stylist.image}
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            alt="service"
          />
          <div className="text-left min-w-0">
            <p className="text-white text-[11px] font-semibold leading-tight truncate">
              {specialty}
            </p>
            <p className="text-[#fe2c55] text-[11px] font-bold">Book now →</p>
          </div>
          <ChevronUp
            size={14}
            className="text-white/50 ml-auto flex-shrink-0"
          />
        </button>
      </div>

      {/* Toast */}
      {giftToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full">
          {giftToast}
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          stylist={stylist}
          preSelectedService={null}
          onClose={() => setShowBooking(false)}
          onSuccess={() => setShowBooking(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      <style>{`
        @keyframes float-heart {
          0%   { transform: translateY(0) scale(1);   opacity: 1; }
          60%  { transform: translateY(-120px) scale(1.3); opacity: 0.9; }
          100% { transform: translateY(-200px) scale(0.6); opacity: 0; }
        }
        .animate-float-heart { animation: float-heart 1.6s ease-out forwards; }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out both; }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
