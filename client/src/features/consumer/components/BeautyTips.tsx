import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowLeft, ChevronRight,
  Clock, BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tip {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  slug: string;
  category: string;
  readTime?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const tips: Tip[] = [
  {
    id: 1,
    title: "10 Braid Styles for the Summer",
    excerpt: "Protective, stylish, and easy to maintain — discover the hottest braid trends this season.",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&q=80",
    slug: "braid-styles-summer",
    category: "Hair",
    readTime: "4 min",
  },
  {
    id: 2,
    title: "How to Choose the Right Fade for Your Face Shape",
    excerpt: "A barber's guide to picking the perfect fade that complements your features.",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80",
    slug: "fade-face-shape",
    category: "Barber",
    readTime: "3 min",
  },
  {
    id: 3,
    title: "Skincare Prep Before a Facial",
    excerpt: "Maximize your glow with these pre-treatment tips from top estheticians.",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80",
    slug: "skincare-prep",
    category: "Skin",
    readTime: "5 min",
  },
  {
    id: 4,
    title: "Nail Art Trends You'll Love in 2025",
    excerpt: "From minimalist to bold — get inspired for your next manicure appointment.",
    image: "https://images.unsplash.com/photo-1610991461101-5b6b8a6d4a1f?w=400&q=80",
    slug: "nail-art-trends",
    category: "Nails",
    readTime: "3 min",
  },
  {
    id: 5,
    title: "The Ultimate Lash Care Guide",
    excerpt: "Keep your extensions looking fresh with these expert maintenance tips.",
    image: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&q=80",
    slug: "lash-care-guide",
    category: "Lashes",
    readTime: "4 min",
  },
];

// ─── Category color map ───────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Hair: { bg: "bg-violet-100", text: "text-violet-700" },
  Barber: { bg: "bg-blue-100", text: "text-blue-700" },
  Braids: { bg: "bg-purple-100", text: "text-purple-700" },
  Skin: { bg: "bg-teal-100", text: "text-teal-700" },
  Nails: { bg: "bg-pink-100", text: "text-pink-700" },
  Lashes: { bg: "bg-rose-100", text: "text-rose-700" },
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="shrink-0 w-[260px] rounded-xl border border-gray-100 overflow-hidden bg-white">
      <div className="h-40 bg-gray-100 animate-pulse" />
      <div className="p-3.5 space-y-2">
        <div className="w-24 h-2.5 rounded-full bg-gray-100 animate-pulse" />
        <div className="w-full h-3.5 rounded-full bg-gray-100 animate-pulse" />
        <div className="w-3/4 h-3 rounded-full bg-gray-50 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BeautyTips() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // ── Scroll arrow visibility ──
  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 8);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

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
  }, [loading]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  return (
    <section>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
            <BookOpen size={15} className="text-pink-500" />
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
          to="/blog"
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
        >
          View all
          <ChevronRight size={12} />
        </Link>
      </div>

      {/* ── Cards ── */}
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="relative group/scroll">
          {/* Left fade + arrow */}
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

          {/* Right fade + arrow */}
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

          {/* Scrollable cards */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tips.map((tip, i) => {
              const colors = CATEGORY_COLORS[tip.category] || {
                bg: "bg-gray-100",
                text: "text-gray-700",
              };

              return (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <Link
                    to={`/blog/${tip.slug}`}
                    className="group block shrink-0 w-[260px] bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100 transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      <img
                        src={tip.image}
                        alt={tip.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />

                      {/* Category badge */}
                      <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {tip.category}
                      </span>

                      {/* Read time */}
                      {tip.readTime && (
                        <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[10px] font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                          <Clock size={9} />
                          {tip.readTime}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3.5">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors mb-1.5">
                        {tip.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {tip.excerpt}
                      </p>
                      <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                        Read more
                        <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {/* End spacer */}
            <div className="w-1 shrink-0" />
          </div>
        </div>
      )}
    </section>
  );
}