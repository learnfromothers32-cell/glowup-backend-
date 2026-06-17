import { useRef, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Flame,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPublishedArticles, type Article } from "../../../api/tips";
import { CATEGORY_COLORS, tips as fallbackTips } from "../../../data/beauty-tips";
import { useAuth } from "../../../context/authUtils";

const BOOKMARKS_KEY = "glowup_tip_bookmarks_v2";

function loadBookmarks(): Set<string> {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? new Set<string>(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

const ALL_CATEGORIES = ["All", "Hair", "Barber", "Skin", "Nails", "Lashes"];

interface DisplayTip {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: string;
}

function toDisplay(a: Article): DisplayTip {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    image: a.image,
    category: a.category,
    readTime: a.readTime,
  };
}

function SkeletonCard() {
  return (
    <div className="shrink-0 w-[280px] rounded-xl border border-gray-100 overflow-hidden bg-white">
      <div className="h-44 bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="w-16 h-3 rounded-full bg-gray-100 animate-pulse" />
          <div className="w-12 h-3 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="w-full h-4 rounded-full bg-gray-100 animate-pulse" />
        <div className="w-3/4 h-3 rounded-full bg-gray-50 animate-pulse" />
      </div>
    </div>
  );
}

export default function BeautyTips() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);
  const [tips, setTips] = useState<DisplayTip[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let cancelled = false;
    getPublishedArticles({ limit: 20 })
      .then((res) => {
        if (cancelled) return;
        if (res.items.length > 0) {
          setTips(res.items.map(toDisplay));
        } else {
          setTips(
            fallbackTips.map((t) => ({
              id: String(t.id),
              title: t.title,
              slug: t.slug,
              excerpt: t.excerpt,
              image: t.image,
              category: t.category,
              readTime: t.readTime,
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTips(
            fallbackTips.map((t) => ({
              id: String(t.id),
              title: t.title,
              slug: t.slug,
              excerpt: t.excerpt,
              image: t.image,
              category: t.category,
              readTime: t.readTime,
            }))
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          const t = setTimeout(() => setLoading(false), 300);
          return () => clearTimeout(t);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const filteredTips =
    activeCategory === "All"
      ? tips
      : tips.filter((t) => t.category === activeCategory);

  const checkArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 8);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    if (loading) return;
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(checkArrows, 100);
    el.addEventListener("scroll", checkArrows, { passive: true });
    window.addEventListener("resize", checkArrows);
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", checkArrows);
      window.removeEventListener("resize", checkArrows);
    };
  }, [loading, checkArrows, activeCategory]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  const toggleBookmark = (tipId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(tipId)) {
        next.delete(tipId);
      } else {
        next.add(tipId);
      }
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleCardClick = (slug: string) => {
    navigate(`/blog/beauty/${slug}`);
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
            <BookOpen size={15} className="text-pink-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">
              Beauty Tips & Inspiration
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Expert advice for your next appointment
            </p>
          </div>
        </div>

        <Link
          to="/blog/beauty"
          className="flex items-center gap-1 text-xs font-medium text-pink-500 hover:text-pink-600 transition-colors"
        >
          View all
          <ChevronRight size={12} />
        </Link>
      </div>

      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {ALL_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const isAll = cat === "All";
          const icon = isAll ? Sparkles : undefined;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm dark:bg-indigo-500"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              }`}
            >
              {icon && <Sparkles size={12} />}
              {cat === "All" ? "All Tips" : cat}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredTips.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
          <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No tips in this category yet.</p>
          <button
            onClick={() => setActiveCategory("All")}
            className="mt-2 text-xs font-medium text-pink-500 hover:text-pink-600"
          >
            View all tips
          </button>
        </div>
      ) : (
        <div className="relative group/scroll">
          <AnimatePresence>
            {showLeft && (
              <motion.div
                key="left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 z-10 flex items-center"
              >
                <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
                <button
                  onClick={() => scroll("left")}
                  className="relative ml-2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
                >
                  <ArrowLeft size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showRight && (
              <motion.div
                key="right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 top-0 bottom-0 z-10 flex items-center"
              >
                <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
                <button
                  onClick={() => scroll("right")}
                  className="relative mr-2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
                >
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filteredTips.map((tip, i) => {
              const colors = CATEGORY_COLORS[tip.category] || {
                bg: "bg-gray-100",
                text: "text-gray-700",
                dot: "bg-gray-500",
              };
              const isBookmarked = bookmarks.has(tip.id);

              return (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <div className="group block shrink-0 w-[280px] bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-200 cursor-pointer">
                    <div
                      className="relative h-44 overflow-hidden bg-gray-100"
                      onClick={() => handleCardClick(tip.slug)}
                    >
                      <img
                        src={tip.image}
                        alt={tip.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

                      <span
                        className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                      >
                        {tip.category}
                      </span>

                      {tip.readTime && (
                        <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                          <Clock size={9} />
                          {tip.readTime}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            navigate("/login");
                            return;
                          }
                          toggleBookmark(tip.id);
                        }}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                          isBookmarked
                            ? "bg-pink-500/90 text-white"
                            : "bg-black/30 text-white/80 hover:bg-black/50"
                        }`}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck size={12} />
                        ) : (
                          <Bookmark size={12} />
                        )}
                      </button>
                    </div>

                    <div
                      className="p-4"
                      onClick={() => handleCardClick(tip.slug)}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors mb-1.5">
                        {tip.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {tip.excerpt}
                      </p>
                      <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                        Read more
                        <ArrowRight
                          size={11}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div className="w-1 shrink-0" />
          </div>
        </div>
      )}

      {bookmarks.size > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Flame size={16} className="text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-amber-800">
                {bookmarks.size} tip{bookmarks.size > 1 ? "s" : ""} saved
              </p>
              <p className="text-[11px] text-amber-600/70">
                Tap the bookmark to save or remove
              </p>
            </div>
          </div>
          <Link
            to={`/blog/beauty?bookmarked=true`}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
          >
            View saved
          </Link>
        </div>
      )}
    </section>
  );
}
