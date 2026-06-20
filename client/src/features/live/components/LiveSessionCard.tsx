import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Play, BadgeCheck } from "lucide-react";
import type { LiveSession } from "../types/live.types";

interface Props {
  session: LiveSession;
  onJoin: (session: LiveSession) => void;
}

export function LiveSessionCard({ session, onJoin }: Props) {
  const navigate = useNavigate();
  const viewerLabel =
    session.viewerCount >= 1000
      ? `${(session.viewerCount / 1000).toFixed(1)}k`
      : session.viewerCount;

  return (
    <motion.button
      onClick={() => onJoin(session)}
      className="group relative w-full text-left bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative aspect-[9/16] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
        {session.thumbnail && (
          <img
            src={session.thumbnail}
            alt={session.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-[11px] font-semibold rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/60 text-white text-[11px] font-medium rounded-full backdrop-blur-sm">
            <Users size={12} />
            {viewerLabel}
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={20} className="text-gray-900 ml-0.5" />
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3 text-left">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              {session.host.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-bold truncate">{session.host.name}</span>
                {session.host.isVerified && <BadgeCheck size={11} className="text-blue-400 shrink-0" />}
              </div>
              <span className="text-white/50 text-[9px] capitalize block truncate">{session.category}</span>
            </div>
          </div>
          <p className="text-white/70 text-[11px] line-clamp-1 leading-tight">{session.title}</p>
        </div>
      </div>
    </motion.button>
  );
}
