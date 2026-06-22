import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Eye, Clock, BadgeCheck } from "lucide-react";
import type { PastSession } from "../types/live.types";

interface Props {
  session: PastSession;
  onWatch: (session: PastSession) => void;
}

export function SessionReplayCard({ session, onWatch }: Props) {
  const navigate = useNavigate();
  const viewLabel =
    session.viewCount >= 1000
      ? `${(session.viewCount / 1000).toFixed(1)}k`
      : session.viewCount;

  const recordedDate = new Date(session.recordedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.button
      onClick={() => onWatch(session)}
      className="group relative w-full text-left bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
        {session.thumbnail && (
          <img
            src={session.thumbnail}
            alt={session.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={20} className="text-gray-900 ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-medium rounded">
          {Math.floor(session.durationMinutes / 60)}h{" "}
          {session.durationMinutes % 60}m
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/app/stylist/${session.host.id}`); }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[10px] font-semibold text-text-secondary dark:text-text-dark-primary shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            {session.host.name.charAt(0).toUpperCase()}
          </button>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">
              {session.title}
            </h4>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/app/stylist/${session.host.id}`); }}
              className="flex items-center gap-1 mt-0.5 cursor-pointer"
            >
              <span className="text-xs text-text-secondary dark:text-text-dark-muted truncate hover:underline">
                {session.host.name}
              </span>
              {session.host.isVerified && (
                <BadgeCheck size={12} className="text-blue-500 shrink-0" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted dark:text-text-dark-secondary">
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{viewLabel} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{recordedDate}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
