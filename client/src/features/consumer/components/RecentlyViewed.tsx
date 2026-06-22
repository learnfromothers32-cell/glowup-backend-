import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Star,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";
import { logger } from "../../../utils/logger";

interface RecentlyViewedProps {
  stylists: Stylist[];
}

// ─── Stylist Card (safe & polished) ────────────────────────────────
function RecentCard({
  stylist,
  index,
  onClick,
}: {
  stylist: Stylist;
  index: number;
  onClick: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Safe initials generation – never crashes, always returns something
  const initials = stylist.name
    ? stylist.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    : "?";

  // Show a friendly placeholder if the name is completely missing
  const displayName = stylist.name?.trim() || "Stylist";

  const showImage = stylist.image && !imageError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="flex-shrink-0 w-[140px] cursor-pointer group"
    >
      <div className="relative w-[120px] h-[120px] mx-auto">
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-surface-dark-tertiary ring-2 ring-gray-100 dark:ring-gray-700/40 group-hover:ring-gray-200 dark:group-hover:ring-gray-600 transition-all duration-200">
          {/* Initials (shown until image loads, or permanently on error / no image) */}
          {(!imageLoaded || !showImage) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 dark:from-surface-dark-tertiary to-gray-200 dark:to-surface-dark-secondary">
              <span className="text-lg font-bold text-text-muted dark:text-text-dark-muted">
                {initials}
              </span>
            </div>
          )}
          {/* Image */}
          {showImage && (
            <img
              src={stylist.image}
              alt={displayName}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false); // keep initials visible
              }}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              } group-hover:scale-105`}
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-2xl" />
        </div>

        {/* "View" badge on hover */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500 text-white text-[10px] font-semibold shadow-lg whitespace-nowrap dark:bg-white dark:text-gray-900">
            View
            <ArrowRight size={9} />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="text-center mt-3 px-1">
        <p className="text-xs font-semibold text-text-primary dark:text-text-dark-primary truncate group-hover:text-gray-700 dark:group-hover:text-text-dark-secondary transition-colors">
          {displayName}
        </p>
        {stylist.rating != null && stylist.rating > 0 && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
            <span className="text-[11px] font-medium text-text-secondary dark:text-text-dark-secondary tabular-nums">
              {stylist.rating}
            </span>
          </div>
        )}
        {stylist.category && (
          <p className="text-[10px] text-text-muted dark:text-text-dark-muted mt-0.5 truncate">
            {stylist.category}
          </p>
        )}
        {stylist.location && (
          <p className="flex items-center justify-center gap-0.5 text-[10px] text-text-muted dark:text-text-dark-muted mt-0.5">
            <MapPin size={8} />
            <span className="truncate max-w-[100px]">
              {getLocationString(stylist.location)}
            </span>
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State (unchanged) ──────────────────────────────────────
function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="text-center py-8 px-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center mx-auto mb-3">
        <Clock size={20} className="text-text-muted dark:text-text-dark-muted" />
      </div>
      <p className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">No recent views yet</p>
      <p className="text-xs text-text-muted dark:text-text-dark-muted mt-1 max-w-[200px] mx-auto">
        Stylists you view will appear here for quick access
      </p>
      <button
        onClick={() => navigate("/app/stylists")}
        className="mt-3 text-xs font-semibold text-gray-700 dark:text-text-dark-secondary hover:text-gray-900 dark:hover:text-text-dark-primary transition-colors"
      >
        Browse stylists →
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function RecentlyViewed({
  stylists,
}: RecentlyViewedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const navigate = useNavigate();

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 8;
    setShowLeftArrow(el.scrollLeft > threshold);
    setShowRightArrow(
      el.scrollLeft < el.scrollWidth - el.clientWidth - threshold,
    );
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(checkArrows, 100);
    el.addEventListener("scroll", checkArrows, { passive: true });
    window.addEventListener("resize", checkArrows);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkArrows);
      window.removeEventListener("resize", checkArrows);
    };
  }, [stylists]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  if (stylists.length === 0) return <EmptyState />;

  return (
    <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200/80 dark:border-gray-600 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center">
            <Clock size={15} className="text-text-secondary dark:text-text-dark-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary tracking-tight">
              Recently Viewed
            </h3>
            <p className="text-[11px] text-text-muted dark:text-text-dark-muted mt-0.5">
              Pick up where you left off
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary text-text-secondary dark:text-text-dark-secondary tabular-nums">
          {stylists.length}
        </span>
      </div>

      <div className="relative group/scroll">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 z-10 flex items-center"
            >
              <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-white dark:from-surface-dark-secondary to-transparent pointer-events-none" />
              <button
                onClick={() => scroll("left")}
                className="relative ml-2 w-8 h-8 rounded-full bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
              >
                <ChevronLeft size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRightArrow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 z-10 flex items-center"
            >
              <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-white dark:from-surface-dark-secondary to-transparent pointer-events-none" />
              <button
                onClick={() => scroll("right")}
                className="relative mr-2 w-8 h-8 rounded-full bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
              >
                <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={scrollRef}
          className="flex gap-2 px-4 pb-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {stylists.map((stylist, i) => (
            <RecentCard
              key={stylist.id || i}
              stylist={stylist}
              index={i}
              onClick={() => {
                // 2. Navigate only if we have a valid ID
                if (!stylist.id) {
                  logger.warn("Stylist missing id", stylist);
                  return;
                }

                const path = stylist.isLive
                  ? `/app/${stylist.id}`
                  : `/app/stylist/${stylist.id}`;
                navigate(path);
              }}
            />
          ))}
          <div className="w-1 shrink-0" />
        </div>
      </div>
    </div>
  );
}
