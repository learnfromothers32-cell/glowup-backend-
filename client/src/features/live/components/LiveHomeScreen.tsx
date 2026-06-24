import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Radio } from "lucide-react";
import { useLiveStore } from "../store/liveStore";
import { useLiveSessions, useTrendingSessions } from "../hooks/useLiveSessions";
import type { LiveSession } from "../types/live.types";

export function LiveHomeScreen() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { liveSessions, recommendedSessions } = useLiveStore();

  useLiveSessions();
  useTrendingSessions();

  const allSessions = [...liveSessions, ...recommendedSessions];

  useEffect(() => {
    setCurrentIndex(0);
  }, [liveSessions.length, recommendedSessions.length]);

  const handleJoin = (session: LiveSession) => navigate(`/app/live/${session.hostId}`);

  const currentSession = allSessions.length > 0 ? allSessions[currentIndex] : null;

  if (currentSession) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div
          className="flex-1 relative flex items-center justify-center overflow-hidden"
          onClick={() => handleJoin(currentSession)}
        >
          <div className="w-full h-full relative cursor-pointer bg-neutral-950">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center ring-2 ring-white/20">
                <span className="text-4xl font-bold text-white">
                  {currentSession.host.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base">{currentSession.host.name}</p>
                <p className="text-white/50 text-xs mt-1 capitalize">{currentSession.category}</p>
              </div>
              <p className="text-white/40 text-sm">Tap to watch</p>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute top-0 left-0 right-0 z-10 px-4" style={{ paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm text-[10px] font-bold text-white">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white">
                    <Users size={12} /> {currentSession.viewerCount >= 1000 ? `${(currentSession.viewerCount / 1000).toFixed(1)}k` : currentSession.viewerCount}
                  </span>
                </div>
                <span className="text-xs text-white/40 font-mono">{currentIndex + 1}/{allSessions.length}</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 p-4" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
              <h3 className="text-white text-sm font-medium mb-4 line-clamp-2">{currentSession.title}</h3>

              <div className="flex items-center gap-3">
                {currentIndex > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => i - 1); }}
                    className="flex-1 py-3 rounded-xl text-xs font-bold transition-all bg-white/10 text-white active:bg-white/20"
                  >
                    ← Prev
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleJoin(currentSession); }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-red-500/20"
                >
                  Watch Live
                </button>
                {currentIndex < allSessions.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => i + 1); }}
                    className="flex-1 py-3 rounded-xl text-xs font-bold transition-all bg-white/10 text-white active:bg-white/20"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5">
        <Radio size={28} className="text-white/20" />
      </div>
      <div className="text-center">
        <p className="text-white text-lg font-bold mb-1">No live sessions right now</p>
        <p className="text-white/40 text-sm">Check back soon for new streams</p>
      </div>
      <button
        onClick={() => navigate("/app")}
        className="px-6 py-2.5 rounded-full text-sm font-bold bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
      >
        Go Home
      </button>
    </div>
  );
}
