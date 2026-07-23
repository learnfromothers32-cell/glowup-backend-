import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Radio,
  Loader2, X, Eye, Clock, Heart, MessageCircle,
  AlertTriangle, CheckCircle2, Users, RefreshCw,
  Sparkles, Package, WifiOff,
} from 'lucide-react';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useToast } from '../../components/ui/Toast';
import * as liveApi from '../../api/live';
import { Track, RoomEvent } from 'livekit-client';
import FloatingHeart from '../../components/live/FloatingHeart';
import FloatingComments from '../../components/live/FloatingComments';
import LiveCommentInput from '../../components/live/LiveCommentInput';
import GiftAnimation, { useGiftQueue } from '../../components/live/GiftAnimation';
import { GIFT_OPTIONS } from '../../components/live/GiftPickerModal';
import LiveBadge from '../../components/live/LiveBadge';
import { useAuth } from '../../context/authUtils';
import { getMyStylistProfile } from '../../api/stylists';

const CATEGORIES = [
  'Braids', 'Nails', 'Barber', 'Colorist', 'Stylist',
  'Makeup', 'Locs', 'Twists', 'Natural Hair', 'Extensions',
];

const GIFT_VALUES: Record<string, number> = {};
GIFT_OPTIONS.forEach((g) => { GIFT_VALUES[g.type] = g.coins; });

interface StreamSummary {
  duration: number;
  peakViewers: number;
  totalHearts: number;
  totalComments: number;
}

