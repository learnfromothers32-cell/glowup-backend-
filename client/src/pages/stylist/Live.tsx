import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "../../utils/logger";
import { useLiveStream } from "../../hooks/useLiveStream";
import LiveCreatorPanel from "../../features/live/components/LiveCreatorPanel";
import ModerationPanel from "../../features/live/components/ModerationPanel";
import { ScheduleSessionForm } from "../../features/live/components/ScheduleSessionForm";
import { useLiveStore } from "../../features/live/store/liveStore";
import { scheduleLive } from "../../api/live";
import { CalendarPlus, Sparkles } from "lucide-react";

export default function StylistLive() {
  const {
    isLive, viewerCount, totalLikes, totalGifts, totalCoins, chatMessages, giftNotifications, loading,
    socket, stylistId, goLive, endLive, sendChat,
  } = useLiveStream();

  const streamRef = useRef<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [recentGift, setRecentGift] = useState<typeof giftNotifications[0] | null>(null);
  const [webrtcConnected, setWebrtcConnected] = useState(false);

  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [streamCategory, setStreamCategory] = useState("hairstyling");

  const [activeViewers, setActiveViewers] = useState<Set<string>>(new Set());
  const [goLiveError, setGoLiveError] = useState("");

  const { mutedUsers, addMutedUser, removeMutedUser, blockedUsers, addBlockedUser, removeBlockedUser } = useLiveStore();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isLive) {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (giftNotifications.length === 0) return;
    const latest = giftNotifications[giftNotifications.length - 1];
    setRecentGift(latest);
    const timer = setTimeout(() => setRecentGift(null), 4000);
    return () => clearTimeout(timer);
  }, [giftNotifications]);

  // WebRTC publisher
  useEffect(() => {
    if (!isLive || !socket || !stylistId) return;

    const pcs = new Map<string, RTCPeerConnection>();
    const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    const getStream = async () => {
      while (!streamRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return streamRef.current;
    };

    const handleUserJoined = async (data: { userId: string; userRole: string; socketId: string }) => {
      if (data.userRole === 'stylist') return;
      if (pcs.has(data.socketId)) return;

      setActiveViewers(prev => new Set(prev).add(data.userId));

      const stream = await getStream();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcs.set(data.socketId, pc);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('live:webrtc-ice-candidate', {
            stylistId, candidate: event.candidate.toJSON(), targetSocketId: data.socketId,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected') {
          setWebrtcConnected(true);
        }
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          pc.close();
          pcs.delete(data.socketId);
          setActiveViewers(prev => { const n = new Set(prev); n.delete(data.userId); return n; });
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('live:webrtc-offer', {
          stylistId, offer: pc.localDescription, targetSocketId: data.socketId,
        });
      } catch (err) {
        logger.error('[WebRTC] createOffer error:', err);
        pc.close();
        pcs.delete(data.socketId);
      }
    };

    const handleUserLeft = (data: { socketId: string }) => {
      const pc = pcs.get(data.socketId);
      if (pc) {
        pc.close();
        pcs.delete(data.socketId);
      }
    };

    const handleAnswer = (data: { answer: RTCSessionDescriptionInit; senderSocketId: string }) => {
      const pc = pcs.get(data.senderSocketId);
      if (pc && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(console.error);
      }
    };

    const handleIceCandidate = (data: { candidate: RTCIceCandidateInit; senderSocketId: string }) => {
      const pc = pcs.get(data.senderSocketId);
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(console.error);
      }
    };

    socket.on('live:user-joined', handleUserJoined);
    socket.on('live:user-left', handleUserLeft);
    socket.on('live:webrtc-answer', handleAnswer);
    socket.on('live:webrtc-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('live:user-joined', handleUserJoined);
      socket.off('live:user-left', handleUserLeft);
      socket.off('live:webrtc-answer', handleAnswer);
      socket.off('live:webrtc-ice-candidate', handleIceCandidate);
      pcs.forEach(pc => pc.close());
      pcs.clear();
      setWebrtcConnected(false);
    };
  }, [isLive, socket, stylistId]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;
      setLocalStream(stream);
      setCameraDenied(false);
      return true;
    } catch {
      setCameraDenied(true);
      return false;
    }
  }, []);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const handleGoLive = async (title: string) => {
    setGoLiveError("");
    const camOk = await startCamera();
    if (!camOk) {
      setGoLiveError("Camera access is required to go live. Click 'Grant access' to enable your camera.");
      return;
    }
    const ok = await goLive(title);
    if (!ok) {
      setGoLiveError("Failed to start the stream. Check your connection and try again.");
    }
  };

  const handleEndLive = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setDuration(0);
    setWebrtcConnected(false);
    await endLive();
  };

  const handleScheduleSubmit = async (data: { title: string; description: string; category: string; scheduledAt: string; durationMinutes: number }) => {
    try {
      await scheduleLive(data);
      setShowSchedule(false);
    } catch (err) {
      logger.error("[Schedule] Failed:", err);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => (t.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => (t.enabled = isVideoOff));
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleModerationMute = (userId: string) => {
    if (mutedUsers.includes(userId)) removeMutedUser(userId);
    else addMutedUser(userId);
  };

  const handleModerationBlock = (userId: string) => {
    if (blockedUsers.includes(userId)) removeBlockedUser(userId);
    else addBlockedUser(userId);
  };

  const moderatedUsers = chatMessages
    .filter((m) => m.userRole !== "stylist")
    .reduce<Map<string, { id: string; name: string; messageCount: number }>>((acc, m) => {
      if (!acc.has(m.userId)) {
        acc.set(m.userId, { id: m.userId, name: m.userName, messageCount: 0 });
      }
      acc.get(m.userId)!.messageCount++;
      return acc;
    }, new Map());

  const moderationUsers = Array.from(moderatedUsers.values()).map((u) => ({
    ...u,
    isMuted: mutedUsers.includes(u.id),
    isBlocked: blockedUsers.includes(u.id),
    isModerator: false,
  }));

  return (
    <div className="flex-1 bg-black flex flex-col overflow-hidden">
      {!isLive && (
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">Live Studio</h2>
          <button
            onClick={() => setShowSchedule(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stylist-500 text-white hover:bg-stylist-600 rounded-xl text-sm font-semibold transition-colors"
          >
            <CalendarPlus size={16} />
            Schedule
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        <LiveCreatorPanel
          isLive={isLive} loading={loading} viewerCount={viewerCount}
          totalLikes={totalLikes} totalGifts={totalGifts} totalCoins={totalCoins}
          chatMessages={chatMessages}
          onGoLive={handleGoLive} onEndLive={handleEndLive} onSendChat={sendChat}
          onToggleMic={toggleMic} onToggleVideo={toggleVideo}
          onSwitchCamera={() => {}} onToggleBeauty={() => {}} onShare={() => {}} onInviteGuest={() => {}}
          isMuted={isMuted} isVideoOff={isVideoOff} duration={duration}
          cameraDenied={cameraDenied} onRetryCamera={startCamera} stream={localStream}
          streamTitle={streamTitle} streamDescription={streamDescription} streamCategory={streamCategory}
          onTitleChange={setStreamTitle} onDescriptionChange={setStreamDescription} onCategoryChange={setStreamCategory}
          goLiveError={goLiveError}
        />
      </div>

      {/* Gift toast */}
      <AnimatePresence>
        {recentGift && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md shadow-lg" style={{ background: "rgba(0,0,0,0.85)" }}>
              <Sparkles size={14} className="text-yellow-400" />
              <span className="text-white text-sm font-medium">{recentGift.giftIcon}</span>
              <span className="text-white text-sm">{recentGift.userName}</span>
              <span className="text-white/50 text-xs">sent</span>
              <span className="text-white text-sm font-bold">{recentGift.giftName}</span>
              <span className="text-yellow-400 text-xs font-bold">+{recentGift.coinAmount}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModerationPanel
        isOpen={showModeration} onClose={() => setShowModeration(false)}
        users={moderationUsers}
        onMuteUser={handleModerationMute} onBlockUser={handleModerationBlock}
      />

      {showSchedule && (
        <ScheduleSessionForm
          onClose={() => setShowSchedule(false)}
          onSubmit={handleScheduleSubmit}
        />
      )}
    </div>
  );
}
