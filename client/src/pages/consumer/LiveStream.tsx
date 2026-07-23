import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Heart, Eye, Loader2, WifiOff, Wifi,
  Share2, Volume2, Gift, Calendar,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/authUtils';
import { useLiveSession } from '../../hooks/useLiveSession';
import { RoomEvent, Track } from 'livekit-client';
import { useToast } from '../../components/ui/Toast';
import LiveBadge from '../../components/live/LiveBadge';
import FloatingHeart from '../../components/live/FloatingHeart';
import FloatingComments from '../../components/live/FloatingComments';
import LiveCommentInput from '../../components/live/LiveCommentInput';
import GiftPickerModal from '../../components/live/GiftPickerModal';
import GiftAnimation, { useGiftQueue } from '../../components/live/GiftAnimation';
import BookingPromptCard from '../../components/live/BookingPromptCard';
import * as liveApi from '../../api/live';
import type { LiveSession } from '../../api/live';
import { getSocketUrl } from '../../services/socket';
import { io } from 'socket.io-client';

interface TapHeart {
  id: number;
  x: number;
  y: number;
}

interface ShowcaseData {
  serviceName: string;
  servicePrice: string;
}

export default function LiveStream() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const tapHeartIdRef = useRef(0);
  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [0, 150], [1, 0]);

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamEnded, setStreamEnded] = useState(false);
  const [userLiked, setUserLiked] = useState(false);
  const [tapHearts, setTapHearts] = useState<TapHeart[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [audioMuted, setAudioMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const likeInFlightRef = useRef(false);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);

  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const { gifts, addGift } = useGiftQueue();
  const [showcase, setShowcase] = useState<ShowcaseData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight;
      setKeyboardVisible(window.visualViewport ? window.visualViewport.height < vh * 0.75 : false);
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const handleStreamEnded = useCallback(() => {
    setStreamEnded(true);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const socket = io(getSocketUrl('live') || undefined, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socket.on('live:session-ended', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        handleStreamEnded();
      }
    });
    return () => { socket.disconnect(); };
  }, [sessionId, handleStreamEnded]);

  const {
    room,
    connectionState,
    viewerCount,
    setViewerCount,
    comments,
    hearts,
    likeCount,
    setLikeCount,
    connect,
    disconnect,
    sendComment,
    broadcastLikeUpdate,
    sendReaction,
    getCooldownRemaining,
    MAX_COMMENT_LENGTH,
  } = useLiveSession({
    sessionId: sessionId || '',
    onStreamEnded: handleStreamEnded,
    initialLikeCount: 0,
  });

  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    liveApi
      .getLiveSession(sessionId)
      .then(({ session: s }) => {
        if (mounted) {
          setSession(s);
          setLikeCount(s.likeCount || 0);
          if (user && s.likedUserIds?.includes(user.id)) {
            setUserLiked(true);
          }
          if (s.status === 'ended') {
            setStreamEnded(true);
          }
        }
      })
      .catch(() => {
        if (mounted) setError('Stream not found');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [sessionId, setLikeCount, user]);

  const attachedElementsRef = useRef<HTMLMediaElement[]>([]);

  const detachAllTracks = useCallback(() => {
    for (const el of attachedElementsRef.current) {
      try {
        el.remove();
        if ('srcObject' in el) {
          (el as HTMLMediaElement).srcObject = null;
        }
      } catch {}
    }
    attachedElementsRef.current = [];
  }, []);

  useEffect(() => {
    if (!room || !videoContainerRef.current || !joined) return;
    const container = videoContainerRef.current;

    const attachTracks = () => {
      detachAllTracks();
      const participants = Array.from(room.remoteParticipants.values());
      let hasAudio = false;
      for (const p of participants) {
        const camPub = p.getTrackPublication(Track.Source.Camera);
        if (camPub?.track) {
          const el = camPub.track.attach();
          el.className = 'w-full h-full object-cover';
          container.appendChild(el);
          attachedElementsRef.current.push(el);
        }
        const audioPub = p.getTrackPublication(Track.Source.Microphone);
        if (audioPub?.track) {
          const audioEl = audioPub.track.attach() as HTMLMediaElement;
          audioEl.className = 'sr-only';
          audioEl.muted = audioMuted;
          document.body.appendChild(audioEl);
          audioElementsRef.current.push(audioEl);
          attachedElementsRef.current.push(audioEl);
          hasAudio = true;
        }
      }
      if (hasAudio && !audioMuted) {
        const tryPlay = () => {
          for (const el of audioElementsRef.current) {
            if (el.paused) {
              el.play().catch(() => {
                setAutoplayBlocked(true);
                el.muted = true;
              });
            }
          }
        };
        tryPlay();
      }
    };

    room.on(RoomEvent.TrackSubscribed, attachTracks);
    room.on(RoomEvent.ParticipantConnected, () => {
      setViewerCount(room.remoteParticipants.size);
      attachTracks();
    });
    room.on(RoomEvent.ParticipantDisconnected, () => {
      setViewerCount(Math.max(0, room.remoteParticipants.size));
      attachTracks();
    });

    attachTracks();
    return () => {
      room.off(RoomEvent.TrackSubscribed, attachTracks);
      room.off(RoomEvent.ParticipantConnected, attachTracks);
      room.off(RoomEvent.ParticipantDisconnected, attachTracks);
      detachAllTracks();
      for (const el of audioElementsRef.current) {
        try { el.remove(); } catch {}
      }
      audioElementsRef.current = [];
    };
  }, [room, joined, audioMuted, detachAllTracks]);

  useEffect(() => {
    return () => {
      detachAllTracks();
      for (const el of audioElementsRef.current) {
        try { el.remove(); } catch {}
      }
      audioElementsRef.current = [];
    };
  }, [detachAllTracks]);

  useEffect(() => {
    if (!room || !joined) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'showcase') {
          setShowcase({ serviceName: data.serviceName || '', servicePrice: data.servicePrice || '' });
        } else if (data.type === 'gift') {
          addGift(data.emoji || '🎁', data.giftName || 'Gift', data.senderName || 'Someone');
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, joined, addGift]);

  const handleUnmute = useCallback(() => {
    setAudioMuted(false);
    setAutoplayBlocked(false);
    for (const el of audioElementsRef.current) {
      el.muted = false;
      if (el.paused) {
        el.play().catch(() => setAutoplayBlocked(true));
      }
    }
  }, []);

  const handleJoin = async () => {
    if (!sessionId || !user) return;
    setJoining(true);
    try {
      const { token, wsUrl, session: s } = await liveApi.joinLiveSession(sessionId);
      setSession(s);
      setLikeCount(s.likeCount || 0);
      if (s.likedUserIds?.includes(user.id)) {
        setUserLiked(true);
      } else {
        setUserLiked(false);
      }
      await connect(wsUrl, token);
      setJoined(true);
      setViewerCount(Math.max(1, s.viewerCount || 0));
    } catch (err: any) {
      toast('error', err?.response?.data?.message || 'Could not join stream');
    } finally {
      setJoining(false);
    }
  };

  const performLike = useCallback(async () => {
    if (!sessionId || !user) return;
    if (likeInFlightRef.current) return;
    likeInFlightRef.current = true;

    const prevLiked = userLiked;
    const prevCount = likeCount;

    setUserLiked(!prevLiked);
    const newCount = prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
    setLikeCount(newCount);
    broadcastLikeUpdate(newCount);

    sendReaction();

    try {
      const { likeCount: serverCount, liked } = await liveApi.likeLiveSession(sessionId);
      setLikeCount(serverCount);
      setUserLiked(liked);
      broadcastLikeUpdate(serverCount);
    } catch (err: any) {
      setUserLiked(prevLiked);
      setLikeCount(prevCount);
      broadcastLikeUpdate(prevCount);
      const msg = err?.response?.data?.message || err?.message || 'Could not like stream';
      toast('error', msg);
    } finally {
      likeInFlightRef.current = false;
    }
  }, [sessionId, user, userLiked, likeCount, setLikeCount, broadcastLikeUpdate, sendReaction, toast]);

  const spawnTapHeart = useCallback(() => {
    const id = ++tapHeartIdRef.current;
    setTapHearts((prev) => [...prev.slice(-8), { id, x: 88, y: window.innerHeight - 280 }]);
    setTimeout(() => setTapHearts((prev) => prev.filter((h) => h.id !== id)), 1400);
  }, []);

  const handleDoubleTap = useCallback((_e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      performLike();
      spawnTapHeart();
    }
    lastTapRef.current = now;
  }, [performLike, spawnTapHeart]);

  const handleSendComment = useCallback(
    (text: string): boolean => {
      if (!user) return false;
      const sent = sendComment(text, user.id, user.name, user.avatar);
      return sent;
    },
    [user, sendComment]
  );

  const handleSendGift = useCallback(
    (gift: { type: string; emoji: string; label: string; coins: number }) => {
      if (!room || !user) return;
      try {
        const data = new TextEncoder().encode(
          JSON.stringify({
            type: 'gift',
            giftType: gift.type,
            giftName: gift.label,
            emoji: gift.emoji,
            senderName: user.name,
            value: gift.coins,
          })
        );
        room.localParticipant.publishData(data, { reliable: true });
      } catch {}
      addGift(gift.emoji, gift.label, user.name);
    },
    [room, user, addGift]
  );

  const handleFollow = useCallback(async () => {
    setIsFollowing(true);
    toast('success', 'Following!');
  }, [toast]);

  const handleBack = () => {
    setJoined(false);
    setTimeout(() => {
      disconnect();
      navigate(-1);
    }, 250);
  };

  const handleRetry = () => {
    setError(null);
    setStreamEnded(false);
    setLoading(true);
    liveApi
      .getLiveSession(sessionId || '')
      .then(({ session: s }) => {
        setSession(s);
        setLikeCount(s.likeCount || 0);
        if (user && s.likedUserIds?.includes(user.id)) {
          setUserLiked(true);
        } else {
          setUserLiked(false);
        }
        if (s.status === 'ended') {
          setStreamEnded(true);
        }
      })
      .catch(() => setError('Stream not found'))
      .finally(() => setLoading(false));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: session?.title || 'Live Stream', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast('success', 'Link copied!');
    }
  };

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      handleBack();
    }
  };

  const stylistId = session?.stylistId?._id;
  const stylistName = session?.stylistId?.name || 'Stylist';
  const stylistImage = session?.stylistId?.image;
  const stylistInitial = stylistName[0] || '?';

  if (loading) {
    return (
      <div className="h-dvh w-full bg-black relative overflow-hidden select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
          <Loader2 size={28} className="animate-spin text-white/60" />
          <p className="text-xs text-white/40 mt-3 font-medium">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-dvh w-full bg-black flex flex-col items-center justify-center gap-5 text-white px-6" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <WifiOff size={28} className="text-white/40" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">{error || 'Stream not found'}</p>
          <p className="text-sm text-white/40 mt-1">This stream may have ended or doesn't exist.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition-all active:scale-95"
          >
            <Loader2 size={14} />
            Retry
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-full bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (streamEnded) {
    return (
      <div className="h-dvh w-full bg-black relative overflow-hidden select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div ref={videoContainerRef} className="absolute inset-0 bg-gray-900" />
        <div className="absolute inset-0 z-10" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 gap-6">
          <div className="relative">
            {stylistImage ? (
              <img src={stylistImage} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{stylistInitial}</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-[16px] font-bold text-white">@{stylistName}&apos;s live has ended</p>
            <p className="text-[14px] text-white/70 mt-1">Thanks for watching</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {stylistId && (
              <button
                onClick={() => navigate(`/app/stylist/${stylistId}`)}
                className="w-full h-12 rounded-2xl text-white text-[15px] font-bold active:scale-[0.98] transition-transform"
                style={{ backgroundColor: '#FE2C55' }}
              >
                Book with {stylistName}
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="w-full h-12 rounded-2xl border border-white/20 text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity: dragOpacity, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: joined ? 1 : 0.7 }}
      className="h-dvh w-full bg-black relative overflow-hidden select-none"
    >
      {/* Layer 1: Full screen camera */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDrag={(_, info) => dragY.set(info.offset.y)}
        onDragEnd={handleDragEnd}
        className="absolute inset-0"
      >
        <div
          ref={videoContainerRef}
          className="absolute inset-0 bg-gray-900"
          onClick={handleDoubleTap}
          onTouchEnd={handleDoubleTap}
        />
      </motion.div>

      {/* Layer 2: Dark gradient — bottom 50% */}
      <div className="absolute bottom-0 inset-x-0 h-[50%] bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />

      {/* Top gradient for top bar readability */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />

      {/* Tap hearts */}
      <AnimatePresence>
        {tapHearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.3 }}
            animate={{
              opacity: [1, 1, 0],
              scale: 1.3,
              y: -200,
              x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 40],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="absolute pointer-events-none z-50"
            style={{ left: `${h.x}%`, top: h.y }}
          >
            <span className="text-4xl drop-shadow-lg">❤️</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Heuristic hearts */}
      <AnimatePresence>
        {hearts.map((h) => (
          <FloatingHeart key={h.id} id={h.id} x={h.x} />
        ))}
      </AnimatePresence>

      {/* Gift animation center */}
      <div className="absolute inset-0 z-[35] pointer-events-none flex items-center justify-center">
        <GiftAnimation gifts={gifts} />
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── PRE-JOIN OVERLAY ── */}
      {/* ═══════════════════════════════════════════════════ */}
      {!joined && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 px-6 w-full max-w-[320px]"
          >
            {stylistImage ? (
              <img src={stylistImage} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center border-2 border-white/20">
                <span className="text-3xl font-bold text-white">{stylistInitial}</span>
              </div>
            )}

            <div className="text-center">
              <p className="text-[18px] font-bold text-white">{stylistName}</p>
              <p className="text-[14px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>is live now</p>
            </div>

            <div className="flex items-center gap-1.5 text-white/60">
              <Eye size={13} />
              <span className="text-[13px] font-semibold">{viewerCount} watching</span>
            </div>

            {(session.title || session.category) && (
              <p className="text-[13px] text-white/50 italic text-center">
                {session.title}{session.category ? ` · ${session.category}` : ''}
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full h-12 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#FE2C55' }}
            >
              {joining ? (
                <><Loader2 size={16} className="animate-spin" /> Joining...</>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  Join Live
                </>
              )}
            </button>

            <p className="text-[12px] text-white/30">Tap anywhere to join</p>
          </motion.div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── TOP BAR ── */}
      {/* ═══════════════════════════════════════════════════ */}
      {joined && (
        <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
          <div className="relative flex items-center justify-between px-3 pt-3 sm:pt-4">
            {/* Left: back + avatar + name + badge */}
            <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
              <button
                onClick={handleBack}
                className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center active:scale-90"
                aria-label="Go back"
              >
                <ChevronLeft size={18} className="text-white" />
              </button>

              {stylistImage ? (
                <img src={stylistImage} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{stylistInitial}</span>
                </div>
              )}

              <span className="text-[14px] font-bold text-white truncate max-w-[100px]">{stylistName}</span>

              <LiveBadge size="sm" />
            </div>

            {/* Right: viewer count + share */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-1">
                <Eye size={12} className="text-white/70" />
                <span className="text-[12px] text-white font-semibold tabular-nums">{viewerCount}</span>
              </div>
              <button
                onClick={handleShare}
                className="active:scale-90"
                aria-label="Share stream"
              >
                <Share2 size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection state indicator */}
      <AnimatePresence>
        {joined && connectionState !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="flex items-center gap-2 bg-yellow-500/90 text-black text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
              {connectionState === 'reconnecting' ? (
                <><WifiOff size={12} /> Reconnecting...</>
              ) : (
                <><Wifi size={12} /> Connecting...</>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Autoplay unmute prompt */}
      <AnimatePresence>
        {joined && autoplayBlocked && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={handleUnmute}
            className="absolute bottom-[160px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10 active:scale-95 transition-transform"
          >
            <Volume2 size={14} />
            Tap to unmute
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── FLOATING COMMENTS ── */}
      {/* ═══════════════════════════════════════════════════ */}
      {joined && (
        <div className="absolute left-3 bottom-[130px] w-[60%] z-[25]">
          <FloatingComments comments={comments} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── RIGHT SIDE ICON BAR ── */}
      {/* ═══════════════════════════════════════════════════ */}
      {joined && (
        <div className="absolute right-3 bottom-[140px] z-20 flex flex-col items-center gap-5">
          {/* Stylist Avatar + Follow */}
          <Link
            to={`/app/stylist/${stylistId}`}
            className="flex flex-col items-center gap-1"
            aria-label={`View ${stylistName}'s profile`}
          >
            <div className="relative">
              {stylistImage ? (
                <div className="w-[52px] h-[52px] rounded-full border-2 border-white overflow-hidden">
                  <img src={stylistImage} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-[52px] h-[52px] rounded-full border-2 border-white bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{stylistInitial}</span>
                </div>
              )}
              {!isFollowing && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFollow(); }}
                  className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center active:scale-90"
                  style={{ backgroundColor: '#FE2C55' }}
                  aria-label={`Follow ${stylistName}`}
                >
                  <span className="text-white text-[11px] font-bold leading-none">+</span>
                </button>
              )}
              {isFollowing && (
                <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold leading-none">✓</span>
                </div>
              )}
            </div>
          </Link>

          {/* Like */}
          <button
            onClick={() => { performLike(); spawnTapHeart(); }}
            className="flex flex-col items-center gap-1"
            aria-label={userLiked ? 'Unlike' : 'Like'}
          >
            <motion.div
              animate={userLiked ? { scale: [1, 1.3, 0.9, 1.1, 1] } : {}}
              transition={{ duration: 0.4 }}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            >
              <Heart
                size={32}
                className={userLiked ? 'text-red-500 fill-red-500' : 'text-white'}
              />
            </motion.div>
            <span className="text-[11px] text-white font-bold tabular-nums">{likeCount}</span>
          </button>

          {/* Gift */}
          <button
            onClick={() => setGiftPickerOpen(true)}
            className="flex flex-col items-center gap-1"
            aria-label="Send a gift"
          >
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            >
              <Gift size={32} className="text-white" />
            </div>
            <span className="text-[11px] text-white font-bold">Gift</span>
          </button>

          {/* Book */}
          {stylistId && (
            <button
              onClick={() => navigate(`/app/stylist/${stylistId}`)}
              className="flex flex-col items-center gap-1"
              aria-label="Book a service"
            >
              <div
                className="w-[56px] h-[56px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FE2C55' }}
              >
                <Calendar size={32} className="text-white" />
              </div>
              <span className="text-[11px] text-white font-bold">Book</span>
            </button>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1"
            aria-label="Share stream"
          >
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            >
              <Share2 size={28} className="text-white" />
            </div>
            <span className="text-[11px] text-white font-bold">Share</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── BOTTOM BAR ── */}
      {/* ═══════════════════════════════════════════════════ */}
      {joined && !keyboardVisible && (
        <div
          className="absolute bottom-0 inset-x-0 z-30 px-3 pb-2"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        >
          <LiveCommentInput
            onSend={handleSendComment}
            cooldownRemaining={getCooldownRemaining()}
            maxLength={MAX_COMMENT_LENGTH}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── BOOKING PROMPT CARD ── */}
      {/* ═══════════════════════════════════════════════════ */}
      {joined && (
        <BookingPromptCard
          visible={!!showcase}
          serviceName={showcase?.serviceName || ''}
          servicePrice={showcase?.servicePrice || ''}
          stylistId={stylistId || ''}
          onDismiss={() => setShowcase(null)}
        />
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── GIFT PICKER MODAL ── */}
      {/* ═══════════════════════════════════════════════════ */}
      <GiftPickerModal
        open={giftPickerOpen}
        onClose={() => setGiftPickerOpen(false)}
        onSelect={handleSendGift}
      />
    </motion.div>
  );
}
