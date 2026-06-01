// src/features/consumer/components/TrendingFeed.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getStylists } from "../../../api/stylists";
import { useGamification } from "../../../hooks/useGamification";
import {
  Heart,
  Bookmark,
  Share2,
  ChevronLeft,
  MapPin,
  Star,
  MessageCircle,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrendingItem {
  id: string;
  stylistId: string;
  stylistName: string;
  stylistImage: string;
  category: string;
  location: string;
  rating: number;
  before: string;
  after: string;
  caption: string;
  likes: number;
  bookmarks: number;
  commentCount: number;
  createdAt: string;
}

interface Comment {
  id: number;
  user: string;
  text: string;
  avatar: string;
  createdAt: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  emoji: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const HEART_EMOJIS = ["❤️", "🧡", "💛", "💜", "💖", "💗", "🩷"];
const AVATARS = [
  "https://i.pravatar.cc/32?img=1",
  "https://i.pravatar.cc/32?img=2",
  "https://i.pravatar.cc/32?img=5",
  "https://i.pravatar.cc/32?img=8",
];

/** Convert any location shape to a plain string for display */
function getLocationString(location: any): string {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object" && "area" in location) {
    return location.area;
  }
  return String(location);
}

const generateRandomComments = (postId: string): Comment[] => {
  const stored = localStorage.getItem(`trending_comments_${postId}`);
  if (stored) return JSON.parse(stored);
  const sampleComments = [
    { user: "Efua", text: "🔥🔥🔥 amazing transformation!", avatar: AVATARS[0] },
    { user: "Kwame", text: "Love the result! 😍", avatar: AVATARS[1] },
    { user: "Adwoa", text: "I need this!", avatar: AVATARS[2] },
  ];
  return sampleComments.map((c, i) => ({
    id: i + 1,
    user: c.user,
    text: c.text,
    avatar: c.avatar,
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
};

export default function TrendingFeed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPoints, incrementAction } = useGamification();

  // ── Read the ID of the card that was clicked (from TrendingPreview) ─────────
  const highlightId = (location.state as any)?.highlightId as string | undefined;

  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("trending_likes");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("trending_bookmarks");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Load all before/after from stylists
  useEffect(() => {
    getStylists().then((stylists) => {
      const allItems: TrendingItem[] = [];
      stylists.forEach((stylist) => {
        if (stylist.beforeAfter && stylist.beforeAfter.length) {
          stylist.beforeAfter.forEach((ba, idx) => {
            if (ba.before && ba.after) {
              const postId = `${stylist.id}_${idx}`;
              const existingComments = generateRandomComments(postId);
              allItems.push({
                id: postId,
                stylistId: stylist.id,
                stylistName: stylist.name,
                stylistImage: stylist.image,
                category: stylist.category,
                location: getLocationString(stylist.location),
                rating: stylist.rating,
                before: ba.before,
                after: ba.after,
                caption: ba.caption || `${stylist.name}'s amazing transformation`,
                likes: Math.floor(Math.random() * 500) + 50,
                bookmarks: Math.floor(Math.random() * 80) + 10,
                commentCount: existingComments.length,
                createdAt: new Date(
                  Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
                ).toISOString(),
              });
              setCommentsMap((prev) => ({
                ...prev,
                [postId]: existingComments,
              }));
            }
          });
        }
      });
      allItems.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setItems(allItems);
      setLoading(false);

      // ── Scroll to the highlighted post (if coming from a card click) ────────
      if (highlightId) {
        const targetIndex = allItems.findIndex((item) => item.id === highlightId);
        if (targetIndex !== -1) {
          setTimeout(() => {
            containerRef.current?.scrollTo({
              top: targetIndex * window.innerHeight,
              behavior: "smooth",
            });
          }, 150);
        }
      }
    });
  }, [highlightId]);   // dependency ensures it runs after highlightId is read

  // Spawn floating hearts
  const spawnHearts = useCallback((count = 3) => {
    const newHearts: FloatingHeart[] = Array.from({ length: count }, () => ({
      id: Date.now() + Math.random(),
      x: 30 + Math.random() * 40,
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
    }));
    setFloatingHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((h) => !newHearts.find((nh) => nh.id === h.id)),
      );
    }, 1800);
  }, []);

  // Like handler with gamification
  const handleLike = useCallback(
    (itemId: string) => {
      const wasLiked = likedItems.has(itemId);
      setLikedItems((prev) => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
          spawnHearts(2 + Math.floor(Math.random() * 3));
        }
        localStorage.setItem(
          "trending_likes",
          JSON.stringify(Array.from(newSet)),
        );
        return newSet;
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, likes: item.likes + (wasLiked ? -1 : 1) }
            : item,
        ),
      );
      if (!wasLiked) {
        addPoints(2);
        incrementAction("likes");
      }
    },
    [likedItems, addPoints, incrementAction, spawnHearts],
  );

  // Bookmark handler with gamification
  const handleBookmark = useCallback(
    (itemId: string) => {
      const wasBookmarked = bookmarkedItems.has(itemId);
      setBookmarkedItems((prev) => {
        const newSet = new Set(prev);
        if (wasBookmarked) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
          addPoints(5);
          incrementAction("bookmarks");
        }
        localStorage.setItem(
          "trending_bookmarks",
          JSON.stringify(Array.from(newSet)),
        );
        return newSet;
      });
    },
    [bookmarkedItems, addPoints, incrementAction],
  );

  // Share handler with gamification
  const handleShare = useCallback(
    async (item: TrendingItem) => {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/app/stylist/${item.stylistId}`,
        );
        addPoints(5);
        incrementAction("shares");
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Share failed", err);
        alert("Share not supported. Copy the URL manually.");
      }
    },
    [addPoints, incrementAction],
  );

  // Open comment modal
  const openComments = (postId: string) => {
    setActivePostId(postId);
    setCommentModalOpen(true);
    setTimeout(() => commentInputRef.current?.focus(), 300);
  };

  // Add new comment
  const addComment = () => {
    if (!newCommentText.trim() || !activePostId) return;
    const newComment: Comment = {
      id: Date.now(),
      user: "You",
      text: newCommentText.trim(),
      avatar: "https://i.pravatar.cc/32?img=20",
      createdAt: new Date().toISOString(),
    };
    setCommentsMap((prev) => ({
      ...prev,
      [activePostId]: [newComment, ...(prev[activePostId] || [])],
    }));
    setItems((prev) =>
      prev.map((item) =>
        item.id === activePostId
          ? { ...item, commentCount: item.commentCount + 1 }
          : item,
      ),
    );
    const allComments = {
      ...commentsMap,
      [activePostId]: [newComment, ...(commentsMap[activePostId] || [])],
    };
    localStorage.setItem(
      `trending_comments_${activePostId}`,
      JSON.stringify(allComments[activePostId]),
    );
    setNewCommentText("");
  };

  // Scroll detection for index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const index = Math.round(scrollTop / window.innerHeight);
      if (index !== currentIndex && index >= 0 && index < items.length) {
        setCurrentIndex(index);
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, items.length]);

  const formatCount = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60 text-sm animate-pulse">
          Loading transformations...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60 text-sm">No before/after posts yet</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Floating hearts */}
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

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="relative h-screen w-full snap-start flex flex-col justify-end pb-8"
          >
            {/* Background after image */}
            <div className="absolute inset-0 z-0">
              <img
                src={item.after}
                alt="After"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
            </div>

            {/* Top left BEFORE/AFTER label */}
            <div className="absolute top-20 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-2 py-1">
              <span className="text-white text-[10px] font-semibold">
                BEFORE
              </span>
              <div className="w-px h-3 bg-white/30" />
              <span className="text-white text-[10px] font-semibold">
                AFTER
              </span>
            </div>

            {/* Right side action buttons */}
            <div className="absolute right-4 bottom-32 z-10 flex flex-col gap-5">
              <button
                onClick={() => openComments(item.id)}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <span className="text-white text-[11px] mt-1">
                  {formatCount(item.commentCount)}
                </span>
              </button>

              <button
                onClick={() => handleLike(item.id)}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                  <Heart
                    size={20}
                    className={
                      likedItems.has(item.id)
                        ? "text-[#fe2c55] fill-[#fe2c55]"
                        : "text-white"
                    }
                  />
                </div>
                <span className="text-white text-[11px] mt-1">
                  {formatCount(item.likes)}
                </span>
              </button>

              <button
                onClick={() => handleBookmark(item.id)}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                  <Bookmark
                    size={20}
                    className={
                      bookmarkedItems.has(item.id)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-white"
                    }
                  />
                </div>
                <span className="text-white text-[11px] mt-1">
                  {formatCount(item.bookmarks)}
                </span>
              </button>

              <button
                onClick={() => handleShare(item)}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                  <Share2 size={20} className="text-white" />
                </div>
                <span className="text-white text-[11px] mt-1">Share</span>
              </button>
            </div>

            {/* Bottom info */}
            <div className="relative z-10 px-4 space-y-2">
              <div className="flex items-center gap-2">
                <img
                  src={item.stylistImage}
                  className="w-8 h-8 rounded-full border border-white"
                  alt={item.stylistName}
                />
                <div>
                  <p className="text-white font-semibold text-sm">
                    {item.stylistName}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-white/60">
                    <Star size={9} className="fill-amber-400 text-amber-400" />{" "}
                    {item.rating}
                    <span>·</span>
                    <MapPin size={9} /> {item.location}
                  </div>
                </div>
              </div>
              <p className="text-white/90 text-xs line-clamp-2">
                {item.caption}
              </p>
              <button
                onClick={() => navigate(`/app/stylist/${item.stylistId}`)}
                className="px-4 py-1.5 bg-white text-gray-900 rounded-full text-xs font-medium w-fit"
              >
                View Profile
              </button>
            </div>
            

            {/* Swipe hint */}
            {idx === 0 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                <div className="text-white/50 text-xs flex flex-col items-center">
                  <ChevronLeft className="rotate-90" size={18} />
                  <span className="text-[10px]">Swipe up</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fixed top header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="text-white text-sm font-medium"
        >
          ← Back
        </button>
        <h1 className="text-white font-bold text-base">🔥 Trending</h1>
        <div className="w-6" />
      </div>

      {/* Comment modal (slide up) */}
      {commentModalOpen && activePostId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
          onClick={() => setCommentModalOpen(false)}
        >
          <div
            className="bg-[#141210] w-full max-h-[80vh] rounded-t-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">
                Comments ({commentsMap[activePostId]?.length || 0})
              </h3>
              <button
                onClick={() => setCommentModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {commentsMap[activePostId]?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img src={comment.avatar} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {comment.user}
                    </p>
                    <p className="text-white/70 text-xs">{comment.text}</p>
                    <p className="text-white/30 text-[10px] mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!commentsMap[activePostId] ||
                commentsMap[activePostId].length === 0) && (
                <p className="text-white/40 text-sm text-center">
                  No comments yet. Be the first!
                </p>
              )}
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/40 outline-none"
              />
              <button
                onClick={addComment}
                disabled={!newCommentText.trim()}
                className="px-4 py-2 bg-[#fe2c55] text-white rounded-full text-sm font-medium disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global keyframes */}
      <style>{`
        @keyframes float-heart {
          0%   { transform: translateY(0) scale(1);   opacity: 1; }
          60%  { transform: translateY(-120px) scale(1.3); opacity: 0.9; }
          100% { transform: translateY(-200px) scale(0.6); opacity: 0; }
        }
        .animate-float-heart {
          animation: float-heart 1.6s ease-out forwards;
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}