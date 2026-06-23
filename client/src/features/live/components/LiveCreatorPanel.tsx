import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users, Heart, Gift, Mic, MicOff, Camera, CameraOff, SwitchCamera, LogOut } from "lucide-react";

interface Props {
  isLive: boolean;
  viewerCount: number;
  totalLikes: number;
  totalGifts: number;
  totalCoins: number;
  chatMessages: any[];
  onSendChat: (msg: string) => void;
  onGoLive: (title: string) => void;
  onEndLive: () => void;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onToggleBeauty: () => void;
  onShare: () => void;
  onInviteGuest: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  duration: number;
  stream?: MediaStream | null;
  streamTitle: string;
  streamDescription: string;
  streamCategory: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  loading: boolean;
  cameraDenied: boolean;
  onRetryCamera: () => void;
  goLiveError?: string;
}

const CATEGORIES = [
  "Hairstyling", "Makeup", "Skincare", "Nail Art",
  "Braids & Weaves", "Barbering", "Waxing & Threading", "Beauty Tips"
];

export default function LiveCreatorPanel(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (videoRef.current && props.stream) {
      videoRef.current.srcObject = props.stream;
    }
  }, [props.stream, props.isLive]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [props.chatMessages]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    props.onSendChat(chatInput.trim());
    setChatInput("");
  };

  const visibleMessages = props.chatMessages.slice(-6);
  const canGoLive = props.streamTitle.trim().length > 0 && !props.loading && !props.cameraDenied;
  const goLiveDisabledReason = !props.streamTitle.trim() ? "Add a stream title" :
    props.cameraDenied ? "Camera access required" : null;

  if (!props.isLive) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col overflow-hidden">
        {/* Full-screen camera preview */}
        <div className="flex-1 relative min-h-0">
          {props.stream ? (
            <>
              <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-text-secondary dark:text-text-dark-secondary">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-2xl">📷</div>
              <span className="text-sm">Camera preview</span>
              {props.cameraDenied && (
                <button
                  onClick={props.onRetryCamera}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs text-text-muted dark:text-text-dark-muted transition-colors"
                >
                  Grant access
                </button>
              )}
            </div>
          )}

          {/* Overlay header */}
          <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4">
            <h2 className="text-lg font-bold text-white drop-shadow-lg">Go Live</h2>
            <p className="text-xs text-white/50 mt-0.5 drop-shadow">Broadcast to your audience</p>
          </div>
        </div>

        {/* Bottom sheet - setup form */}
        <div className="shrink-0 bg-surface-dark-secondary backdrop-blur-xl border-t border-gray-700/40 px-4 py-4 pb-6 space-y-3">
          <input
            value={props.streamTitle}
            onChange={e => props.onTitleChange(e.target.value)}
            placeholder="Stream title *"
            className="w-full px-3.5 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-text-muted outline-none focus:ring-1 focus:ring-brand-500/40 transition-all"
          />
          <textarea
            value={props.streamDescription}
            onChange={e => props.onDescriptionChange(e.target.value)}
            placeholder="Description (optional)"
            rows={1}
            className="w-full px-3.5 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-text-muted outline-none focus:ring-1 focus:ring-brand-500/40 resize-none transition-all"
          />
          <select
            value={props.streamCategory}
            onChange={e => props.onCategoryChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white/5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-brand-500/40 appearance-none cursor-pointer transition-all"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c.toLowerCase().replace(/\s+/g, "-")} className="bg-neutral-900">{c}</option>
            ))}
          </select>

          <button
            onClick={() => props.onGoLive(props.streamTitle.trim())}
            disabled={!canGoLive}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed bg-brand-500 hover:bg-brand-600"
          >
            {props.loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting...
              </span>
            ) : "Go Live"}
          </button>
          {goLiveDisabledReason && (
            <p className="text-[11px] text-red-400/70 text-center">{goLiveDisabledReason}</p>
          )}
          {props.goLiveError && (
            <p className="text-[11px] text-red-400/80 text-center">{props.goLiveError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      {/* Video area */}
      <div className="flex-1 relative min-h-0 bg-black">
        {props.stream ? (
          <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">No camera feed</div>
        )}

        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Top overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 sm:px-4 pt-2 sm:pt-3 pb-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-red-500 shadow-lg shadow-red-500/20">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-bold text-white tracking-wider uppercase">Live</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <Users size={10} className="sm:size-[12px] text-white" />
              <span className="text-[10px] sm:text-xs text-white font-medium">{props.viewerCount}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
              <span className="text-[11px] text-white/60 font-mono">
                {String(Math.floor(props.duration / 60)).padStart(2, "0")}:{String(props.duration % 60).padStart(2, "0")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <Heart size={10} className="sm:size-[12px] text-red-400" />
              <span className="text-[10px] sm:text-xs text-white font-medium">{props.totalLikes}</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <Gift size={10} className="sm:size-[12px] text-pink-400" />
              <span className="text-[10px] sm:text-xs text-white font-medium">{props.totalGifts}</span>
            </div>
          </div>
        </div>

        <div className="absolute top-9 sm:top-11 left-2 sm:left-4">
          <p className="text-white/40 text-[10px] sm:text-xs truncate max-w-[120px] sm:max-w-[200px]">{props.streamTitle}</p>
        </div>

        {/* Floating comments */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-3 right-16 sm:right-20 overflow-hidden pointer-events-none">
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg: any) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="mb-1 sm:mb-1.5"
              >
                <div className="inline-flex items-start gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-md" style={{ background: "rgba(0,0,0,0.6)", maxWidth: "90%" }}>
                  <span className="shrink-0 font-bold text-[10px] sm:text-[11px] leading-5" style={{ color: msg.userRole === "stylist" ? "#FE2C55" : "#94a3b8" }}>
                    {msg.userName}
                  </span>
                  <span className="text-white text-[12px] sm:text-[13px] leading-5 break-words min-w-0 drop-shadow-md">
                    {msg.message}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 bg-surface-dark-secondary border-t border-gray-700/40">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={props.onToggleMic}
            className={`p-1.5 sm:p-2 rounded-xl transition-all ${props.isMuted ? "bg-red-500/20 text-red-400" : "bg-white/5 text-text-muted dark:text-text-dark-muted hover:bg-white/10 hover:text-white"}`}
            title={props.isMuted ? "Unmute" : "Mute"}
          >
            {props.isMuted ? <MicOff size={14} className="sm:size-[16px]" /> : <Mic size={14} className="sm:size-[16px]" />}
          </button>
          <button
            onClick={props.onToggleVideo}
            className={`p-1.5 sm:p-2 rounded-xl transition-all ${props.isVideoOff ? "bg-red-500/20 text-red-400" : "bg-white/5 text-text-muted dark:text-text-dark-muted hover:bg-white/10 hover:text-white"}`}
            title={props.isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {props.isVideoOff ? <CameraOff size={14} className="sm:size-[16px]" /> : <Camera size={14} className="sm:size-[16px]" />}
          </button>
          <button
            onClick={props.onSwitchCamera}
            className="hidden sm:inline-flex p-2 rounded-xl bg-white/5 text-text-muted dark:text-text-dark-muted hover:bg-white/10 hover:text-white transition-all"
            title="Switch camera"
          >
            <SwitchCamera size={16} />
          </button>
        </div>

        <div className="flex-1 flex items-center bg-white/5 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 ring-1 ring-white/5 focus-within:ring-brand-500/30 transition-all">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder="Message..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-text-muted outline-none"
          />
          <button onClick={handleSend} disabled={!chatInput.trim()} className="p-1 disabled:opacity-30 transition-opacity">
            <Send size={12} className="sm:size-[14px]" style={{ color: "#FE2C55" }} />
          </button>
        </div>

        <button
          onClick={props.onEndLive}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97] bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
        >
          <LogOut size={12} className="sm:size-[14px]" />
          <span className="hidden sm:inline">End</span>
        </button>
      </div>
    </div>
  );
}
