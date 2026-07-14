import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stylist } from "@/domain/stylist/stylist.types";

interface LiveStripProps {
  liveStylists: Stylist[];
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function LiveAvatar({ stylist, viewers, onClick }: { stylist: Stylist; viewers: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  const initials = stylist.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-1.5 min-w-[64px] sm:min-w-[72px] group focus:outline-none flex-shrink-0"
    >
      <div className="relative">
        <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-full p-[2px] sm:p-[3px] bg-gradient-to-tr from-red-500 via-orange-400 to-amber-400">
          <div className="w-full h-full rounded-full p-[1.5px] sm:p-[2px] bg-white">
            <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100">
              {stylist.image ? (
                <img
                  src={stylist.image}
                  alt={stylist.name}
                  className={`w-full h-full object-cover transition-all duration-300 ${hovered ? "scale-110" : "scale-100"}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <span className="text-xs sm:text-sm font-bold text-gray-400">{initials}</span>
                </div>
              )}
              <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-200 rounded-full ${hovered ? "opacity-100" : "opacity-0"}`}>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 flex items-center justify-center">
                  <Play size={10} className="text-gray-900 ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-red-500 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shadow-lg shadow-red-500/30">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            Live
          </div>
        </div>
      </div>
      <div className="text-center space-y-0.5 px-0.5 w-full">
        <p className="text-[11px] sm:text-xs font-semibold text-gray-900 truncate max-w-[60px] sm:max-w-[70px] group-hover:text-gray-700 transition-colors mx-auto">
          {stylist.name.split(" ")[0]}
        </p>
        <p className="flex items-center justify-center gap-0.5 text-[9px] sm:text-[10px] text-gray-400">
          <Eye size={8} className="sm:w-[9px] sm:h-[9px]" />
          {formatViewers(viewers)}
        </p>
      </div>
    </button>
  );
}

function EmptyLiveState() {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 min-w-[64px]">
          <div className="w-[56px] h-[56px] sm:w-[68px] sm:h-[68px] rounded-full bg-gray-100 animate-pulse" />
          <div className="w-10 sm:w-12 h-2 sm:h-2.5 rounded-full bg-gray-100 animate-pulse" />
        </div>
      ))}
      <div className="flex-1 min-w-0 pl-1 sm:pl-2">
        <p className="text-xs sm:text-sm font-medium text-gray-500">No one is live right now</p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">Stylists go live throughout the day — check back soon</p>
      </div>
    </div>
  );
}

export default function LiveStrip({ liveStylists }: LiveStripProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 4;
    setShowLeftArrow(el.scrollLeft > threshold);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - threshold);
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
  }, [liveStylists]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const handleSelect = (stylistId: string) => {
    navigate(`/app/live/${stylistId}`);
  };

  const isEmpty = liveStylists.length === 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 tracking-tight truncate">Live Now</h3>
          {!isEmpty && (
            <span className="text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-red-50 text-red-600 tabular-nums flex-shrink-0">
              {liveStylists.length}
            </span>
          )}
        </div>
        {!isEmpty && (
          <button
            onClick={() => navigate("/app/live")}
            className="text-[10px] sm:text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
          >
            <span className="hidden sm:inline">See all</span>
            <ChevronRight size={11} className="sm:w-3 sm:h-3" />
          </button>
        )}
      </div>

      {isEmpty ? (
        <EmptyLiveState />
      ) : (
        <div className="relative group/scroll">
          <AnimatePresence>
            {showLeftArrow && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 z-10 flex items-center"
              >
                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                <button
                  onClick={() => scroll("left")}
                  className="relative ml-0.5 sm:ml-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
                >
                  <ChevronLeft size={12} className="sm:w-[14px] sm:h-[14px]" />
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
                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                <button
                  onClick={() => scroll("right")}
                  className="relative mr-0.5 sm:mr-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-md transition-all opacity-0 group-hover/scroll:opacity-100"
                >
                  <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px]" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            ref={scrollRef}
            className="flex gap-2 sm:gap-3 overflow-x-auto px-3 sm:px-4 pb-3 sm:pb-4 pt-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {liveStylists.map((stylist, i) => (
              <motion.div
                key={stylist.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <LiveAvatar
                  stylist={stylist}
                  viewers={stylist.viewerCount || 0}
                  onClick={() => handleSelect(stylist.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
