import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "../../utils/logger";
import { getStylistById } from "../../api/stylists";
import { getLiveSession } from "../../api/live";
import { getMyCredits } from "../../api/credits";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { useLiveSocket } from "../../hooks/useLiveSocket";
import { LivePlayerScreen } from "../../features/live/components/LivePlayerScreen";
import BookingModal from "../../features/consumer/components/BookingModal";
import { useAuth } from "../../context/authUtils";
import AuthModal from "../../features/consumer/components/AuthModal";
import { X, Loader2 } from "lucide-react";
import type { GiftItem, FloatingReaction } from "../../features/live/types/live.types";
import { useFollow } from "../../context/FollowContext";
import { LiveTour } from "../../features/live/components/LiveTour";

const GIFT_COLORS: Record<string, string> = {
  rose: "#FF6B8A", heart: "#FF2C55", fire: "#FF8C00",
  diamond: "#00BFFF", crown: "#FFD700", rocket: "#FF4500",
};

export default function LiveRoom() {
  const { stylistId } = useParams<{ stylistId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const followCtx = useFollow();

  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [streamEnded, setStreamEnded] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamTitle, setStreamTitle] = useState("");
  const [isMuted, setIsMuted] = useState(true);

  const [giftAnimations, setGiftAnimations] = useState<Array<{
    id: string; userName: string; giftName: string;
    giftIcon: string; animation: "small" | "medium" | "large"; color: string;
  }>>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [remoteReactions, setRemoteReactions] = useState<FloatingReaction[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCooldown, setLikeCooldown] = useState(false);
  const likeCoolRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showTour, setShowTour] = useState(() => {
    return localStorage.getItem("opencode-live-tour-completed") !== "true";
  });
  const [showBooking, setShowBooking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingStylist, setPendingStylist] = useState<Stylist | null>(null);
  const [giftToast, setGiftToast] = useState<string | null>(null);
  const [giftBalance, setGiftBalance] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const { connected, on, off, emit, sendMessage, sendLike, rejoinRoom } = useLiveSocket(stylistId);

  // Load stylist data
  useEffect(() => {
    if (!stylistId) return;
    getStylistById(stylistId)
      .then((s) => { setStylist(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stylistId]);

  // Load live session
  useEffect(() => {
    if (!stylistId) return;
    setSessionLoading(true);
    getLiveSession(stylistId)
      .then((data) => {
        if (data.session) {
          setViewerCount(data.session.viewerCount || 0);
          setStreamTitle(data.session.title || "");
          setIsLive(true);
          setStreamEnded(false);
        } else {
          // Session doesn't exist yet — stylist may go live while we're
          // on this page. Don't show "ended"; just mark as not live and
          // wait for the live:stylist-online socket event.
          setIsLive(false);
          setStreamEnded(false);
        }
      })
      .catch(() => { setStreamEnded(true); setIsLive(false); })
      .finally(() => setSessionLoading(false));
  }, [stylistId]);

  // Load coin balance
  useEffect(() => {
    if (!isAuthenticated) return;
    getMyCredits()
      .then((data) => setGiftBalance(data.balance || 0))
      .catch(() => setGiftBalance(0));
  }, [isAuthenticated]);

  // Socket event handlers
  useEffect(() => {
    if (!stylistId || !connected) return;

    on("live:viewer-count", (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount);
    });

    on("live:stream-ended", () => {
      setStreamEnded(true);
      setIsLive(false);
    });

    on("live:stylist-online", () => {
      // Stylist just went live while we were on this page — re-fetch session
      // and re-join the room to establish WebRTC.
      if (stylistId) {
        getLiveSession(stylistId)
          .then((data) => {
            if (data.session) {
              setStreamEnded(false);
              setIsLive(true);
              setViewerCount(data.session.viewerCount || 0);
              setStreamTitle(data.session.title || "");
              rejoinRoom();
            }
          })
          .catch(() => {});
      }
    });

    on("live:stylist-offline", () => {
      setStreamEnded(true);
      setIsLive(false);
    });

    on("live:error", (data: { message: string }) => {
      // Server rejected the join (e.g. stream not found) — retry after a
      // short delay in case the stylist is starting up.
      logger.warn("[live] server error:", data.message);
    });

    on("live:like-update", (data: { totalLikes: number }) => {
      if (typeof data.totalLikes === "number") {
        setTotalLikes(data.totalLikes);
      }
    });

    on("live:gift-received", (data: {
      userId: string; userName: string; giftId: string;
      giftName: string; giftIcon: string; coinAmount: number; animation: string;
    }) => {
      if (data.userId !== user?.id) {
        const id = `gift-${Date.now()}-${Math.random()}`;
        setGiftAnimations((prev) => [...prev, {
          id, userName: data.userName, giftName: data.giftName,
          giftIcon: data.giftIcon, animation: data.animation as "small" | "medium" | "large",
          color: GIFT_COLORS[data.giftId] || "#FF2C55",
        }].slice(-5));
        setGiftToast(`${data.userName} sent ${data.giftIcon} ${data.giftName}`);
        setTimeout(() => setGiftToast(null), 3000);
      }
    });

    on("live:reaction-update", (data: { userId: string; reaction: string }) => {
      if (data.userId !== user?.id) {
        const r: FloatingReaction = {
          id: `remote-${Date.now()}-${Math.random()}`,
          type: data.reaction,
          icon: data.reaction === "heart" ? "❤️" : data.reaction === "fire" ? "🔥" : data.reaction === "like" ? "👍" : data.reaction === "laugh" ? "😂" : "😮",
          x: 15 + Math.random() * 70,
          createdAt: Date.now(),
        };
        setRemoteReactions((prev) => [...prev, r].slice(-15));
        setTimeout(() => {
          setRemoteReactions((prev) => prev.filter((rr) => rr.id !== r.id));
        }, 2500);
      }
    });

    return () => {
      off("live:viewer-count");
      off("live:stream-ended");
      off("live:stylist-online");
      off("live:stylist-offline");
      off("live:error");
      off("live:like-update");
      off("live:gift-received");
      off("live:reaction-update");
    };
  }, [stylistId, connected, on, off, user, rejoinRoom]);

  // WebRTC subscriber
  useEffect(() => {
    if (!stylistId || streamEnded || !connected) return;

    const pcRefLocal = { current: null as RTCPeerConnection | null };
    const ICE_SERVERS = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        ...(import.meta.env.VITE_TURN_URL
          ? [{
              urls: import.meta.env.VITE_TURN_URL,
              username: import.meta.env.VITE_TURN_USERNAME || '',
              credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
            }]
          : []),
      ],
    };

    const handleOffer = async (data: { offer: RTCSessionDescriptionInit; senderSocketId: string }) => {
      if (pcRefLocal.current) pcRefLocal.current.close();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRefLocal.current = pc;

      pc.ontrack = (event) => {
        const stream = event.streams?.[0] ?? new MediaStream([event.track]);
        setRemoteStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emit('live:webrtc-ice-candidate', {
            stylistId,
            candidate: event.candidate.toJSON(),
            targetSocketId: data.senderSocketId,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          logger.warn('[WebRTC] Connection lost, attempting recovery...');
          setTimeout(() => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
              pc.close();
              pcRefLocal.current = null;
            }
          }, 10000);
        }
        if (pc.iceConnectionState === 'failed') {
          logger.error('[WebRTC] Connection failed');
          pc.close();
          pcRefLocal.current = null;
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        emit('live:webrtc-answer', {
          stylistId,
          answer: pc.localDescription,
          targetSocketId: data.senderSocketId,
        });
      } catch (err) {
        logger.error('[WebRTC] handleOffer error:', err);
        pc.close();
        pcRefLocal.current = null;
      }
    };

    const handleIceCandidate = (data: { candidate: RTCIceCandidateInit }) => {
      if (pcRefLocal.current && data.candidate) {
        pcRefLocal.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(console.error);
      }
    };

    on('live:webrtc-offer', handleOffer);
    on('live:webrtc-ice-candidate', handleIceCandidate);

    return () => {
      off('live:webrtc-offer');
      off('live:webrtc-ice-candidate');
      if (pcRefLocal.current) {
        pcRefLocal.current.close();
        pcRefLocal.current = null;
      }
    };
  }, [stylistId, streamEnded, connected, on, off, emit]);

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/app/live");
    }
  }, [navigate]);

  const isFollowing = followCtx.isFollowing(stylistId ?? '');

  const handleFollow = useCallback(async () => {
    if (!stylistId) return;
    const next = !isFollowing;
    if (next) {
      await followCtx.follow(stylistId);
    } else {
      await followCtx.unfollow(stylistId);
    }
  }, [stylistId, isFollowing, followCtx]);

  const handleSendGift = useCallback((gift: GiftItem) => {
    if (!stylistId) return;
    emit('live:send-gift', {
      stylistId,
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.icon,
      coinAmount: gift.price,
      animation: gift.animation,
    });
    setGiftToast(`Sent ${gift.icon} ${gift.name}`);
    setTimeout(() => setGiftToast(null), 2000);
  }, [stylistId, emit]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'Live Stream', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setGiftToast('Link copied!');
        setTimeout(() => setGiftToast(null), 2000);
      }).catch(() => {});
    }
  }, []);

  const handleReport = useCallback(() => {
    if (!stylistId) return;
    navigate(`/report?stylistId=${stylistId}&type=live`);
  }, [stylistId, navigate]);

  const handleReaction = useCallback((type: string) => {
    if (!stylistId || likeCooldown) return;
    emit('live:reaction', { stylistId, reaction: type });
    sendLike();
    setTotalLikes((prev) => prev + 1);
    setHasLiked(true);
    setLikeCooldown(true);
    if (likeCoolRef.current) clearTimeout(likeCoolRef.current);
    likeCoolRef.current = setTimeout(() => setLikeCooldown(false), 2500);
  }, [stylistId, emit, sendLike, likeCooldown]);

  const handleBookClick = () => {
    if (!stylist) return;
    if (!isAuthenticated) {
      setPendingStylist(stylist);
      setShowAuthModal(true);
    } else {
      setShowBooking(true);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingStylist) {
      setShowBooking(true);
      setPendingStylist(null);
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-brand-500 animate-spin" />
        <span className="text-white/60 text-sm tracking-widest uppercase">Joining live...</span>
      </div>
    );
  }

  if (!stylist || streamEnded) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-black">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/10">
          <X size={28} className="text-white/30" />
        </div>
        <div className="text-center">
          <p className="text-white text-lg font-bold mb-1">{streamEnded ? "Stream Ended" : "Stylist not found"}</p>
          <p className="text-white/40 text-sm mb-5">
            {streamEnded ? "The live stream has ended" : "This stylist doesn't exist"}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/live")}
          className="px-6 py-2.5 rounded-full text-sm font-bold transition-all bg-brand-500 text-white hover:bg-brand-600"
        >
          Browse Live
        </button>
      </div>
    );
  }

  return (
    <>
      <LivePlayerScreen
        stream={remoteStream}
        onFollow={handleFollow}
        isFollowing={isFollowing}
        hostName={stylist?.name}
        hostImage={stylist?.image}
        hostId={stylistId}
        isVerified={stylist?.isVerified}
        viewerCount={viewerCount}
        streamTitle={streamTitle}
        onSendGift={handleSendGift}
        onShare={handleShare}
        onReport={handleReport}
        giftBalance={giftBalance}
        giftAnimations={giftAnimations}
        onGiftAnimComplete={(id) => setGiftAnimations((prev) => prev.filter((g) => g.id !== id))}
        totalLikes={totalLikes}
        remoteReactions={remoteReactions}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((p) => !p)}
        onReaction={handleReaction}
        hasLiked={hasLiked}
        onClose={handleClose}
        onBook={handleBookClick}
        onHostClick={() => navigate(`/app/stylist/${stylistId}`)}
        socket={{ on, off, sendMessage }}
      />

      {/* Hidden video for WebRTC */}
      <video ref={videoRef} autoPlay muted playsInline className="hidden" />

      {/* Booking Modal */}
      {showBooking && stylist && (
        <BookingModal
          stylist={stylist}
          preSelectedService={null}
          onClose={() => setShowBooking(false)}
          onSuccess={() => setShowBooking(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Tour */}
      {showTour && (
        <LiveTour onComplete={() => setShowTour(false)} />
      )}

      {/* Toast */}
      <AnimatePresence>
        {giftToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[202] backdrop-blur-md text-white text-sm px-4 py-2 rounded-full bg-black/70"
          >
            {giftToast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
