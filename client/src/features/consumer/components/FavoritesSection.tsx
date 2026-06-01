import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  ChevronRight,
  ChevronLeft,
  Star,
  MapPin,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FavoritesSectionProps {
  favorites: Stylist[];
  onSelect: (stylist: Stylist) => void;
}

// ─── Favorite Card ─────────────────────────────────────────────────────────────
function FavoriteCard({
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

  // Safe initials
  const initials = stylist.name
    ? stylist.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?"
    : "?";

  const displayName = stylist.name?.trim() || "Stylist";

  const showImage = stylist.image && !imageError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="flex-shrink-0 w-[152px] cursor-pointer group"
    >
      {/* Card body */}
      <div className="relative rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden group-hover:border-gray-200 group-hover:shadow-sm transition-all duration-200">
        {/* Image area */}
        <div className="relative h-[140px] bg-gray-100">
          {/* Fallback */}
          {(!imageLoaded || !showImage) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-xl font-bold text-gray-400">
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
                setImageLoaded(false);
              }}
              className={`
                w-full h-full object-cover transition-all duration-300
                ${imageLoaded ? "opacity-100" : "opacity-0"}
                group-hover:scale-105
              `}
            />
          )}

          {/* Top gradient for badges */}
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/20 to-transparent" />

          {/* Favorite heart (always visible) */}
          <div className="absolute top-2 left-2">
            <div className="w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Heart size={11} fill="#ef4444" className="text-red-500" />
            </div>
          </div>

          {/* Availability indicator */}
          {stylist.isLive && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold shadow-md">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                Available
              </div>
            </div>
          )}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Bottom overlay info */}
          <div className="absolute bottom-2 inset-x-2 flex items-end justify-between">
            <div className="min-w-0">
              {stylist.rating && (
                <div className="flex items-center gap-1">
                  <Star size={10} fill="#fbbf24" stroke="#fbbf24" />
                  <span className="text-[11px] font-bold text-white tabular-nums">
                    {stylist.rating}
                  </span>
                  {stylist.reviewCount && (
                    <span className="text-[10px] text-white/70">
                      ({stylist.reviewCount})
                    </span>
                  )}
                </div>
              )}
            </div>
            {stylist.priceRange && (
              <span className="text-[10px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded">
                {stylist.priceRange}
              </span>
            )}
          </div>
        </div>

        {/* Info area */}
        <div className="p-2.5">
          <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
            {displayName}
          </p>

          {/* Category + location row */}
          <div className="flex items-center gap-1.5 mt-1">
            {stylist.category && (
              <span className="text-[10px] font-medium text-gray-500 truncate">
                {stylist.category}
              </span>
            )}
            {stylist.category && stylist.location && (
              <span className="text-gray-300">·</span>
            )}
            {stylist.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-400 truncate">
                <MapPin size={8} />
                <span className="truncate max-w-[60px]">
                  {getLocationString(stylist.location)}
                </span>
              </span>
            )}
          </div>

          {/* Quick action buttons on hover */}
          <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick(); // this will now navigate to detail page
              }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-900 text-white text-[10px] font-semibold hover:bg-gray-800 transition-colors"
            >
              Book
              <ArrowRight size={9} />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              title="Message"
            >
              <MessageCircle size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FavoritesSection({
  favorites,
  onSelect,
}: FavoritesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const navigate = useNavigate();

  // ── Scroll arrow visibility ──
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
  }, [favorites]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (favorites.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Heart size={15} fill="#ef4444" className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
              Your Favorites
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Stylists you've saved
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500 tabular-nums">
            {favorites.length}
          </span>
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────── */}
      <div className="relative group/scroll">
        {/* Left fade + arrow */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 z-10 flex items-center"
            >
              <div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <button
                onClick={() => scroll("left")}
                className="relative ml-2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
              >
                <ChevronLeft size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right fade + arrow */}
        <AnimatePresence>
          {showRightArrow && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 z-10 flex items-center"
            >
              <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              <button
                onClick={() => scroll("right")}
                className="relative mr-2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
              >
                <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards row */}
        <div
          ref={scrollRef}
          className="flex gap-3 px-4 pb-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {favorites.map((stylist, i) => (
            <FavoriteCard
              key={stylist.id || i}
              stylist={stylist}
              index={i}
              onClick={() => {
                // 2. Navigate to the detail page (always use /app/stylist/:id)
                if (stylist.id) {
                  navigate(`/app/stylist/${stylist.id}`);
                } else {
                  console.warn("Stylist missing id", stylist);
                }
              }}
            />
          ))}

          {/* End spacer */}
          <div className="w-1 shrink-0" />
        </div>
      </div>
    </div>
  );
}
