import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, Clock, Star, BadgeCheck, Zap } from "lucide-react";
import { LiveBadge, ViewerCount } from "./LiveBadge";
import { cn } from "@/utils/cn";
import type { LiveSession } from "@/domain/live/live.types";

interface DiscoverCardProps {
  session: LiveSession;
  variant?: "featured" | "grid" | "compact";
  className?: string;
}

function formatViewerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(startedAt?: string): string {
  if (!startedAt) return "";
  const ms = Date.now() - new Date(startedAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function DiscoverCard({ session, variant = "grid", className }: DiscoverCardProps) {
  const stylist = typeof session.stylistId === "object" ? session.stylistId : null;
  const isLive = session.status === "live";
  const isScheduled = session.status === "scheduled";
  const hasServices = session.bookingCount > 0;

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative group rounded-2xl overflow-hidden cursor-pointer",
          "bg-gray-900 border border-white/10",
          "shadow-2xl hover:shadow-brand-500/20 transition-all duration-300",
          className,
        )}
      >
        <Link to={`/app/live/${session._id}`} className="block">
          <div className="relative aspect-[9/16] sm:aspect-[3/4]">
            {session.thumbnailUrl ? (
              <img
                src={session.thumbnailUrl}
                alt={session.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900 via-gray-900 to-pink-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              {isLive && <LiveBadge />}
              {isScheduled && session.scheduledAt && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm">
                  <Clock size={10} />
                  Starts {new Date(session.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              )}
              {isLive && <ViewerCount count={session.viewerCount} />}
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end gap-3">
                {/* Stylist avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                  {stylist?.image ? (
                    <img src={stylist.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
                      {stylist?.name?.[0] || "?"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">{session.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/70 truncate">{stylist?.name || "Stylist"}</span>
                    {stylist?.isVerified && <BadgeCheck size={12} className="text-brand-400 shrink-0" />}
                  </div>
                </div>
              </div>

              {/* Business indicators */}
              <div className="flex items-center gap-2 mt-2">
                {hasServices && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-semibold">
                    <Zap size={8} /> Services Available
                  </span>
                )}
                {session.category && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-medium">
                    {session.category}
                  </span>
                )}
                {isLive && (
                  <span className="ml-auto text-[10px] text-white/50">
                    {formatDuration(session.startedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid / compact variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative group rounded-2xl overflow-hidden bg-white dark:bg-surface-dark-secondary",
        "border border-gray-100 dark:border-gray-700/40",
        "shadow-soft hover:shadow-xl transition-all duration-300",
        className,
      )}
    >
      <Link to={`/app/live/${session._id}`} className="block">
        <div className="relative aspect-[9/16] sm:aspect-video bg-gray-900">
          {session.thumbnailUrl ? (
            <img
              src={session.thumbnailUrl}
              alt={session.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {isLive && (
            <>
              <div className="absolute top-2.5 left-2.5">
                <LiveBadge size="sm" />
              </div>
              <div className="absolute top-2.5 right-2.5">
                <ViewerCount count={session.viewerCount} />
              </div>
            </>
          )}

          {isScheduled && session.scheduledAt && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-semibold backdrop-blur-sm">
                <Clock size={8} />
                {new Date(session.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          )}

          {/* Duration for live */}
          {isLive && (
            <div className="absolute bottom-2.5 right-2.5">
              <span className="px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px] font-medium backdrop-blur-sm">
                {formatDuration(session.startedAt)}
              </span>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {session.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
              {stylist?.image ? (
                <img src={stylist.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">
                  {stylist?.name?.[0] || "?"}
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {stylist?.name || "Stylist"}
            </span>
            {stylist?.isVerified && <BadgeCheck size={10} className="text-brand-500 shrink-0" />}
            {isLive && (
              <span className="ml-auto flex items-center gap-0.5 text-[10px] text-red-500 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {session.category && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {session.category}
              </span>
            )}
            {hasServices && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                Services
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
