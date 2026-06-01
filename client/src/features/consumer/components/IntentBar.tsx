// src/pages/consumer/components/IntentBar.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scissors,
  Sparkles,
  Droplets,
  Eye,
  Wand2,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data ───────────────────────────────────────────────
const services = [
  { label: "All", icon: Sparkles },
  { label: "Hair", icon: Scissors },
  { label: "Barber", icon: UserCheck },
  { label: "Braids", icon: Wand2 },
  { label: "Nails", icon: Sparkles },
  { label: "Skin", icon: Droplets },
  { label: "Lashes", icon: Eye },
];

// ─── Props ──────────────────────────────────────────────
interface IntentBarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
}

// ─── Component ──────────────────────────────────────────
export default function IntentBar({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: IntentBarProps) {
  const navigate = useNavigate();
  const [sparked, setSparked] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll arrow visibility
  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 8);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkArrows();
    el.addEventListener("scroll", checkArrows, { passive: true });
    window.addEventListener("resize", checkArrows);
    return () => {
      el.removeEventListener("scroll", checkArrows);
      window.removeEventListener("resize", checkArrows);
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  const handleCategoryClick = (label: string) => {
    onCategoryChange(label === "All" ? "" : label);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
    } else if (searchQuery.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSurprise = () => {
    if (sparked) return;
    setSparked(true);
    setTimeout(() => {
      setSparked(false);
      navigate("/app/vibe-match");
    }, 1600);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm dark:bg-[var(--color-surface)] dark:border-gray-700/80">
      {/* ── Search + AI Button (always visible) ──────────── */}
      <div className="flex items-center gap-3 p-3 pb-0 sm:pb-2">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none dark:text-gray-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search stylists, services..."
            className="w-full pl-11 pr-4 py-3 sm:py-3.5 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all dark:bg-gray-800/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800 dark:focus:ring-indigo-500/30 dark:focus:border-indigo-400"
          />
        </form>

        {/* AI Vibe Match – always visible */}
        
        <button
          onClick={handleSurprise}
          disabled={sparked}
          className={`
    relative flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-3.5 rounded-2xl text-sm font-bold
    whitespace-nowrap transition-all duration-300 shrink-0 select-none overflow-hidden
    ${
      sparked
        ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md"
        : "bg-gradient-to-r from-violet-50 to-pink-50 text-violet-700 border border-violet-100 hover:from-violet-100 hover:to-pink-100 hover:border-violet-200 dark:from-violet-500/20 dark:to-pink-500/20 dark:text-violet-300 dark:border-violet-800 dark:hover:from-violet-500/30 dark:hover:to-pink-500/30 dark:hover:border-violet-700"
    }
  `}
        >
          {sparked ? (
            <Loader2 size={16} className="animate-spin relative z-10" />
          ) : (
            <Sparkles size={16} className="relative z-10" />
          )}
          <span className="relative z-10 hidden sm:inline">
            {sparked ? "Matching…" : "Vibe Match"}
          </span>
          <span className="relative z-10 inline sm:hidden">
            {sparked ? "" : "AI"}
          </span>
          {!sparked && (
            <span className="relative z-10 text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-500 leading-none dark:bg-violet-900/60 dark:text-violet-300">
              AI Vibe Match
            </span>
          )}
        </button>
      </div>

      {/* ── Divider ──────────────────────────────────────── */}
      <div className="h-px bg-gray-100 mx-4 mt-3 dark:bg-gray-700/60" />

      {/* ── Category chips (scrollable) ─────────────────── */}
      <div className="relative group/scroll">
        {/* Left arrow */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 z-10 flex items-center"
            >
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none dark:from-[var(--color-surface)]" />
              <button
                type="button"
                onClick={() => scroll("left")}
                className="relative ml-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100 dark:bg-[var(--color-surface)] dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronLeft size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right arrow */}
        <AnimatePresence>
          {showRightArrow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 z-10 flex items-center"
            >
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none dark:from-[var(--color-surface)]" />
              <button
                type="button"
                onClick={() => scroll("right")}
                className="relative mr-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100 dark:bg-[var(--color-surface)] dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronRight size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable chips */}
        <div
          ref={scrollRef}
          className="flex items-center gap-1.5 overflow-x-auto px-4 py-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {services.map((service) => {
            const Icon = service.icon;
            const isActive =
              activeCategory === service.label ||
              (activeCategory === "" && service.label === "All");

            return (
              <button
                key={service.label}
                onClick={() => handleCategoryClick(service.label)}
                className={`
                  relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium
                  whitespace-nowrap transition-all duration-200 shrink-0 select-none
                  ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm dark:bg-indigo-600 dark:text-white"
                      : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:hover:border-gray-600"
                  }
                `}
              >
                <Icon
                  size={14}
                  className={isActive ? "text-white" : "text-gray-400 dark:text-gray-500"}
                />
                {service.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
