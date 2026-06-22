import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import {
  Sparkles, Search, Clock, Bookmark, BookmarkCheck,
  Tag, Calendar, ArrowRight, SlidersHorizontal, X,
} from "lucide-react";
import { getPublishedArticles, type Article } from "../../api/tips";
import { tips as fallbackTips, ALL_CATEGORIES as FALLBACK_CATEGORIES, CATEGORY_COLORS, type Tip } from "../../data/beauty-tips";
import { useAuth } from "../../context/authUtils";
import { Button } from "../../components/ui/Button";

const BOOKMARKS_KEY = "glowup_tip_bookmarks_v2";

function loadBookmarks(): Set<string> {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? new Set<string>(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface DisplayTip {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: string;
  author: string;
  date: string;
  tags: string[];
}

function toDisplayTip(a: Article): DisplayTip {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    image: a.image,
    category: a.category,
    readTime: a.readTime,
    author: a.author,
    date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    tags: a.tags,
  };
}

function toDisplayFromFallback(t: Tip): DisplayTip {
  return {
    id: String(t.id),
    title: t.title,
    slug: t.slug,
    excerpt: t.excerpt,
    image: t.image,
    category: t.category,
    readTime: t.readTime,
    author: t.author,
    date: t.date,
    tags: t.tags,
  };
}

const ALL_CATEGORIES = ["All", "Hair", "Barber", "Skin", "Nails", "Lashes"];

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-surface-secondary dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800/60 overflow-hidden">
      <div className="aspect-[16/10] bg-gray-200 dark:bg-gray-800 skeleton-pulse" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800 skeleton-pulse" />
          <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-800 skeleton-pulse" />
        </div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse" />
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded skeleton-pulse" />
      </div>
    </div>
  );
}

export default function BeautyTipsPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);
  const [apiTips, setApiTips] = useState<DisplayTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("bookmarked") === "true") {
      setShowBookmarked(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublishedArticles({ limit: 50 })
      .then((res) => {
        if (cancelled) return;
        if (res.items.length > 0) {
          setApiTips(res.items.map(toDisplayTip));
          setIsLive(true);
        } else {
          setApiTips(fallbackTips.map(toDisplayFromFallback));
          setIsLive(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiTips(fallbackTips.map(toDisplayFromFallback));
          setIsLive(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  let filtered = apiTips;

  if (showBookmarked) {
    filtered = filtered.filter(t => bookmarks.has(t.id));
  } else if (activeCat !== "All") {
    filtered = filtered.filter(t => t.category === activeCat);
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      t => t.title.toLowerCase().includes(q) || t.excerpt.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q))
    );
  }

  const toggleBookmark = (tipId: string) => {
    if (!isAuthenticated) return;
    setBookmarks(prev => {
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

  return (
    <motion.div
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      transition={pageTransition}
      className="min-h-screen bg-warm-50 dark:bg-surface-dark"
    >
      <main className="pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-semibold tracking-wide mb-5">
              <Sparkles size={12} />
              Beauty Tips
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-3 font-display">
              Beauty Tips & Inspiration
            </h1>
            <p className="text-body-sm text-text-secondary dark:text-text-dark-secondary max-w-xl mb-8">
              Expert advice, tutorials, and guides from top beauticians to help you look and feel your best.
            </p>
          </FadeIn>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowBookmarked(false); }}
                placeholder="Search tips..."
                className="w-full bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700/60 rounded-xl py-2.5 pl-10 pr-4 text-body-sm text-text-primary dark:text-text-dark-primary placeholder:text-text-muted dark:placeholder:text-text-dark-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-label font-medium transition-all border ${
                  showFilters
                    ? "bg-brand-500/10 text-brand-500 border-brand-500/20"
                    : "bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button
                onClick={() => { setShowBookmarked(!showBookmarked); setActiveCat("All"); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-label font-medium transition-all border ${
                  showBookmarked
                    ? "bg-brand-500/10 text-brand-500 border-brand-500/20"
                    : "bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <BookmarkCheck size={14} />
                <span className="hidden sm:inline">Saved</span>
                {bookmarks.size > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                    {bookmarks.size}
                  </span>
                )}
              </button>
            </div>
          </div>

          {!showBookmarked && (
            <FadeIn delay={0.05}>
              <div className="flex flex-wrap gap-2 mb-8">
                {ALL_CATEGORIES.map(cat => {
                  const isActive = activeCat === cat;
                  const isAll = cat === "All";
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCat(cat)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-label font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                          : "bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-500 hover:text-text-primary dark:hover:text-text-dark-primary"
                      }`}
                    >
                      {isAll && <Sparkles size={13} />}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </FadeIn>
          )}

          {!showBookmarked && showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700/60"
            >
              <p className="text-caption text-text-muted dark:text-text-dark-muted">
                More filter options coming soon
              </p>
            </motion.div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 sm:py-24"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/10 to-gold-500/10 flex items-center justify-center mx-auto mb-5">
                <Search size={28} className="text-brand-400" />
              </div>
              <h3 className="text-h3 text-text-primary dark:text-text-dark-primary mb-2 font-display">
                {showBookmarked ? "No saved tips yet" : "No tips found"}
              </h3>
              <p className="text-body-sm text-text-secondary dark:text-text-dark-secondary max-w-sm mx-auto mb-6">
                {showBookmarked
                  ? "Tap the bookmark icon on any tip to save it here for later reading."
                  : "Try adjusting your search or category filter to find what you're looking for."}
              </p>
              {showBookmarked ? (
                <Button
                  onClick={() => setShowBookmarked(false)}
                  variant="primary"
                  size="md"
                >
                  Browse all tips
                  <ArrowRight size={14} />
                </Button>
              ) : (
                <Button
                  onClick={() => { setQuery(""); setActiveCat("All"); }}
                  variant="ghost"
                  size="md"
                >
                  Clear filters
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((tip, i) => {
                  const colors = CATEGORY_COLORS[tip.category] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" };
                  const isBookmarked = bookmarks.has(tip.id);

                  return (
                    <motion.div
                      key={tip.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16, scale: 0.95 }}
                      transition={{ delay: i * 0.04, duration: 0.35, layout: { duration: 0.3 } }}
                    >
                      <Link
                        to={`/app/blog/beauty/${tip.slug}`}
                        className="group block rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 overflow-hidden card-hover transition-all duration-300"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={tip.image}
                            alt={tip.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                          <span
                            className={`absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}
                          >
                            {tip.category}
                          </span>
                          {tip.readTime && (
                            <span className="absolute bottom-3 right-3 flex items-center gap-1 text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                              <Clock size={10} />
                              {tip.readTime}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleBookmark(tip.id);
                            }}
                            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                              isBookmarked
                                ? "bg-brand-500 text-white shadow-sm"
                                : "bg-black/30 text-white/70 hover:bg-black/50 hover:text-white"
                            }`}
                          >
                            {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                          </button>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-3 text-caption text-text-secondary dark:text-text-dark-muted mb-2.5">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={11} />
                              {tip.date || "Recent"}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            <span className="flex items-center gap-1.5">
                              <Clock size={11} />
                              {tip.readTime}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-text-primary dark:text-text-dark-primary mb-2 leading-snug line-clamp-2 group-hover:text-brand-500 transition-colors">
                            {tip.title}
                          </h3>
                          <p className="text-body-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed line-clamp-2 mb-3">
                            {tip.excerpt}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {tip.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-[11px] text-text-muted dark:text-text-dark-muted bg-warm-50 dark:bg-surface-dark-tertiary px-2 py-1 rounded-full"
                              >
                                <Tag size={8} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}
