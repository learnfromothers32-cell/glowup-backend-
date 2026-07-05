import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getTrendingTransformations,
  trackTrendingEvent,
  getComments,
  createComment,
  toggleCommentLike,
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
  MessageCircle,
  X,
  Flag,
  RefreshCw,
} from "lucide-react";

interface FloatingHeart {
  id: number;
  x: number;
  scale: number;
  startTime: number;
}

const TIKTOK_RED = "#FE2C55";
const SWIPE_THRESHOLD = 30;
const LIKE_COOLDOWN_MS = 2000;
const HEART_ANIM_MS = 500;
const VIRAL_ENGAGEMENT_THRESHOLD = 0.02;
const TRANSITION_MS = 300;

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n ? String(n) : "";
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diffMs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 60) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function getEngagementRate(item: TrendingTransformation): number {
  if (!item.views || item.views === 0) return 0;
  return (item.likes + item.commentCount) / item.views;
}

export default function TrendingFeed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPoints, incrementAction } = useGamification();
  const { isAuthenticated, user } = useAuth();

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
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);

  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showPauseIcon, setShowPauseIcon] = useState<Record<string, boolean>>({});
  const [soundOn, setSoundOn] = useState(false);
  const [likeCooldown, setLikeCooldown] = useState(false);
  const likeCooldownRef = useRef(false);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activeStylistId, setActiveStylistId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentData[]>>({});

  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareItemId, setShareItemId] = useState<string | null>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const videoCanplayCleanup = useRef<Map<string, () => void>>(new Map());
  const commentInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const viewedPostsRef = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const manuallyPausedRef = useRef<Set<string>>(new Set());

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchDeltaRef = useRef(0);
  const isSwipingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [heartBursts, setHeartBursts] = useState<{ id: number; x: number; y: number; scale: number }[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getUserEngagements()
      .then((engagements) => {
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
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const fetchTrending = useCallback(
    async (c?: TrendingCursor, append = false) => {
      try {
        const result = await getTrendingTransformations(10, c);
        const newItems = result.items;
        if (append) {
          setItems((prev) => {
            const seen = new Map(prev.map((i) => [i.id, i]));
            for (const n of newItems) {
              if (!seen.has(n.id)) seen.set(n.id, n);
            }
            return Array.from(seen.values());
          });
        } else {
          setItems(newItems);
        }
        setCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
        return newItems;
      } catch (err) {
        logger.error("Failed to load trending feed", err);
        return [];
      }
    },
    [],
  );

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
          currentIndexRef.current = targetIndex;
          setCurrentIndex(targetIndex);
        }
        viewedPostsRef.current.add(highlightId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [highlightId, fetchTrending]);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCursor(undefined);
    setHasMore(true);
    await fetchTrending();
    setRefreshing(false);
  }, [fetchTrending]);

  useEffect(() => {
    const handler = () => {
      setSoundOn(true);
    };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("keydown", handler);
      if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current);
    };
  }, []);

  const goToIndex = useCallback(
    (newIndex: number) => {
      if (isTransitioningRef.current) return;
      if (newIndex < 0 || newIndex >= items.length) return;
      if (newIndex === currentIndexRef.current) return;

      isTransitioningRef.current = true;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      setDragOffset(0);
      setIsDragging(false);

      setTimeout(() => {
        isTransitioningRef.current = false;
      }, TRANSITION_MS + 50);
    },
    [items.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndexRef.current > 0) goToIndex(currentIndexRef.current - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndexRef.current < items.length - 1) goToIndex(currentIndexRef.current + 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items.length, goToIndex]);

  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      if (document.hidden) return;
      fetchTrending(undefined, false);
    }, 30000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      videoCanplayCleanup.current.forEach((cleanup) => cleanup());
      videoCanplayCleanup.current.clear();
    };
  }, [fetchTrending]);

  const spawnHearts = useCallback(() => {
    const heart: FloatingHeart = {
      id: Date.now() + Math.random(),
      x: 40 + Math.random() * 20,
      scale: 0.8 + Math.random() * 0.4,
      startTime: Date.now(),
    };
    setFloatingHearts((prev) => [...prev, heart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heart.id));
    }, HEART_ANIM_MS);
  }, []);

  const handleLike = useCallback(
    async (itemId: string) => {
      if (likeCooldownRef.current) return;
      const wasLiked = likedItems.has(itemId);
      const nextLiked = !wasLiked;

      likeCooldownRef.current = true;
      setLikeCooldown(true);
      setTimeout(() => {
        likeCooldownRef.current = false;
        setLikeCooldown(false);
      }, LIKE_COOLDOWN_MS);

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
        spawnHearts();
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

  const handleMediaTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent, itemId: string, onSingleTap?: () => void) => {
      const now = Date.now();
      let clientX: number, clientY: number;
      if ("touches" in e) {
        const touch = (e as React.TouchEvent).changedTouches?.[0] || (e as React.TouchEvent).touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      if (lastTapRef.current && now - lastTapRef.current.time < 300 &&
          Math.abs(clientX - lastTapRef.current.x) < 50 &&
          Math.abs(clientY - lastTapRef.current.y) < 50) {
        /* double tap — like */
        if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current);
        lastTapRef.current = null;
        handleLike(itemId);
        const burst = { id: Date.now(), x: clientX, y: clientY, scale: 1.2 };
        setHeartBursts((prev) => [...prev, burst]);
        setTimeout(() => setHeartBursts((prev) => prev.filter((b) => b.id !== burst.id)), 800);
        return;
      }

      lastTapRef.current = { time: now, x: clientX, y: clientY };
      doubleTapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = null;
        onSingleTap?.();
      }, 300);
    },
    [handleLike],
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
      setShareItemId(item.id);
      setShareMenuOpen(true);
    },
    [],
  );

  const handleShareAction = useCallback(
    async (action: "copy" | "messages" | "external", item: TrendingTransformation) => {
      try {
        if (action === "copy") {
          await navigator.clipboard.writeText(
            `${window.location.origin}/app/stylist/${item.stylistId}`,
          );
        } else if (action === "messages") {
          navigate("/app/messages");
        } else {
          const shareUrl = `${window.location.origin}/app/stylist/${item.stylistId}`;
          if (navigator.share) {
            await navigator.share({ title: item.stylistName, url: shareUrl });
          } else {
            await navigator.clipboard.writeText(shareUrl);
          }
        }
        addPoints(5);
        incrementAction("shares");
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, shares: i.shares + 1 } : i,
          ),
        );
        trackTrendingEvent(item.id, "share").catch(() => undefined);
      } catch {
        // share failed
      }
      setShareMenuOpen(false);
      setShareItemId(null);
    },
    [addPoints, incrementAction, navigate],
  );

  const openComments = async (postId: string, stylistId: string) => {
    setActivePostId(postId);
    setActiveStylistId(stylistId);
    setCommentModalOpen(true);
    setCommentsLoading(true);
    try {
      const result = await getComments(postId, 1, 20);
      setCommentsMap((prev) => ({ ...prev, [postId]: result.comments }));
      setCommentsTotal(result.total);
      setLikedComments(new Set(result.comments.filter((c) => c.isLiked).map((c) => c.id)));
      setItems((prev) =>
        prev.map((item) =>
          item.id === postId ? { ...item, commentCount: result.total } : item,
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
      const comment = await createComment(
        activePostId,
        activeStylistId,
        text,
        user?.name || "You",
        user?.avatar,
      );
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
      // silent
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const wasLiked = likedComments.has(commentId);
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
    setCommentsMap((prev) => {
      if (!activePostId) return prev;
      return {
        ...prev,
        [activePostId]: (prev[activePostId] || []).map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !wasLiked,
                likes: wasLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
              }
            : c,
        ),
      };
    });
    try {
      await toggleCommentLike(commentId);
    } catch {
      setLikedComments((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(commentId);
        else next.delete(commentId);
        return next;
      });
      setCommentsMap((prev) => {
        if (!activePostId) return prev;
        return {
          ...prev,
          [activePostId]: (prev[activePostId] || []).map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  isLiked: wasLiked,
                  likes: wasLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
                }
              : c,
          ),
        };
      });
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !activePostId || !activeStylistId) return;
    try {
      await reportTransformation(activePostId, activeStylistId, reportReason);
    } catch {
      // silent
    }
    setReportSubmitted(true);
  };

  useEffect(() => {
    if (loading || items.length === 0) return;

    /* clear stale canplay listeners */
    videoCanplayCleanup.current.forEach((cleanup) => cleanup());
    videoCanplayCleanup.current.clear();

    items.forEach((item, idx) => {
      const video = videoRefs.current.get(item.id);
      if (!video) return;

      if (idx === currentIndex) {
        if (manuallyPausedRef.current.has(item.id)) {
          video.muted = true;
          video.pause();
          return;
        }
        video.muted = !soundOn;

        const tryPlay = () => {
          const promise = video.play();
          if (promise) promise.catch(() => {});
        };

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          tryPlay();
        } else {
          const onCanPlay = () => tryPlay();
          video.addEventListener("canplay", onCanPlay, { once: true });
          videoCanplayCleanup.current.set(item.id, () =>
            video.removeEventListener("canplay", onCanPlay),
          );
        }
      } else {
        video.pause();
        video.muted = true;
      }
    });

    const preloadIndices = [currentIndex - 1, currentIndex + 1, currentIndex + 2];
    for (const pi of preloadIndices) {
      if (pi >= 0 && pi < items.length) {
        const pv = videoRefs.current.get(items[pi].id);
        if (pv) {
          pv.preload = "auto";
        }
      }
    }
  }, [currentIndex, items, loading, soundOn]);

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
      video.muted = !soundOn;
      const playPromise = video.play();
      if (playPromise) playPromise.catch(() => {});
      manuallyPausedRef.current.delete(itemId);
    } else {
      video.pause();
      video.muted = true;
      manuallyPausedRef.current.add(itemId);
    }
    setShowPauseIcon((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setShowPauseIcon((prev) => ({ ...prev, [itemId]: false }));
    }, 400);
  }, [soundOn]);

  const toggleSound = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSoundOn((prev) => {
      const next = !prev;
      const currentItem = items[currentIndexRef.current];
      if (currentItem) {
        const video = videoRefs.current.get(currentItem.id);
        if (video) video.muted = !next;
      }
      return next;
    });
  }, [items]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isTransitioningRef.current) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      touchDeltaRef.current = 0;
      isSwipingRef.current = false;
      setIsDragging(true);
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || isTransitioningRef.current) return;
      const touch = e.touches[0];
      const deltaY = touchStartRef.current.y - touch.clientY;
      const deltaX = touch.clientX - touchStartRef.current.x;

      if (!isSwipingRef.current) {
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
          isSwipingRef.current = true;
        } else if (Math.abs(deltaX) > 8) {
          touchStartRef.current = null;
          setIsDragging(false);
          return;
        }
      }

      if (isSwipingRef.current) {
        e.preventDefault();
        let adjustedDelta = deltaY;
        if ((deltaY > 0 && currentIndexRef.current === 0) ||
            (deltaY < 0 && currentIndexRef.current === items.length - 1)) {
          adjustedDelta = deltaY * 0.25;
        }
        touchDeltaRef.current = adjustedDelta;
        setDragOffset(adjustedDelta);
      }
    },
    [items.length],
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isTransitioningRef.current) return;
    if (e.deltaY > 0 && currentIndexRef.current < items.length - 1) {
      goToIndex(currentIndexRef.current + 1);
    } else if (e.deltaY < 0 && currentIndexRef.current > 0) {
      goToIndex(currentIndexRef.current - 1);
    }
  }, [items.length, goToIndex]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const deltaY = touchStartRef.current.y - e.changedTouches[0].clientY;
      const elapsed = Date.now() - touchStartRef.current.time;
      const velocity = Math.abs(deltaY) / Math.max(elapsed, 1);
      touchStartRef.current = null;

      if (!isSwipingRef.current) {
        setIsDragging(false);
        setDragOffset(0);
        return;
      }

      const fastSwipe = velocity > 0.5 && Math.abs(deltaY) > 15;
      const longSwipe = Math.abs(deltaY) > SWIPE_THRESHOLD;

      if (fastSwipe || longSwipe) {
        if (deltaY > 0 && currentIndexRef.current < items.length - 1) {
          goToIndex(currentIndexRef.current + 1);
        } else if (deltaY < 0 && currentIndexRef.current > 0) {
          goToIndex(currentIndexRef.current - 1);
        } else {
          setDragOffset(0);
          setIsDragging(false);
        }
      } else {
        setDragOffset(0);
        setIsDragging(false);
      }
    },
    [items.length, goToIndex],
  );

  const slideHeight = useMemo(
    () => typeof window !== "undefined" ? window.innerHeight : 800,
    []
  );
  const translateY = useMemo(
    () => -(currentIndex * slideHeight) + (isDragging ? -dragOffset : 0),
    [currentIndex, slideHeight, isDragging, dragOffset]
  );

  const imgUrl = (url: string) =>
    url?.startsWith("http") ? url : `${API_SERVER_URL}${url}`;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
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
    <>
      {/* ── Swipe feed ──────────────────────────────────── */}
      <div
        ref={containerRef}
        className="fixed inset-0 bg-black z-50 overflow-hidden"
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div className="relative w-full h-full lg:flex lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-zinc-900 lg:via-black lg:to-zinc-900">
          <div className="relative w-full h-full lg:max-w-7xl lg:max-h-[90vh] lg:flex lg:gap-6 lg:items-center lg:px-8">
        {/* Floating hearts (like animation) */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {floatingHearts.map((h) => {
            const elapsed = Date.now() - h.startTime;
            const progress = Math.min(elapsed / HEART_ANIM_MS, 1);
            const y = progress * -200;
            const opacity = 1 - progress;
            const scale = h.scale * (1 + progress * 0.5);
            return (
              <span
                key={h.id}
                className="absolute text-2xl"
                style={{
                  left: `${h.x}%`,
                  bottom: "30%",
                  transform: `translateY(${y}px) scale(${scale})`,
                  opacity,
                  transition: `opacity ${HEART_ANIM_MS}ms ease-out`,
                }}
              >
                ❤️
              </span>
            );
          })}
        </div>

        {/* Transform-based sliding container */}
        <div
          ref={sliderRef}
          className="w-full"
          style={{
            transform: `translate3d(0, ${translateY}px, 0)`,
            transition: isDragging ? "none" : `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 1, 0.5, 1)`,
            willChange: "transform",
          }}
        >
          {items.map((item, idx) => {
            const engagementRate = getEngagementRate(item);
            const isViral = engagementRate >= VIRAL_ENGAGEMENT_THRESHOLD;
            const isActive = idx === currentIndex;

            return (
              <div
                key={item.id}
                className="relative w-full overflow-hidden"
                style={{
                  height: slideHeight,
                  opacity: isActive ? 1 : 0.4,
                  transition: isDragging ? "none" : `opacity ${TRANSITION_MS}ms ease`,
                  willChange: "opacity",
                }}
              >
                {/* ── Desktop: side-by-side layout ── */}
                <div className="h-full lg:flex lg:items-center lg:gap-8">
                  {/* Media area */}
                  <div className="relative w-full h-full lg:flex lg:items-center lg:justify-center lg:flex-1 lg:min-w-0">
                    <div className="relative w-full h-full lg:max-h-[82vh] lg:aspect-[9/13] lg:rounded-2xl lg:overflow-hidden lg:shadow-[0_0_40px_rgba(0,0,0,0.5)] lg:border lg:border-white/[0.08] lg:bg-zinc-900">
                      {/* Video / Image */}
                      <div className="absolute inset-0">
                        {item.mediaType === "video" ? (
                          <div
                            className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
                            onClick={(e) => handleMediaTap(e, item.id, () => togglePlay(item.id))}
                          >
                            <video
                              ref={(el) => {
                                if (el) videoRefs.current.set(item.id, el);
                              }}
                              src={imgUrl(item.after)}
                              className="w-full h-full lg:object-contain object-cover"
                              loop
                              playsInline
                              muted
                              preload={Math.abs(idx - currentIndex) <= 2 ? "auto" : "none"}
                            />
                            {showPauseIcon[item.id] && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-scale-in">
                                  {videoRefs.current.get(item.id)?.paused ? (
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
                          <div className="grid grid-cols-2 w-full h-full cursor-pointer" onClick={(e) => handleMediaTap(e, item.id)}>
                            <div className="relative overflow-hidden bg-black">
                              <img src={imgUrl(item.before)} alt="Before" className="w-full h-full lg:object-contain object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent lg:hidden" />
                              <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold text-white bg-black/50">
                                BEFORE
                              </span>
                            </div>
                            <div className="relative overflow-hidden bg-black">
                              <img src={imgUrl(item.after)} alt="After" className="w-full h-full lg:object-contain object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent lg:hidden" />
                              <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: TIKTOK_RED }}>
                                AFTER
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black relative cursor-pointer" onClick={(e) => handleMediaTap(e, item.id)}>
                            <img src={imgUrl(item.after)} alt="Transformation" className="w-full h-full lg:object-contain object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent lg:hidden" />
                            <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold text-white lg:hidden" style={{ backgroundColor: TIKTOK_RED }}>
                              Transformation
                            </span>
                          </div>
                        )}

                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none lg:bg-gradient-to-t lg:from-black/20 lg:via-transparent lg:to-black/10" />
                      </div>

                      {/* Trending badge */}
                      {isViral && (
                        <div className="absolute top-4 left-4 z-20">
                          <div
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1"
                            style={{ backgroundColor: TIKTOK_RED }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                              <polyline points="17 6 23 6 23 12" />
                            </svg>
                            Trending
                          </div>
                        </div>
                      )}

                      {/* Sound toggle (desktop) */}
                      <button
                        onClick={toggleSound}
                        className="hidden lg:flex absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md items-center justify-center text-white hover:bg-black/60 transition-all"
                        aria-label={soundOn ? "Mute sound" : "Unmute sound"}
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

                      {/* Mobile overlays (hidden on desktop) */}
                      <div className="lg:hidden">
                        {/* Sound toggle (mobile) */}
                        <button
                          onClick={toggleSound}
                          className="absolute top-12 right-4 z-30 w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all hover:bg-black/70"
                          aria-label={soundOn ? "Mute sound" : "Unmute sound"}
                        >
                          {soundOn ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <line x1="23" y1="9" x2="17" y2="15" />
                              <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                          )}
                        </button>

                        {/* Mobile right side action buttons */}
                        <div className="absolute right-2 sm:right-4 bottom-24 sm:bottom-36 z-10 flex flex-col items-center gap-4">
                          <button
                            onClick={() => handleLike(item.id)}
                            className="flex flex-col items-center active:scale-90 transition-transform duration-100"
                            aria-label={likedItems.has(item.id) ? "Unlike" : "Like"}
                            disabled={likeCooldown}
                          >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
                              <Heart size={28} className={likedItems.has(item.id) ? "" : "text-white"} style={likedItems.has(item.id) ? { color: TIKTOK_RED, fill: TIKTOK_RED } : undefined} />
                            </div>
                            <span className="text-white text-[14px] mt-1 font-semibold tabular-nums">{formatCount(item.likes)}</span>
                          </button>
                          <button
                            onClick={() => openComments(item.id, item.stylistId)}
                            className="flex flex-col items-center active:scale-90 transition-transform duration-100"
                            aria-label="Comments"
                          >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
                              <MessageCircle size={28} className="text-white" />
                            </div>
                            <span className="text-white text-[14px] mt-1 font-semibold tabular-nums">{formatCount(item.commentCount)}</span>
                          </button>
                          <button
                            onClick={() => handleShare(item)}
                            className="flex flex-col items-center active:scale-90 transition-transform duration-100"
                            aria-label="Share"
                          >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
                              <Share2 size={28} className="text-white" />
                            </div>
                            <span className="text-white text-[14px] mt-1 font-semibold tabular-nums">{formatCount(item.shares)}</span>
                          </button>
                          <button
                            onClick={() => handleBookmark(item.id)}
                            className="flex flex-col items-center active:scale-90 transition-transform duration-100"
                            aria-label={bookmarkedItems.has(item.id) ? "Unsave" : "Save"}
                          >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
                              <Bookmark size={28} className={bookmarkedItems.has(item.id) ? "" : "text-white"} style={bookmarkedItems.has(item.id) ? { color: "#FACC15", fill: "#FACC15" } : undefined} />
                            </div>
                            <span className="text-white text-[14px] mt-1 font-semibold tabular-nums">{formatCount(item.bookmarks)}</span>
                          </button>
                          <button
                            onClick={() => { setActivePostId(item.id); setActiveStylistId(item.stylistId); setReportModalOpen(true); }}
                            className="flex flex-col items-center mt-1 active:scale-90 transition-transform duration-100"
                            aria-label="Report"
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}>
                              <Flag size={20} className="text-white/50" />
                            </div>
                          </button>
                        </div>

                        {/* Mobile bottom-left creator info */}
                        <div className="absolute bottom-24 left-0 right-28 z-10 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <button onClick={() => navigate(`/app/stylist/${item.stylistId}`)} className="flex items-center gap-2">
                                <div className="relative w-9 h-9 shrink-0">
                                  {item.stylistImage ? (
                                    <img src={imgUrl(item.stylistImage)} className="absolute inset-0 w-full h-full rounded-full border-2 border-white object-cover z-10" alt={item.stylistName} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                  ) : null}
                                  <div className="w-9 h-9 rounded-full border-2 border-white bg-white/10 flex items-center justify-center">
                                    <span className="text-white/60 text-sm font-bold">{item.stylistName[0]}</span>
                                  </div>
                                </div>
                                <span className="text-white font-bold text-sm hover:underline">{item.stylistName}</span>
                              </button>
                              <button onClick={() => navigate(`/app/stylist/${item.stylistId}`)} className="px-3 py-0.5 rounded text-[11px] font-semibold border border-white/30 text-white/90 hover:bg-white/15 transition-colors">Follow</button>
                            </div>
                            {item.caption && <p className="text-white/80 text-xs leading-relaxed line-clamp-2">{item.caption}</p>}
                          </div>
                        </div>

                        {/* Swipe hint on first item (mobile) */}
                        {idx === 0 && currentIndex === 0 && !isDragging && (
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                            <div className="text-white/50 text-xs flex flex-col items-center">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-180"><polyline points="6 9 12 15 18 9" /></svg>
                              <span className="text-[10px]">Swipe up</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Desktop side panel ── */}
                  <div className="hidden lg:flex lg:w-96 lg:flex-col lg:gap-5 lg:pr-4 lg:py-2">
                    {/* Creator section */}
                    <div className="flex items-center gap-3 pb-5 border-b border-white/[0.06]">
                      <button onClick={() => navigate(`/app/stylist/${item.stylistId}`)} className="shrink-0">
                        <div className="relative w-12 h-12">
                          {item.stylistImage ? (
                            <img src={imgUrl(item.stylistImage)} className="absolute inset-0 w-full h-full rounded-full border-2 border-white/20 object-cover z-10" alt={item.stylistName} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : null}
                          <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center">
                            <span className="text-white/60 text-lg font-bold">{item.stylistName[0]}</span>
                          </div>
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <button onClick={() => navigate(`/app/stylist/${item.stylistId}`)} className="hover:underline">
                          <p className="text-white font-semibold text-base truncate">{item.stylistName}</p>
                        </button>
                        <p className="text-white/40 text-xs mt-0.5">{item.category || 'Stylist'} · {item.location || 'Near you'}</p>
                      </div>
                      <button onClick={() => navigate(`/app/stylist/${item.stylistId}`)} className="shrink-0 px-5 py-1.5 rounded-full text-[12px] font-semibold bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95">+ Follow</button>
                    </div>

                    {/* Caption */}
                    {item.caption && (
                      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04]">
                        <p className="text-white/75 text-sm leading-relaxed">{item.caption}</p>
                        {item.serviceName && (
                          <span className="inline-block mt-2 text-[11px] font-medium text-white/40 bg-white/5 px-2.5 py-1 rounded-full">{item.serviceName}</span>
                        )}
                      </div>
                    )}

                    {/* Engagement stats row */}
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => handleLike(item.id)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-all border border-white/[0.04] group" disabled={likeCooldown}>
                        <Heart size={22} className={likedItems.has(item.id) ? "" : "text-white/70 group-hover:text-white"} style={likedItems.has(item.id) ? { color: TIKTOK_RED, fill: TIKTOK_RED } : undefined} />
                        <span className="text-white/50 text-[11px] font-semibold tabular-nums">{formatCount(item.likes)}</span>
                      </button>
                      <button onClick={() => openComments(item.id, item.stylistId)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-all border border-white/[0.04] group">
                        <MessageCircle size={22} className="text-white/70 group-hover:text-white" />
                        <span className="text-white/50 text-[11px] font-semibold tabular-nums">{formatCount(item.commentCount)}</span>
                      </button>
                      <button onClick={() => handleShare(item)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-all border border-white/[0.04] group">
                        <Share2 size={22} className="text-white/70 group-hover:text-white" />
                        <span className="text-white/50 text-[11px] font-semibold tabular-nums">{formatCount(item.shares)}</span>
                      </button>
                      <button onClick={() => handleBookmark(item.id)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-all border border-white/[0.04] group">
                        <Bookmark size={22} className={bookmarkedItems.has(item.id) ? "" : "text-white/70 group-hover:text-white"} style={bookmarkedItems.has(item.id) ? { color: "#FACC15", fill: "#FACC15" } : undefined} />
                        <span className="text-white/50 text-[11px] font-semibold tabular-nums">{formatCount(item.bookmarks)}</span>
                      </button>
                    </div>

                    {/* Report */}
                    <button
                      onClick={() => { setActivePostId(item.id); setActiveStylistId(item.stylistId); setReportModalOpen(true); }}
                      className="self-start text-white/30 hover:text-white/50 text-[11px] font-medium transition-colors flex items-center gap-1.5 mt-auto pt-2"
                    >
                      <Flag size={12} />
                      Report this post
                    </button>
                  </div>
                </div>

                {/* Refreshing indicator */}
                {idx === 0 && refreshing && (
                  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20">
                    <RefreshCw size={16} className="text-white/50 animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4 w-full" />

        {/* Double-tap heart burst overlay */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {heartBursts.map((b) => {
            const elapsed = Date.now() - b.id;
            const progress = Math.min(elapsed / 800, 1);
            const y = progress * -120;
            const opacity = 1 - progress;
            const scale = b.scale * (1 + progress * 0.6);
            return (
              <span
                key={b.id}
                className="absolute text-5xl"
                style={{
                  left: `${(b.x / (typeof window !== "undefined" ? window.innerWidth : 400)) * 100}%`,
                  top: `${(b.y / (typeof window !== "undefined" ? window.innerHeight : 800)) * 100}%`,
                  transform: `translate(-50%, -50%) translateY(${y}px) scale(${scale})`,
                  opacity,
                  transition: `opacity 200ms ease-out`,
                }}
              >
                ❤️
              </span>
            );
          })}
        </div>

        {/* TikTok-style progress indicator */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 lg:right-4 flex flex-col items-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToIndex(idx)}
              className="rounded-full transition-all duration-300 hover:scale-125"
              style={{
                width: idx === currentIndex ? 12 : 6,
                height: idx === currentIndex ? 12 : 6,
                backgroundColor: idx === currentIndex ? "#ffffff" : "rgba(255,255,255,0.25)",
                boxShadow: idx === currentIndex ? "0 0 8px rgba(255,255,255,0.4)" : "none",
              }}
              aria-label={`Go to item ${idx + 1}`}
            />
          ))}
        </div>

        {/* Fixed top header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-4 sm:px-6 py-3 bg-gradient-to-b from-black/70 to-transparent lg:bg-gradient-to-b lg:from-black/50 lg:via-black/20 lg:to-transparent">
          <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all" aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs font-medium hidden lg:inline tabular-nums">{currentIndex + 1} / {items.length}</span>
            <button onClick={handleRefresh} className="text-white/40 hover:text-white/70 p-2 rounded-full hover:bg-white/10 transition-all" aria-label="Refresh feed">
              <RefreshCw size={18} />
            </button>
          </div>
          </div>
        </div>
      </div>



      {/* Share menu */}
      {shareMenuOpen && shareItemId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
          onClick={() => {
            setShareMenuOpen(false);
            setShareItemId(null);
          }}
        >
          <div
            className="w-full rounded-t-2xl p-4 pb-8 flex flex-col gap-1"
            style={{ backgroundColor: "#1a1a1a" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white/40 text-xs text-center mb-2">Share to</div>
            {[
              {
                action: "copy" as const,
                label: "Copy link",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                ),
              },
              {
                action: "messages" as const,
                label: "Send to Messages",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
              },
              {
                action: "external" as const,
                label: "Share externally",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                ),
              },
            ].map((opt) => {
              const shareItem = items.find((i) => i.id === shareItemId);
              if (!shareItem) return null;
              return (
                <button
                  key={opt.action}
                  onClick={() => handleShareAction(opt.action, shareItem)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-colors"
                >
                  {opt.icon}
                  <span className="text-sm">{opt.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setShareMenuOpen(false);
                setShareItemId(null);
              }}
              className="mt-2 w-full py-3 rounded-xl text-white/50 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comment modal */}
      {commentModalOpen && activePostId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end lg:items-center lg:justify-center"
          onClick={() => setCommentModalOpen(false)}
        >
          <div
            className="w-full max-h-[85vh] rounded-t-2xl flex flex-col lg:rounded-2xl lg:max-h-[90vh] lg:max-w-4xl lg:flex-row lg:overflow-hidden"
            style={{ backgroundColor: "#1a1a1a" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center min-h-[50vh]">
              {(() => {
                const post = items.find((item) => item.id === activePostId);
                if (!post) return null;
                return post.mediaType === "video" ? (
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
                    <div className="relative overflow-hidden bg-black">
                      <img src={imgUrl(post.before)} alt="Before" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold text-white bg-black/50">
                        BEFORE
                      </span>
                    </div>
                    <div className="relative overflow-hidden bg-black">
                      <img src={imgUrl(post.after)} alt="After" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold text-white" style={{ backgroundColor: TIKTOK_RED }}>
                        AFTER
                      </span>
                    </div>
                  </div>
                ) : (
                  <img src={imgUrl(post.after)} alt="Post" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                );
              })()}
            </div>

            <div className="flex flex-col lg:w-1/2 lg:max-h-[90vh]">
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 shrink-0">
                <h3 className="text-white font-semibold text-base">
                  Comments <span className="text-white/40 font-normal">{commentsTotal}</span>
                </h3>
                <button
                  onClick={() => setCommentModalOpen(false)}
                  className="text-white/50 hover:text-white p-1"
                  aria-label="Close comments"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {commentsLoading ? (
                  <div className="space-y-4 p-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 rounded bg-white/10" />
                          <div className="h-3 w-48 rounded bg-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : commentsMap[activePostId]?.length > 0 ? (
                  <div>
                    {commentsMap[activePostId].map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="relative w-8 h-8 shrink-0 mt-0.5">
                          {comment.userAvatar ? (
                            <img
                              src={comment.userAvatar}
                              className="absolute inset-0 w-full h-full rounded-full object-cover z-10"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                            <span className="text-white/50 text-xs font-bold">
                              {comment.userName[0]?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="text-white text-sm font-semibold truncate">
                              {comment.userName}
                            </p>
                            <p className="text-white/30 text-[11px] shrink-0 whitespace-nowrap">
                              {formatRelativeTime(comment.createdAt)}
                            </p>
                          </div>
                          <p className="text-white/80 text-sm mt-0.5 break-words">
                            {comment.text}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCommentLike(comment.id);
                          }}
                          className="shrink-0 self-start mt-1.5 flex flex-col items-center gap-0.5"
                        >
                          {likedComments.has(comment.id) || comment.isLiked ? (
                            <Heart size={14} style={{ color: TIKTOK_RED, fill: TIKTOK_RED }} />
                          ) : (
                            <Heart size={14} className="text-white/30 hover:text-red-400 transition-colors" />
                          )}
                          {comment.likes > 0 && (
                            <span className="text-[10px] text-white/40 tabular-nums leading-none">
                              {comment.likes}
                            </span>
                          )}
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
                )}
              </div>

              <div className="shrink-0 border-t border-white/10 p-3 flex gap-2 items-center">
                <div className="relative w-7 h-7 shrink-0">
                  {user?.avatar ? (
                    <img src={imgUrl(user.avatar)} className="absolute inset-0 w-full h-full rounded-full object-cover z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : null}
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                    <span className="text-white/40 text-[10px] font-bold">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
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
                  className="text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                  style={{ color: TIKTOK_RED }}
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
          onClick={() => {
            setReportModalOpen(false);
            setReportSubmitted(false);
            setReportReason("");
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: "#1a1a1a" }}
            onClick={(e) => e.stopPropagation()}
          >
            {reportSubmitted ? (
              <>
                <h3 className="text-white font-semibold text-lg mb-2">Report submitted</h3>
                <p className="text-white/60 text-sm mb-4">
                  Our team will review this content. Thank you for helping keep GlowUp safe.
                </p>
                <button
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportSubmitted(false);
                    setReportReason("");
                  }}
                  className="w-full py-2 text-white rounded-full text-sm font-medium"
                  style={{ backgroundColor: TIKTOK_RED }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 className="text-white font-semibold text-lg mb-2">Report this post</h3>
                <p className="text-white/60 text-sm mb-4">
                  Why are you reporting this transformation?
                </p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full bg-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 outline-none resize-none h-24"
                />
                <button
                  onClick={submitReport}
                  disabled={!reportReason.trim()}
                  className="w-full mt-3 py-2 text-white rounded-full text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: TIKTOK_RED }}
                >
                  Submit Report
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
      </div>
    </>
  );
}
