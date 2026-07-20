import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Eye, TrendingUp } from 'lucide-react';
import { getActiveLiveSessions, type LiveSession } from '../../api/live';
import LiveBadge from './LiveBadge';
import { motion } from 'framer-motion';
import { getSocketUrl } from '../../services/socket';
import { io } from 'socket.io-client';

export default function LiveNowRail() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSessions = async () => {
      try {
        const { sessions: data } = await getActiveLiveSessions();
        if (mounted) setSessions(data);
      } catch (e) {
        console.warn('Failed to fetch live sessions:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSessions();

    const socket = io(getSocketUrl('live') || undefined, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('live:session-started', () => {
      fetchSessions();
    });

    socket.on('live:session-ended', () => {
      fetchSessions();
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  if (loading || sessions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <h2 className="text-base font-bold text-text-primary tracking-tight">Live Now</h2>
          </div>
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
            {sessions.length}
          </span>
        </div>
        <span className="text-xs font-medium text-text-muted">
          Tap to watch
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-2 snap-x snap-mandatory">
        {sessions.map((session, i) => (
          <Link
            key={session._id}
            to={`/app/live/${session._id}`}
            className="shrink-0 w-[140px] snap-start group"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-gray-900 ring-2 ring-red-500/60 shadow-lg shadow-red-500/10 group-hover:shadow-red-500/25 group-hover:ring-red-500 transition-all duration-300"
            >
              {/* Thumbnail / Avatar */}
              {session.thumbnail || session.stylistId?.image ? (
                <img
                  src={session.thumbnail || session.stylistId?.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-4xl font-black text-white/20">
                    {session.stylistId?.name?.[0] || '?'}
                  </span>
                </div>
              )}

              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />

              {/* Top-left: Live badge */}
              <div className="absolute top-2 left-2 z-10">
                <LiveBadge size="sm" />
              </div>

              {/* Top-right: Viewer count pill */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10">
                <Eye size={10} className="text-white/80" />
                <span className="text-[10px] text-white font-semibold tabular-nums">
                  {session.viewerCount > 999
                    ? `${(session.viewerCount / 1000).toFixed(1)}k`
                    : session.viewerCount}
                </span>
              </div>

              {/* Center: Floating stylist avatar with ring */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-[2px] shadow-lg shadow-red-500/30">
                    <div className="w-full h-full rounded-full bg-gray-900 p-[1.5px]">
                      {session.stylistId?.image ? (
                        <img
                          src={session.stylistId.image}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {session.stylistId?.name?.[0] || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Pulsing glow ring */}
                  <span className="absolute inset-0 rounded-full animate-pulse ring-2 ring-red-500/40" />
                </div>
              </div>

              {/* Bottom: Info */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5 pt-10">
                <p className="text-[11px] font-bold text-white truncate leading-tight drop-shadow-md">
                  {session.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-400 to-pink-400 shrink-0" />
                  <p className="text-[10px] text-white/70 font-medium truncate">
                    {session.stylistId?.name}
                  </p>
                </div>
                {session.category && (
                  <div className="mt-1.5 inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-white/5">
                    <TrendingUp size={8} className="text-white/50" />
                    <span className="text-[8px] text-white/60 font-medium uppercase tracking-wider">
                      {session.category}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
