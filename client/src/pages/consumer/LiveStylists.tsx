import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getStylists } from "../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { Eye, Radio, X } from "lucide-react";

function formatViewers(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function LiveStylists() {
  const navigate = useNavigate();
  const [liveStylists, setLiveStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveStylists = useCallback(() => {
    return getStylists({ isLive: true })
      .then(setLiveStylists)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLiveStylists().finally(() => setLoading(false));
  }, [fetchLiveStylists]);

  useEffect(() => {
    const interval = setInterval(fetchLiveStylists, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveStylists]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl skeleton-pulse mx-auto" />
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary skeleton-pulse rounded w-32 mx-auto h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark-tertiary">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio size={22} className="text-green-500 dark:text-green-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary dark:text-text-dark-primary">Live Now</h1>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                {liveStylists.length > 0
                  ? `${liveStylists.length} stylist${liveStylists.length > 1 ? 's' : ''} streaming live`
                  : "No one is live right now"}
              </p>
            </div>
          </div>
          <button onClick={() => navigate("/app/live")} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors">
            <X size={18} className="text-text-secondary dark:text-text-dark-secondary" />
          </button>
        </div>

        {liveStylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 bg-gray-50 dark:bg-surface-dark-tertiary">
              <Radio size={34} className="text-text-muted dark:text-text-dark-muted" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-text-primary dark:text-text-dark-primary">No live streams right now</h3>
            <p className="text-sm mb-6 text-text-secondary dark:text-text-dark-secondary">
              Stylists go live throughout the day — check back soon
            </p>
            <button
              onClick={() => navigate("/app")}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all bg-brand-500 text-white hover:bg-brand-600"
            >
              Browse Stylists
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {liveStylists.map((stylist, i) => (
                  <motion.div
                    key={stylist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer"
                    onClick={() => navigate(`/app/live/${stylist.id}`)}
                  >
                    <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #1a1a2e, #16213e)` }} />
                    {stylist.image && (
                      <img src={stylist.image} alt={stylist.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-green-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] text-white/80"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <Eye size={9} /> {formatViewers(stylist.viewerCount || Math.floor(Math.random() * 87 + 5))}
                      </span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-green-500 dark:ring-green-400 shrink-0">
                          {stylist.image ? (
                            <img src={stylist.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-white bg-green-500">
                              {getInitials(stylist.name)}
                            </div>
                          )}
                        </div>
                        <span className="text-white text-[10px] font-bold truncate">{stylist.name}</span>
                      </div>
                      {stylist.liveTitle && (
                        <p className="text-white/60 text-[9px] line-clamp-1 leading-tight">{stylist.liveTitle}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
