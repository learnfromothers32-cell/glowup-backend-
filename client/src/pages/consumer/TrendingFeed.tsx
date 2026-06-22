import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getTrendingTransformations,
  trackTrendingEvent,
  getComments,
  createComment,
  reportTransformation,
  getUserEngagements,
  toggleEngagement,
  type TrendingTransformation,
  type TrendingCursor,
  type CommentData,
} from "../../api/trending";
import { useGamification } from "../../hooks/useGamification";
import { useAuth } from "../../context/authUtils";
import { API_SERVER_URL } from "../../api/axios";
import { logger } from "../../utils/logger";
import {
  Heart,
  Bookmark,
  Share2,
  ChevronLeft,
  MapPin,
  Star,
  MessageCircle,
  X,
  Eye,
  Flag,
  RefreshCw,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { FollowButton } from "../../components/ui/FollowButton";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { useFollow } from "../../context/FollowContext";

interface FloatingHeart {
  id: number;
  x: number;
  emoji: string;
}

const HEART_EMOJIS = ["❤️", "🧡", "💛", "💜", "💖", "💗", "🩷"];

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

export default function TrendingFeed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPoints, incrementAction } = useGamification();
  const { isAuthenticated, user } = useAuth();
  const followCtx = useFollow();

  const highlightId = (location.state as Record<string, string>)?.highlightId as string | undefined;

  const [items, setItems] = useState<TrendingTransformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<TrendingCursor | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("trending_likes");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("trending_bookmarks");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentData[]>>({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activeStylistId, setActiveStylistId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [pausedItems, setPausedItems] = useState<Set<string>>(new Set());
  const [showPauseIcon, setShowPauseIcon] = useState<Record<string, boolean>>({});
  const [soundOn, setSoundOn] = useState(false);
  const manuallyPausedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const commentInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const viewedPostsRef = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sync user engagement state from server when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getUserEngagements().then((engagements) => {
      if (cancelled) return;
      if (engagements.likes.length) {
        setLikedItems((prev) => {
          const merged = new Set(prev);
          engagements.likes.forEach((id) => merged.add(id));
          localStorage.setItem("trending_likes", JSON.stringify(Array.from(merged)));
          return merged;
        });
      }
      if (engagements.bookmarks.length) {
        setBookmarkedItems((prev) => {
          const merged = new Set(prev);
          engagements.bookmarks.forEach((id) => merged.add(id));
          localStorage.setItem("trending_bookmarks", JSON.stringify(Array.from(merged)));
          return merged;
        });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Fetch trending data
  const fetchTrending = useCallback(async (cursor?: TrendingCursor, append = false) => {
    try {
      const result = await getTrendingTransformations(10, cursor);
      const newItems: TrendingTransformation[] = result.items;

      if (append) {
        setItems((prev) => [...prev, ...newItems]);
      } else {
        setItems((prev) => {
          const prevMap = new Map(prev.map((i) => [i.id, i]));
          return newItems.map((n) => {
            const existing = prevMap.get(n.id);
            if (!existing) return n;
            return {
              ...n,
              likes: existing.likes,
              bookmarks: existing.bookmarks,
              shares: existing.shares,
              commentCount: existing.commentCount,
            };
          });
        });
      }

      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);
      followCtx.syncFromServer(newItems.map((n) => ({ stylistId: n.stylistId, isFollowing: !!n.isFollowing })));
      return newItems;
    } catch (err) {
      logger.error("Failed to load trending feed", err);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const newItems = await fetchTrending();
      if (cancelled) return;
      setLoading(false);

      if (highlightId && newItems.length > 0) {
        const targetIndex = newItems.findIndex((item) => item.id === highlightId);
        if (targetIndex !== -1) {
          setTimeout(() => {
            containerRef.current?.scrollTo({
              top: targetIndex * window.innerHeight,
              behavior: "smooth",
            });
          }, 150);
        }
        viewedPostsRef.current.add(highlightId);
      }
    })();

    return () => { cancelled = true; };
  }, [highlightId, fetchTrending]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchTrending(cursor, true).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetchTrending]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCursor(undefined);
    setHasMore(true);
    await fetchTrending();
    setRefreshing(false);
  }, [fetchTrending]);

  // Enable sound on first user interaction (required for browser autoplay policy)
  useEffect(() => {
    const handler = () => {
      setSoundOn(true);
      videoRefs.current.forEach((video) => { video.muted = false; });
    };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  // Polling for fresh scores every 30s
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      if (document.hidden) return;
      fetchTrending(undefined, false);
    }, 30000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchTrending]);

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

  const handleLike = useCallback(
    async (itemId: string) => {
      const wasLiked = likedItems.has(itemId);
      const nextLiked = !wasLiked;
      setLikedItems((prev) => {
        const newSet = new Set(prev);
        if (nextLiked) newSet.add(itemId);
        else newSet.delete(itemId);
        localStorage.setItem("trending_likes", JSON.stringify(Array.from(newSet)));
        return newSet;
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, likes: item.likes + (nextLiked ? 1 : -1) }
            : item,
        ),
      );
      if (nextLiked) {
        spawnHearts(2 + Math.floor(Math.random() * 3));
        addPoints(2);
        incrementAction("likes");
        Promise.all([
          trackTrendingEvent(itemId, "like"),
          isAuthenticated ? toggleEngagement(itemId, "like", true) : Promise.resolve(),
        ]).catch(() => undefined);
      } else {
        Promise.all([
          trackTrendingEvent(itemId, "unlike"),
          isAuthenticated ? toggleEngagement(itemId, "like", false) : Promise.resolve(),
        ]).catch(() => undefined);
      }
    },
    [likedItems, addPoints, incrementAction, spawnHearts, isAuthenticated],
  );

  const handleBookmark = useCallback(
    (itemId: string) => {
      const wasBookmarked = bookmarkedItems.has(itemId);
      const nextBookmarked = !wasBookmarked;
      setBookmarkedItems((prev) => {
        const newSet = new Set(prev);
        if (nextBookmarked) newSet.add(itemId);
        else newSet.delete(itemId);
        localStorage.setItem("trending_bookmarks", JSON.stringify(Array.from(newSet)));
        return newSet;
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, bookmarks: item.bookmarks + (nextBookmarked ? 1 : -1) }
            : item,
        ),
      );
      if (nextBookmarked) {
        addPoints(5);
        incrementAction("bookmarks");
        Promise.all([
          trackTrendingEvent(itemId, "bookmark"),
          isAuthenticated ? toggleEngagement(itemId, "bookmark", true) : Promise.resolve(),
        ]).catch(() => undefined);
      } else {
        if (isAuthenticated) {
          toggleEngagement(itemId, "bookmark", false).catch(() => undefined);
        }
      }
    },
    [bookmarkedItems, addPoints, incrementAction, isAuthenticated],
  );

  const handleShare = useCallback(
    async (item: TrendingTransformation) => {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/app/stylist/${item.stylistId}`,
        );
        addPoints(5);
        incrementAction("shares");
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, shares: i.shares + 1 } : i,
          ),
        );
        trackTrendingEvent(item.id, "share").catch(() => undefined);
      } catch {
        // fallback
      }
    },
    [addPoints, incrementAction],
  );

  const handleFollow = useCallback(
    async (stylistId: string, following: boolean) => {
      if (following) {
        await followCtx.follow(stylistId);
      } else {
        await followCtx.unfollow(stylistId);
      }
    },
    [followCtx],
  );

  // Open comment modal and fetch real comments
  const openComments = async (postId: string, stylistId: string) => {
    setActivePostId(postId);
    setActiveStylistId(stylistId);
    setCommentModalOpen(true);
    setCommentsLoading(true);

    try {
      const result = await getComments(postId, 1, 20);
      setCommentsMap((prev) => ({ ...prev, [postId]: result.comments }));
      setCommentsTotal(result.total);
      setItems((prev) =>
        prev.map((item) =>
          item.id === postId
            ? { ...item, commentCount: result.total }
            : item,
        ),
      );
    } catch {
      setCommentsMap((prev) => ({ ...prev, [postId]: [] }));
      setCommentsTotal(0);
    }

    setCommentsLoading(false);
    setTimeout(() => commentInputRef.current?.focus(), 300);
  };

  const addComment = async () => {
    if (!newCommentText.trim() || !activePostId || !activeStylistId) return;

    const text = newCommentText.trim();
    setNewCommentText("");

    try {
      const comment = await createComment(activePostId, activeStylistId, text, user?.name || "You", user?.avatar);
      setCommentsMap((prev) => ({
        ...prev,
        [activePostId]: [comment, ...(prev[activePostId] || [])],
      }));
      setCommentsTotal((prev) => prev + 1);
      setItems((prev) =>
        prev.map((item) =>
          item.id === activePostId
            ? { ...item, commentCount: item.commentCount + 1 }
            : item,
        ),
      );
      trackTrendingEvent(activePostId, "comment").catch(() => undefined);
    } catch {
      // Comment failed silently
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !activePostId || !activeStylistId) return;
    try {
      await reportTransformation(activePostId, activeStylistId, reportReason);
    } catch {
      // report failed silently
    }
    setReportSubmitted(true);
  };

  // Detect active item via IntersectionObserver (TikTok-style)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx) && idx !== currentIndexRef.current) {
              currentIndexRef.current = idx;
              setCurrentIndex(idx);
            }
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    for (const item of items) {
      const el = itemRefs.current.get(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  // Auto-play video for active item, pause others (respects manual pause)
  useEffect(() => {
    if (loading || items.length === 0) return;
    items.forEach((item, idx) => {
      const video = videoRefs.current.get(item.id);
      if (!video) return;
      if (idx === currentIndex) {
        if (manuallyPausedRef.current.has(item.id)) return;
        video.muted = !soundOn;
        video.play().catch(() => {});
        setPausedItems((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      } else {
        video.pause();
        setPausedItems((prev) => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
      }
    });
  }, [currentIndex, items, loading, soundOn]);

  // Track view impressions
  useEffect(() => {
    if (loading || items.length === 0) return;
    const activeItem = items[currentIndex];
    if (!activeItem) return;
    if (viewedPostsRef.current.has(activeItem.id)) return;
    viewedPostsRef.current.add(activeItem.id);
    trackTrendingEvent(activeItem.id, "view").catch(() => undefined);
  }, [currentIndex, items, loading]);

  const togglePlay = useCallback((itemId: string) => {
    const video = videoRefs.current.get(itemId);
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      manuallyPausedRef.current.delete(itemId);
      setPausedItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } else {
      video.pause();
      manuallyPausedRef.current.add(itemId);
      setPausedItems((prev) => {
        const next = new Set(prev);
        next.add(itemId);
        return next;
      });
    }

    setShowPauseIcon((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setShowPauseIcon((prev) => ({ ...prev, [itemId]: false }));
    }, 400);
  }, []);

  const toggleSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSoundOn((prev) => {
      const next = !prev;
      videoRefs.current.forEach((video) => { video.muted = !next; });
      return next;
    });
  }, []);

  const imgUrl = (url: string) =>
    url?.startsWith("http") ? url : `${API_SERVER_URL}${url}`;

  const formatCount = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : n ? String(n) : "";

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <div className="skeleton-pulse w-20 h-20 rounded-full" />
        <div className="text-white/40 text-sm">Loading transformations...</div>
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

      {/* Global sound toggle */}
      <button
        onClick={toggleSound}
        className="absolute top-12 right-4 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all hover:bg-black/70"
      >
        {soundOn ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </button>

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            ref={(el) => { if (el) itemRefs.current.set(item.id, el); }}
            data-index={idx}
            className="relative h-screen w-full snap-start flex flex-col justify-end pb-8"
          >
            <div className="absolute inset-0 z-0">
              {item.mediaType === 'video' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer" onClick={() => togglePlay(item.id)}>
                  <video
                    ref={(el) => { if (el) videoRefs.current.set(item.id, el); }}
                    src={imgUrl(item.after)}
                    className="w-full h-full object-contain"
                    loop
                    playsInline
                    autoPlay
                    muted
                  />
                  {showPauseIcon[item.id] && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-scale-in">
                        {pausedItems.has(item.id) ? (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                            <polygon points="6,4 20,12 6,20" />
                          </svg>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-6 rounded-full bg-white" />
                            <div className="w-1.5 h-6 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : item.before ? (
                <div className="grid grid-cols-2 w-full h-full">
                  <div className="relative overflow-hidden">
                    <img
                      src={imgUrl(item.before)}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold text-white bg-black/50">BEFORE</span>
                  </div>
                  <div className="relative overflow-hidden">
                    <img
                      src={imgUrl(item.after)}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3"><Badge variant="warning">AFTER</Badge></span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={imgUrl(item.after)}
                    alt="Transformation"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3"><Badge variant="warning">Transformation</Badge></span>
                </div>
              )}
            </div>

            {/* Right side action buttons */}
            <div className="absolute right-2 sm:right-4 bottom-20 sm:bottom-32 z-10 flex flex-col gap-3 sm:gap-5">
              <button
                onClick={() => openComments(item.id, item.stylistId)}
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
                        ? "text-red-500 fill-red-500"
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
                <span className="text-white text-[11px] mt-1">
                  {formatCount(item.shares)}
                </span>
              </button>

              {/* Report button */}
              <button
                onClick={() => { setActivePostId(item.id); setReportModalOpen(true); }}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                  <Flag size={18} className="text-white/70" />
                </div>
                <span className="text-white/50 text-[10px] mt-1">Report</span>
              </button>
            </div>

            <div className="relative z-10 px-4 space-y-2">
              <div className="flex items-center gap-2">
                {item.stylistImage ? (
                  <img
                    src={imgUrl(item.stylistImage)}
                    className="w-8 h-8 rounded-full border border-white object-cover shrink-0"
                    alt={item.stylistName}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-white bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-white/60 text-xs font-bold">{item.stylistName[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/app/stylist/${item.stylistId}`)} className="text-white font-semibold text-sm hover:underline truncate">
                      {item.stylistName}
                    </button>
                    <FollowButton
                      stylistId={item.stylistId}
                      isFollowing={followCtx.isFollowing(item.stylistId)}
                      onFollowChange={handleFollow}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/60">
                    <span className="flex items-center gap-1">
                      <Star size={9} className="fill-amber-400 text-amber-400" />
                      {item.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={9} />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={9} />
                      {formatCount(item.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 size={9} />
                      {formatCount(item.shares)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-white/90 text-xs line-clamp-2">{item.caption}</p>
            </div>

            {idx === 0 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                <div className="text-white/50 text-xs flex flex-col items-center">
                  <ChevronLeft className="rotate-90" size={18} />
                  <span className="text-[10px]">Swipe up</span>
                </div>
              </div>
            )}

            {/* Pull-to-refresh hint */}
            {idx === 0 && refreshing && (
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20">
                <RefreshCw size={16} className="text-white/50 animate-spin" />
              </div>
            )}
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4 w-full" />
        {loadingMore && (
          <div className="h-16 flex items-center justify-center">
            <div className="text-white/40 text-xs animate-pulse">Loading more...</div>
          </div>
        )}
      </div>

      {/* Fixed top header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={() => navigate(-1)} className="text-white text-sm font-medium">
          ← Back
        </button>
        <h1 className="text-white font-bold text-base">🔥 Trending</h1>
        <button onClick={handleRefresh} className="text-white/60 hover:text-white">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Comment modal — Instagram/TikTok style */}
      {commentModalOpen && activePostId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end lg:items-center lg:justify-center"
          onClick={() => setCommentModalOpen(false)}
        >
          <div
            className="bg-[#141210] w-full max-h-[85vh] rounded-t-2xl flex flex-col lg:rounded-2xl lg:max-h-[90vh] lg:max-w-4xl lg:flex-row lg:overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Desktop: post/video preview on the left */}
            <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center min-h-[50vh]">
              {(() => {
                const post = items.find(item => item.id === activePostId);
                if (!post) return null;
                return post.mediaType === 'video' ? (
                  <video
                    src={imgUrl(post.after)}
                    className="w-full h-full object-contain"
                    loop
                    muted
                    autoPlay
                    playsInline
                  />
                ) : post.before ? (
                  <div className="grid grid-cols-2 w-full h-full">
                    <div className="relative overflow-hidden">
                      <img src={imgUrl(post.before)} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold text-white bg-black/50">BEFORE</span>
                    </div>
                    <div className="relative overflow-hidden">
                      <img src={imgUrl(post.after)} alt="After" className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold text-white bg-amber-400/90">AFTER</span>
                    </div>
                  </div>
                ) : (
                  <img src={imgUrl(post.after)} alt="Post" className="w-full h-full object-contain" />
                );
              })()}
            </div>

            {/* Comments panel */}
            <div className="flex flex-col lg:w-1/2 lg:max-h-[90vh]">
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 shrink-0">
                <h3 className="text-white font-semibold text-base">
                  Comments <span className="text-white/40 font-normal">{commentsTotal}</span>
                </h3>
                <button onClick={() => setCommentModalOpen(false)} className="text-white/50 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto">
                {commentsLoading ? (
                  <div className="space-y-4 p-4">
                    {[1,2,3].map((n) => (
                      <div key={n} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 rounded bg-white/10" />
                          <div className="h-3 w-48 rounded bg-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (commentsMap[activePostId]?.length > 0 ? (
                  <div>
                    {commentsMap[activePostId].map((comment) => (
                      <div key={comment.id} className="flex gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                        {comment.userAvatar ? (
                          <img src={comment.userAvatar} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shrink-0">
                            <span className="text-white/50 text-xs font-bold">{comment.userName[0]?.toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="text-white text-sm font-semibold truncate">{comment.userName}</p>
                            <p className="text-white/30 text-[11px] shrink-0 whitespace-nowrap">{formatRelativeTime(comment.createdAt)}</p>
                          </div>
                          <p className="text-white/80 text-sm mt-0.5 break-words">{comment.text}</p>
                        </div>
                        <button className="shrink-0 self-start mt-1.5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                          <Heart size={14} className="text-white/30 hover:text-white/60" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <MessageCircle size={36} className="text-white/15 mb-3" />
                    <p className="text-white/40 text-sm font-medium">No comments yet.</p>
                    <p className="text-white/20 text-xs mt-1">Start the conversation.</p>
                  </div>
                ))}
              </div>

              {/* Input bar */}
              <div className="shrink-0 border-t border-white/10 p-3 flex gap-2 items-center">
                {user?.avatar ? (
                  <img src={imgUrl(user.avatar)} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shrink-0">
                    <span className="text-white/40 text-[10px] font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                )}
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/40 outline-none focus:bg-white/[0.15] transition-colors"
                />
                <button
                  onClick={addComment}
                  disabled={!newCommentText.trim()}
                  className="text-red-500 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setReportModalOpen(false); setReportSubmitted(false); setReportReason(""); }}
        >
          <div
            className="bg-[#141210] w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {reportSubmitted ? (
              <>
                <h3 className="text-white font-semibold text-lg mb-2">Report submitted</h3>
                <p className="text-white/60 text-sm mb-4">Our team will review this content. Thank you for helping keep GlowUp safe.</p>
                <button
                  onClick={() => { setReportModalOpen(false); setReportSubmitted(false); setReportReason(""); }}
                  className="w-full py-2 bg-red-500 text-white rounded-full text-sm font-medium"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 className="text-white font-semibold text-lg mb-2">Report this post</h3>
                <p className="text-white/60 text-sm mb-4">Why are you reporting this transformation?</p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full bg-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 outline-none resize-none h-24"
                />
                <button
                  onClick={submitReport}
                  disabled={!reportReason.trim()}
                  className="w-full mt-3 py-2 bg-red-500 text-white rounded-full text-sm font-medium disabled:opacity-50"
                >
                  Submit Report
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