export default function LiveStudio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'setup' | 'preview' | 'live' | 'summary'>('setup');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<string | null>(null);
  const [noCamera, setNoCamera] = useState(false);
  const [streamSummary, setStreamSummary] = useState<StreamSummary | null>(null);
  const [peakViewerCount, setPeakViewerCount] = useState(0);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [showcaseToast, setShowcaseToast] = useState<string | null>(null);
  const [stylistServices, setStylistServices] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [disconnectedOverlay, setDisconnectedOverlay] = useState(false);
  const [micPermDenied, setMicPermDenied] = useState(false);
  const [stylistInputFocused, setStylistInputFocused] = useState(false);

  const {
    room,
    viewerCount,
    setViewerCount,
    hearts,
    comments,
    likeCount,
    totalCommentCount,
    connect,
    disconnect,
    toggleCamera,
    toggleMicrophone,
    getCooldownRemaining,
    sendComment,
    MAX_COMMENT_LENGTH,
  } = useLiveSession({ sessionId: sessionId || '', isBroadcaster: true });

  const { gifts, addGift } = useGiftQueue();

  useEffect(() => {
    if (viewerCount > peakViewerCount) {
      setPeakViewerCount(viewerCount);
    }
  }, [viewerCount, peakViewerCount]);

  const checkCameraPermissions = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices();
      const videoDevices = devices?.filter((d) => d.kind === 'videoinput') || [];
      if (videoDevices.length === 0) {
        setNoCamera(true);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissionDenied(null);
      setMicPermDenied(false);
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
          camStream.getTracks().forEach((t) => t.stop());
          setPermissionDenied(null);
          setMicPermDenied(true);
          return true;
        } catch {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStream.getTracks().forEach((t) => t.stop());
            setMicPermDenied(false);
            setPermissionDenied('Camera access denied. Please allow camera access in your browser settings to go live.');
            setNoCamera(true);
            return false;
          } catch {
            setPermissionDenied('Camera and microphone access denied. Please enable permissions in your browser settings.');
            setNoCamera(true);
            return false;
          }
        }
      } else if (err.name === 'NotFoundError') {
        setNoCamera(true);
      } else {
        setPermissionDenied('Could not access camera or microphone.');
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (step === 'setup') {
      checkCameraPermissions();
    }
  }, [step, checkCameraPermissions]);

  useEffect(() => {
    if (!room || !videoContainerRef.current) return;

    const attachTrack = () => {
      const container = videoContainerRef.current;
      if (!container) return;
      container.innerHTML = '';

      const publication = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (publication?.track) {
        const el = publication.track.attach();
        el.className = 'w-full h-full object-cover';
        container.appendChild(el);
      }
    };

    room.on(RoomEvent.TrackSubscribed, attachTrack);
    room.on(RoomEvent.LocalTrackPublished, attachTrack);
    attachTrack();

    return () => {
      room.off(RoomEvent.TrackSubscribed, attachTrack);
      room.off(RoomEvent.LocalTrackPublished, attachTrack);
    };
  }, [room]);

  useEffect(() => {
    if (!room) return;

    const handleParticipant = () => {
      setViewerCount(room.remoteParticipants.size);
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipant);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipant);
    setViewerCount(room.remoteParticipants.size);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipant);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipant);
    };
  }, [room]);

  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'gift') {
          const coinValue = GIFT_VALUES[data.giftType] || 0;
          setEarnings((prev) => prev + coinValue);
          addGift(data.emoji || '🎁', data.giftLabel || 'Gift', data.senderName || 'Viewer');
        }
      } catch {
        // ignore
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, addGift]);

  useEffect(() => {
    if (!room) return;
    const handleReconnecting = () => { setReconnecting(true); };
    const handleReconnected = () => { setReconnecting(false); setDisconnectedOverlay(false); };
    const handleDisconnected = () => {
      if (step === 'live') setDisconnectedOverlay(true);
    };
    room.on('reconnecting', handleReconnecting);
    room.on('connected', handleReconnected);
    room.on('disconnected', handleDisconnected);
    return () => {
      room.off('reconnecting', handleReconnecting);
      room.off('connected', handleReconnected);
      room.off('disconnected', handleDisconnected);
    };
  }, [room, step]);

  useEffect(() => {
    if (step !== 'live') return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === 'live' && user?.id) {
      getMyStylistProfile()
        .then((p: any) => setStylistServices(p.services || []))
        .catch(() => {});
    }
  }, [step, user?.id]);

  useEffect(() => {
    if (!showcaseToast) return;
    const t = setTimeout(() => setShowcaseToast(null), 2500);
    return () => clearTimeout(t);
  }, [showcaseToast]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatEarnings = (val: number) => {
    return `$${(val * 0.05).toFixed(2)}`;
  };

  const handleGoLive = async () => {
    if (!title.trim() || !category) {
      toast('error', 'Please fill in title and category');
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setIsStarting(true);
    try {
      const { session, token, wsUrl } = await liveApi.createLiveSession({
        title: title.trim(),
        category,
      });
      setSessionId(session._id);
      await connect(wsUrl, token);
      await liveApi.startLiveSession(session._id);
      setStep('live');
      toast('success', 'You are now live!');
    } catch (err: any) {
      console.error('Failed to go live:', err);
      toast('error', err?.response?.data?.message || 'Failed to go live');
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndStream = async () => {
    if (!sessionId) return;
    setIsEnding(true);
    try {
      await liveApi.endLiveSession(sessionId);
      disconnect();
      setStreamSummary({
        duration: elapsed,
        peakViewers: peakViewerCount,
        totalHearts: likeCount,
        totalComments: totalCommentCount,
      });
      setStep('summary');
    } catch {
      toast('error', 'Failed to end stream');
    } finally {
      setIsEnding(false);
      setShowEndConfirm(false);
    }
  };

  const handleToggleMic = async () => {
    try {
      await toggleMicrophone();
      setMicEnabled((prev) => !prev);
    } catch {
      toast('error', 'Failed to toggle microphone');
    }
  };

  const handleToggleCam = async () => {
    try {
      await toggleCamera();
      setCamEnabled((prev) => !prev);
    } catch {
      toast('error', 'Failed to toggle camera');
    }
  };

  const handleSendComment = useCallback(
    (text: string): boolean => {
      if (!sessionId) return false;
      const userId = user?.id || 'stylist';
      const userName = user?.name || 'Stylist';
      return sendComment(text, userId, userName);
    },
    [sessionId, user, sendComment]
  );

  const handleShowcaseFeature = (svc: any) => {
    if (!room) return;
    try {
      const data = new TextEncoder().encode(
        JSON.stringify({
          type: 'showcase',
          serviceName: svc.name,
          servicePrice: svc.price,
        })
      );
      room.localParticipant.publishData(data, { reliable: true });
    } catch {
      // ignore
    }
    setShowcaseOpen(false);
    setShowcaseToast(`Now showcasing ${svc.name}`);
  };

  const stylistDisplayName = user?.name || 'Stylist';

  return (
    <div className="h-dvh w-full bg-black relative overflow-hidden select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div
        ref={videoContainerRef}
        className="absolute inset-0 mx-auto bg-gray-900 overflow-hidden"
        style={{ aspectRatio: '9 / 16', maxHeight: '100%', top: 0, bottom: 0 }}
      />

      <AnimatePresence>
        {hearts.map((h) => (
          <FloatingHeart key={h.id} id={h.id} x={h.x} />
        ))}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── SETUP SCREEN ── */}
      {/* ═══════════════════════════════════════════════════ */}
      {step === 'setup' && (
        <div className="absolute inset-0 z-30 flex flex-col">
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          <div className="relative flex items-center justify-between px-4 pt-4 sm:pt-5 z-10">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 transition-all active:scale-90"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5">
              <Video size={14} className="text-white/70" />
              <span className="text-xs font-medium text-white/80">Camera Preview</span>
            </div>
            <div className="w-11" />
          </div>

          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-sm bg-black/50 backdrop-blur-xl rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <Radio size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Go Live</h2>
                  <p className="text-xs text-white/50">Set up your stream</p>
                </div>
              </div>

              {permissionDenied && (
                <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-red-300 font-medium">{permissionDenied}</p>
                    <button
                      onClick={requestPermissions}
                      className="text-[11px] text-red-400 underline mt-1 hover:text-red-300"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {noCamera && (
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300 font-medium">
                    No camera detected. Please connect a camera to go live.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block uppercase tracking-wider">Stream Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are you streaming today?"
                  maxLength={100}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/60 focus:bg-white/15 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/60 mb-2 block uppercase tracking-wider">Category</label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`text-[10px] sm:text-[11px] py-2 px-2 rounded-xl font-semibold transition-all active:scale-95 ${
                        category === c
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/20'
                          : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGoLive}
                disabled={isStarting || !title.trim() || !category || !!noCamera}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all active:scale-[0.98]"
                aria-label={isStarting ? 'Starting stream...' : 'Go live'}
              >
                {isStarting ? (
                  <><Loader2 size={16} className="animate-spin" /> Starting...</>
                ) : (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                    Go Live
                  </>
                )}
              </button>
            </motion.div>
          </div>

          <div className="relative px-4 pb-4 sm:pb-6 z-10">
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={handleToggleCam}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${camEnabled ? 'bg-white/15 backdrop-blur-md text-white' : 'bg-red-500/80 text-white'}`}
                aria-label={camEnabled ? 'Turn camera off' : 'Turn camera on'}
              >
                {camEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button
                onClick={handleToggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${micEnabled ? 'bg-white/15 backdrop-blur-md text-white' : 'bg-red-500/80 text-white'}`}
                aria-label={micEnabled ? 'Turn microphone off' : 'Turn microphone on'}
              >
                {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── LIVE SCREEN ── */}
      {/* ═══════════════════════════════════════════════════ */}
      {step === 'live' && (
        <>
          {/* Layer 2: Dark gradient overlay — bottom 40% */}
          <div className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />

          {/* Layer 3: All UI controls */}

          {/* ── TOP BAR ── */}
          <div className="absolute top-0 inset-x-0 z-20 pointer-events-none" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <div className="absolute inset-x-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />

            <div className="relative flex items-start justify-between px-3 pt-4 sm:px-4 sm:pt-5">
              {/* Left: X button */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90"
                  aria-label="End stream"
                >
                  <X size={16} />
                </button>
                {micPermDenied && (
                  <div className="flex items-center gap-1 bg-amber-500/80 rounded-full px-2 py-0.5">
                    <MicOff size={10} className="text-white" />
                    <span className="text-[9px] text-white font-semibold">No mic</span>
                  </div>
                )}
              </div>

              {/* Center: Stylist name */}
              <div className="absolute left-1/2 -translate-x-1/2 pt-0.5">
                <span className="text-[15px] font-bold text-white">{stylistDisplayName}</span>
              </div>

              {/* Right: LiveBadge + viewer count + earnings */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                <LiveBadge />
                <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2 py-1">
                  <Eye size={10} className="text-white/70" />
                  <span className="text-[11px] text-white font-semibold tabular-nums">{viewerCount}</span>
                </div>
                <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2 py-1">
                  <span className="text-[11px] text-white font-bold tabular-nums">{formatEarnings(earnings)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reconnecting banner */}
          <AnimatePresence>
            {reconnecting && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-30"
              >
                <div className="flex items-center gap-2 bg-yellow-500/90 text-black text-[11px] font-semibold px-4 py-2 rounded-full shadow-lg">
                  <WifiOff size={12} />
                  Connection lost. Reconnecting...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RIGHT SIDE ICON BAR ── */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
            {/* Flip camera */}
            <button
              onClick={handleToggleCam}
              className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center active:scale-90"
              aria-label="Flip camera"
            >
              <RefreshCw size={20} className="text-white" />
            </button>

            {/* Mic toggle */}
            <button
              onClick={handleToggleMic}
              className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center active:scale-90 relative"
              aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micEnabled ? (
                <Mic size={20} className="text-white" />
              ) : (
                <>
                  <MicOff size={20} className="text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-black/50" />
                </>
              )}
            </button>

            {/* Effects placeholder */}
            <button
              onClick={() => toast('info', 'Effects coming soon')}
              className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center active:scale-90"
              aria-label="Effects"
            >
              <Sparkles size={20} className="text-white" />
            </button>

            {/* Showcase */}
            <button
              onClick={() => setShowcaseOpen(true)}
              className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center active:scale-90"
              aria-label="Showcase a service"
            >
              <Package size={20} className="text-white" />
            </button>
          </div>

          {/* ── FLOATING COMMENTS ── */}
          <FloatingComments comments={comments} shiftUp={stylistInputFocused} />

          {/* ── BOTTOM BAR ── */}
          <div className="absolute bottom-0 inset-x-0 z-30" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 12px)' }}>
            <div className="bg-black/45 backdrop-blur-sm px-3 pt-2 pb-2 flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <LiveCommentInput
                  onSend={handleSendComment}
                  cooldownRemaining={getCooldownRemaining()}
                  maxLength={MAX_COMMENT_LENGTH}
                  onFocus={() => setStylistInputFocused(true)}
                  onBlur={() => setStylistInputFocused(false)}
                />
              </div>
              <button
                onClick={() => setShowEndConfirm(true)}
                disabled={isEnding}
                className="shrink-0 px-4 h-10 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                style={{ backgroundColor: '#FE2C55' }}
                aria-label="End live"
              >
                <PhoneOff size={14} className="text-white" />
                <span className="text-[13px] font-bold text-white">End</span>
              </button>
            </div>
          </div>

          {/* ── GIFT ANIMATION ── */}
          <div className="absolute inset-0 z-[35] pointer-events-none flex items-center justify-center">
            <GiftAnimation gifts={gifts} />
          </div>

          {/* ── SHOWCASE TOAST ── */}
          <AnimatePresence>
            {showcaseToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-[40] bg-black/70 backdrop-blur-md rounded-full px-4 py-2"
              >
                <span className="text-[12px] font-semibold text-white">{showcaseToast}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── END LIVE MODAL ── */}
      {/* ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showEndConfirm && (
          <>
            <motion.div
              key="end-confirm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEndConfirm(false)}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="end-confirm-dialog"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-2xl p-6 border border-white/10 shadow-2xl"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              <div className="flex flex-col items-center text-center">
                <h3 className="text-[17px] font-bold text-white mb-1">End your live?</h3>
                <p className="text-[13px] text-white/50 mb-6">
                  Your viewers will be notified
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all active:scale-95"
                  >
                    Keep Going
                  </button>
                  <button
                    onClick={handleEndStream}
                    disabled={isEnding}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ backgroundColor: '#FE2C55' }}
                  >
                    {isEnding ? <Loader2 size={16} className="animate-spin" /> : <PhoneOff size={16} />}
                    End Live
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── SHOWCASE MODAL ── */}
      {/* ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showcaseOpen && (
          <>
            <motion.div
              key="showcase-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowcaseOpen(false)}
              className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              key="showcase-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 inset-x-0 z-51 rounded-t-3xl px-5 pt-4 pb-8 max-h-[60vh] overflow-y-auto"
              style={{ backgroundColor: '#1a1a1a', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Showcase a Service</h3>
                <button
                  onClick={() => setShowcaseOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-90"
                  aria-label="Close"
                >
                  <X size={16} className="text-white/70" />
                </button>
              </div>

              {stylistServices.length === 0 ? (
                <p className="text-[13px] text-white/40 text-center py-6">No services available</p>
              ) : (
                <div className="space-y-2">
                  {stylistServices.map((svc: any, i: number) => (
                    <div
                      key={svc._id || i}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white truncate">{svc.name}</p>
                        <p className="text-[12px] text-white/50">{svc.price ? `$${svc.price}` : 'Free'}</p>
                      </div>
                      <button
                        onClick={() => handleShowcaseFeature(svc)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white active:scale-95 transition-transform"
                        style={{ backgroundColor: '#FE2C55' }}
                      >
                        Feature
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── DISCONNECTED OVERLAY ── */}
      {/* ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {disconnectedOverlay && (
          <>
            <motion.div
              key="disconnect-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[55] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="disconnect-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-[55] rounded-2xl p-6 border border-white/10 shadow-2xl"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                  <WifiOff size={28} className="text-amber-400" />
                </div>
                <h3 className="text-[17px] font-bold text-white mb-1">You were disconnected</h3>
                <p className="text-[13px] text-white/50 mb-6">Your live may have ended.</p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => { setDisconnectedOverlay(false); navigate(-1); }}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all active:scale-95"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => { setDisconnectedOverlay(false); }}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ backgroundColor: '#FE2C55' }}
                  >
                    <RefreshCw size={16} />
                    Try to Reconnect
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── POST-STREAM SUMMARY ── */}
      {/* ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {step === 'summary' && streamSummary && (
          <motion.div
            key="stream-summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center px-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 20 }}
              className="w-full max-w-sm"
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Stream Complete!</h2>
                <p className="text-sm text-white/50">Here's how your live went</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <Clock size={20} className="text-white/40 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white tabular-nums">{formatTime(streamSummary.duration)}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Duration</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <Users size={20} className="text-white/40 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white tabular-nums">{streamSummary.peakViewers}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Peak Viewers</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <Heart size={20} className="text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white tabular-nums">{streamSummary.totalHearts}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Total Hearts</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                  <MessageCircle size={20} className="text-white/40 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white tabular-nums">{streamSummary.totalComments}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Comments</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('setup');
                  setElapsed(0);
                  setViewerCount(0);
                  setPeakViewerCount(0);
                  setSessionId(null);
                  setStreamSummary(null);
                  setTitle('');
                  setCategory('');
                  setEarnings(0);
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
