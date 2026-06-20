import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getStylists } from "../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { Eye, Radio, X } from "lucide-react";

const ROSE = "#FE2C55";

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

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchLiveStylists, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveStylists]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[#FE2C55] animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: "#8E9FB2" }}>Loading live stylists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F4F7FC" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio size={22} style={{ color: ROSE }} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#0A1424" }}>Live Now</h1>
              <p className="text-xs" style={{ color: "#8E9FB2" }}>
                {liveStylists.length > 0
                  ? `${liveStylists.length} stylist${liveStylists.length > 1 ? 's' : ''} streaming live`
                  : "No one is live right now"}
              </p>
            </div>
          </div>
          <button onClick={() => navigate("/app/live")} className="p-2 rounded-full hover:bg-white/50 transition-colors">
            <X size={18} style={{ color: "#5A6E8A" }} />
          </button>
        </div>

        {liveStylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF2F8" }}>
              <Radio size={34} style={{ color: "#8E9FB2" }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: "#0A1424" }}>No live streams right now</h3>
            <p className="text-sm mb-6" style={{ color: "#8E9FB2" }}>
              Stylists go live throughout the day — check back soon
            </p>
            <button
              onClick={() => navigate("/app")}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all"
              style={{ background: ROSE, color: "white" }}
            >
              Browse Stylists
            </button>
          </div>
        ) : (
          <>
            {/* Featured - vertical TikTok cards */}
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
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                        style={{ background: ROSE }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] text-white/80"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <Eye size={9} /> {formatViewers(stylist.viewerCount || Math.floor(Math.random() * 87 + 5))}
                      </span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-6 h-6 rounded-full overflow-hidden ring-1 shrink-0" style={{ ringColor: ROSE }}>
                          {stylist.image ? (
                            <img src={stylist.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: ROSE }}>
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
