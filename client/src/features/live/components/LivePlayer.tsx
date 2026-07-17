import { useEffect, useRef, useState, useCallback } from "react";
import { RoomEvent, Track, type Room as LiveKitRoom, type TrackPublication, type Participant } from "livekit-client";
import type { LocalVideoTrack, LocalAudioTrack } from "livekit-client";
import { cn } from "@/utils/cn";
import { Users, Wifi, WifiOff, AlertTriangle, Radio } from "lucide-react";

type ConnectionQuality = "excellent" | "good" | "poor" | "disconnected";

interface LivePlayerProps {
  room: LiveKitRoom | null;
  isHost: boolean;
  localVideoTrack?: LocalVideoTrack | null;
  localAudioTrack?: LocalAudioTrack | null;
  viewerCount?: number;
  onRetryConnect?: () => void;
  className?: string;
}

export function LivePlayer({
  room,
  isHost,
  localVideoTrack,
  localAudioTrack,
  viewerCount = 0,
  onRetryConnect,
  className,
}: LivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [quality, setQuality] = useState<ConnectionQuality>(room ? "excellent" : "disconnected");
  const [isConnecting, setIsConnecting] = useState(!room && !isHost);
  const [hasError, setHasError] = useState(false);

  // Host: attach local camera directly via MediaStream
  useEffect(() => {
    if (!isHost || !localVideoTrack || !videoRef.current) return;
    const stream = new MediaStream([localVideoTrack.mediaStreamTrack]);
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isHost, localVideoTrack]);

  // Host: attach local mic directly via MediaStream
  useEffect(() => {
    if (!isHost || !localAudioTrack || !audioRef.current) return;
    const stream = new MediaStream([localAudioTrack.mediaStreamTrack]);
    audioRef.current.srcObject = stream;

    return () => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [isHost, localAudioTrack]);

  // Viewer: attach remote tracks via LiveKit's TrackSubscribed events
  useEffect(() => {
    if (!room || isHost || !videoRef.current) return;

    setIsConnecting(false);

    const attachRemoteTrack = (trackPublication: TrackPublication) => {
      if (!trackPublication.track) return;
      if (trackPublication.source === Track.Source.Camera) {
        trackPublication.track.attach(videoRef.current!);
      }
      if (trackPublication.source === Track.Source.Microphone && audioRef.current) {
        trackPublication.track.attach(audioRef.current);
      }
    };

    const handleSubscribed = (trackPublication: TrackPublication) => {
      attachRemoteTrack(trackPublication);
      setQuality("excellent");
    };

    const handleUnsubscribed = (trackPublication: TrackPublication) => {
      if (trackPublication.track) {
        trackPublication.track.detach();
      }
    };

    const handleParticipantConnected = (participant: Participant) => {
      participant.trackPublications?.forEach((pub) => {
        if (pub.track) attachRemoteTrack(pub);
      });
    };

    const handleDisconnected = () => {
      setQuality("disconnected");
      setHasError(true);
    };

    room.on(RoomEvent.TrackSubscribed, handleSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleUnsubscribed);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    room.participants?.forEach((p) => {
      p.trackPublications?.forEach((pub) => {
        if (pub.track) attachRemoteTrack(pub);
      });
    });

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleUnsubscribed);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, isHost]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsConnecting(true);
    onRetryConnect?.();
  }, [onRetryConnect]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-gray-950 overflow-hidden",
        className,
      )}
      role="region"
      aria-label={isHost ? "Your camera preview" : "Live stream video"}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        aria-hidden="true"
      />
      <audio ref={audioRef} autoPlay aria-hidden="true" />

      {/* Host badge — top left */}
      {isHost && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
          <Radio size={10} className="text-red-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Preview</span>
        </div>
      )}

      {/* Viewer count — top right */}
      {!isHost && viewerCount > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
          <Users size={10} className="text-white/80" />
          <span className="text-[10px] font-semibold text-white">{viewerCount.toLocaleString()}</span>
        </div>
      )}

      {/* Connection quality indicator */}
      {quality !== "disconnected" && (
        <div className={cn(
          "absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-sm",
          quality === "excellent" && "bg-emerald-500/20",
          quality === "good" && "bg-yellow-500/20",
          quality === "poor" && "bg-red-500/20",
        )} aria-label={`Connection quality: ${quality}`}>
          <Wifi size={10} className={cn(
            quality === "excellent" && "text-emerald-400",
            quality === "good" && "text-yellow-400",
            quality === "poor" && "text-red-400",
          )} />
          <span className={cn(
            "text-[10px] font-medium capitalize",
            quality === "excellent" && "text-emerald-300",
            quality === "good" && "text-yellow-300",
            quality === "poor" && "text-red-300",
          )}>
            {quality}
          </span>
        </div>
      )}

      {/* Connecting state */}
      {isConnecting && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80" role="status" aria-label="Connecting to stream">
          <div className="text-center text-white/70">
            <div className="w-14 h-14 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-white/90">Connecting to stream</p>
            <p className="text-xs text-white/50 mt-1">This won&apos;t take long...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80" role="alert">
          <div className="text-center text-white/70 px-6">
            <div className="w-14 h-14 rounded-full bg-red-500/20 mx-auto mb-3 flex items-center justify-center">
              <WifiOff size={24} className="text-red-400" />
            </div>
            <p className="text-sm font-medium text-white/90">Connection lost</p>
            <p className="text-xs text-white/50 mt-1 mb-4">Check your internet connection and try again</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* No room yet (host loading) */}
      {!room && !isHost && !isConnecting && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Waiting for stream">
          <div className="text-center text-white/50">
            <div className="w-14 h-14 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/70">Waiting for stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}
