import { Mic, MicOff, Video, VideoOff, Circle, Square } from "lucide-react";

interface Props {
  isLive: boolean;
  loading: boolean;
  duration: number;
  onGoLive: () => void;
  onEndLive: () => void;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export function HostControls({ isLive, loading, duration, onGoLive, onEndLive, onToggleMic, onToggleVideo, isMuted, isVideoOff }: Props) {
  if (isLive) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-t border-white/10 dark:bg-white dark:text-text-primary">
        <div className="flex items-center gap-2">
          <button onClick={onToggleMic} className={`p-2 rounded-xl transition-all ${isMuted ? "bg-red-500/20 text-red-400" : "text-white/60 hover:bg-white/10"}`}>
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={onToggleVideo} className={`p-2 rounded-xl transition-all ${isVideoOff ? "bg-red-500/20 text-red-400" : "text-white/60 hover:bg-white/10"}`}>
            {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
        </div>
        <div className="flex items-center gap-2 text-white/50 text-xs font-mono">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span>{fmt(duration)}</span>
        </div>
        <button onClick={onEndLive} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95">
          <Square size={12} /> End
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={onToggleMic} className={`p-2.5 rounded-xl transition-all ${isMuted ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
      <button onClick={onToggleVideo} className={`p-2.5 rounded-xl transition-all ${isVideoOff ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
        {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
      </button>
      <div className="flex-1" />
      <button onClick={onGoLive} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40" style={{ background: "linear-gradient(135deg, #FE2C55, #ff6b8a)" }}>
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Circle size={12} fill="currentColor" />
        )}
        {loading ? "Starting..." : "Go Live"}
      </button>
    </div>
  );
}
