import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, ChevronRight, ChevronLeft, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveSessions } from "../../../domain/live/live.hooks";
import type { LiveSession } from "../../../domain/live/live.types";

function LiveSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 animate-pulse" />
            <div className="w-28 h-4 rounded-full bg-gray-100 animate-pulse" />
          </div>
          <div className="w-16 h-4 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-48">
            <div className="aspect-[9/16] rounded-xl bg-gray-100 animate-pulse" />
            <div className="mt-2 w-28 h-3 rounded-full bg-gray-100 animate-pulse" />
            <div className="mt-1.5 w-20 h-2.5 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveCard({ session, onClick }: { session: LiveSession; onClick: () => void }) {
  const stylist = typeof session.stylistId === "object" ? session.stylistId : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="flex-shrink-0 w-[160px] cursor-pointer group"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[9/16] bg-gray-900">
        {session.thumbnailUrl ? (
          <img
            src={session.thumbnailUrl}
            alt={session.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <Radio size={20} className="text-white/40" />
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {session.status === "live" && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            LIVE
          </div>
        )}

        {session.viewerCount > 0 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
            <Eye size={10} />
            {session.viewerCount}
          </div>
        )}

        <div className="absolute bottom-2.5 inset-x-2.5">
          <p className="text-[11px] font-semibold text-white truncate drop-shadow">
            {session.title}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {stylist?.image ? (
          <img
            src={stylist.image}
            alt={stylist.name}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-[8px] font-bold text-gray-500">
              {stylist?.name?.[0] || "?"}
            </span>
          </div>
        )}
        <span className="text-xs text-gray-500 truncate">
          {stylist?.name || "Stylist"}
        </span>
      </div>
    </motion.div>
  );
}

export default function LiveNowPreview() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const { data, isLoading } = useLiveSessions({ sort: "newest", limit: 10 });
  const sessions = data?.sessions?.filter((s) => s.status === "live" || s.status === "scheduled") ?? [];

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 8;
    setShowLeftArrow(el.scrollLeft > threshold);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - threshold);
  };

  useEffect(() => {
    if (isLoading || sessions.length === 0) return;
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
  }, [isLoading, sessions]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  if (isLoading) return <LiveSkeleton />;
  if (sessions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Radio size={16} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
              Live Now
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Watch sessions from your favorite stylists
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/app/live")}
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
        >
          See all
          <ChevronRight size={12} />
        </button>
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

        <div
          ref={scrollRef}
          className="flex gap-3 px-4 pb-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sessions.map((session) => (
            <LiveCard
              key={session._id}
              session={session}
              onClick={() => navigate(`/app/live/${session._id}`)}
            />
          ))}
          <div className="w-1 shrink-0" />
        </div>
      </div>
    </div>
  );
}
