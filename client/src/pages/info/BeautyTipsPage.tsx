import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Search, Clock, Bookmark, BookmarkCheck,
  Tag, Calendar, Loader2,
} from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";
import { getPublishedArticles, type Article } from "../../api/tips";
import { tips as fallbackTips, ALL_CATEGORIES as FALLBACK_CATEGORIES, CATEGORY_COLORS, type Tip } from "../../data/beauty-tips";
import { useAuth } from "../../context/authUtils";

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
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

export default function BeautyTipsPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(loadBookmarks);
  const [apiTips, setApiTips] = useState<DisplayTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
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
    <div className="min-h-screen bg-neutral-950">
      <LandingNavbar />
      <main className="pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide mb-6">
              <Sparkles size={12} />
              Beauty Tips
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
              Beauty Tips & Inspiration
            </h1>
            <p className="text-lg text-neutral-400 max-w-xl mb-8">
              Expert advice, tutorials, and guides to help you look and feel your best.
            </p>
          </FadeIn>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowBookmarked(false); }}
                placeholder="Search tips..."
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>
            <button
              onClick={() => { setShowBookmarked(!showBookmarked); setActiveCat("All"); }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                showBookmarked
                  ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                  : "bg-white/[0.04] text-neutral-500 border border-white/[0.06] hover:text-neutral-300 hover:bg-white/[0.06]"
              }`}
            >
              <BookmarkCheck size={14} />
              Saved ({bookmarks.size})
            </button>
          </div>

          {!showBookmarked && (
            <FadeIn delay={0.1}>
              <div className="flex flex-wrap gap-2 mb-10">
                {ALL_CATEGORIES.map(cat => {
                  const isActive = activeCat === cat;
                  const isAll = cat === "All";
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCat(cat)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-white/[0.04] text-neutral-500 border border-transparent hover:text-neutral-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      {isAll && <Sparkles size={12} />}
                      {isAll ? "All Tips" : cat}
                    </button>
                  );
                })}
              </div>
            </FadeIn>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-neutral-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((tip, i) => {
                const colors = CATEGORY_COLORS[tip.category] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" };
                const isBookmarked = bookmarks.has(tip.id);

                return (
                  <FadeIn key={tip.id} delay={i * 0.04}>
                    <Link
                      to={`/blog/beauty/${tip.slug}`}
                      className="group block rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-800">
                        <img
                          src={tip.image}
                          alt={tip.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950/60 to-transparent" />
                        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {tip.category}
                        </span>
                        {tip.readTime && (
                          <span className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-medium text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            <Clock size={9} />
                            {tip.readTime}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleBookmark(tip.id);
                          }}
                          className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                            isBookmarked
                              ? "bg-pink-500/90 text-white"
                              : "bg-black/30 text-white/70 hover:bg-black/50"
                          }`}
                        >
                          {isBookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-2">
                          <span className="flex items-center gap-1"><Calendar size={10} />{tip.date || "Recent"}</span>
                          <span className="flex items-center gap-1"><Clock size={10} />{tip.readTime}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-2 leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
                          {tip.title}
                        </h3>
                        <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2 mb-3">
                          {tip.excerpt}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {tip.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-[10px] text-neutral-600 bg-white/[0.04] px-2 py-0.5 rounded-full">
                              <Tag size={8} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                );
              })}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-sm mb-1">
                {showBookmarked ? "No saved tips yet" : "No tips found"}
              </p>
              <p className="text-neutral-600 text-xs mb-6">
                {showBookmarked ? "Bookmark tips to save them for later" : "Try a different search term or category"}
              </p>
              {showBookmarked ? (
                <button
                  onClick={() => setShowBookmarked(false)}
                  className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                >
                  Browse all tips
                </button>
              ) : null}
            </div>
          )}
        </div>
      </main>
      <AppFooter variant="landing" />
    </div>
  );
}
