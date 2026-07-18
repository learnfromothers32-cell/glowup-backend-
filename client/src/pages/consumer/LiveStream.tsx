import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Send, Eye, Calendar, Loader2, WifiOff,
} from 'lucide-react';
import { useAuth } from '../../context/authUtils';
import { useLiveSession } from '../../hooks/useLiveSession';
import { RoomEvent } from 'livekit-client';
import { useToast } from '../../components/ui/Toast';
import LiveBadge from '../../components/live/LiveBadge';
import LiveCommentFeed from '../../components/live/LiveCommentFeed';
import FloatingHeart from '../../components/live/FloatingHeart';
import * as liveApi from '../../api/live';
import type { LiveSession } from '../../api/live';


export default function LiveStream() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStreamEnded = useCallback(() => {
    toast('info', 'Stream has ended');
    navigate('/app');
  }, [toast, navigate]);

  const {
    room,
    connectionState,
    viewerCount,
    setViewerCount,
    comments,
    hearts,
    connect,
    disconnect,
    sendComment,
    sendReaction,
  } = useLiveSession({ sessionId: sessionId || '', onStreamEnded: handleStreamEnded });

  // Fetch session
  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    liveApi
      .getLiveSession(sessionId)
      .then(({ session: s }) => {
        if (mounted) setSession(s);
      })
      .catch(() => {
        if (mounted) setError('Stream not found');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  // Attach video track to DOM
  useEffect(() => {
    if (!room || !videoContainerRef.current || !joined) return;

    const container = videoContainerRef.current;

    const attachTracks = () => {
      container.innerHTML = '';
      const participants = Array.from(room.remoteParticipants.values());
      for (const p of participants) {
        const pub = p.getTrackPublication('camera');
        if (pub?.track) {
          const el = pub.track.attach();
          el.className = 'w-full h-full object-cover';
          container.appendChild(el);
        }
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
    };
  }, [room, joined]);

  const handleJoin = async () => {
    if (!sessionId || !user) return;
    setJoining(true);
    try {
      const { token, wsUrl, session: s } = await liveApi.joinLiveSession(sessionId);
      setSession(s);
      await connect(wsUrl, token);
      setJoined(true);
      setViewerCount(s.viewerCount || 1);
    } catch (err: any) {
      toast('error', err?.response?.data?.message || 'Could not join stream');
    } finally {
      setJoining(false);
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim() || !user) return;
    sendComment(commentText.trim(), user.id, user.name, user.avatar);
    setCommentText('');
  };

  const handleHeart = () => {
    sendReaction();
  };

  const handleBack = () => {
    disconnect();
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-lg font-medium">{error || 'Stream not found'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-white/60 hover:text-white">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-30">
        <button onClick={handleBack} className="text-white/70 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <LiveBadge />
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
            <Eye size={12} className="text-white/60" />
            <span className="text-white text-xs font-medium">{viewerCount}</span>
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Video */}
      <div className="flex-1 relative">
        <div ref={videoContainerRef} className="w-full h-full bg-gray-900" />

        {!joined && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">{session.title}</h2>
              <p className="text-sm text-white/60">{session.stylistId?.name}</p>
              <p className="text-xs text-white/40 mt-1">{session.category}</p>
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {joining ? (
                <><Loader2 size={16} className="animate-spin" /> Joining...</>
              ) : (
                'Join Stream'
              )}
            </button>
          </div>
        )}

        {/* Connection status */}
        {joined && connectionState !== 'connected' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
            <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
              <WifiOff size={12} />
              Reconnecting...
            </div>
          </div>
        )}

        {/* Floating hearts */}
        <AnimatePresence>
          {hearts.map((h) => (
            <FloatingHeart key={h.id} id={h.id} x={h.x} />
          ))}
        </AnimatePresence>

        {/* Stylist info overlay */}
        {joined && (
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              {session.stylistId?.image ? (
                <img
                  src={session.stylistId.image}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold text-white">
                  {session.stylistId?.name?.[0]}
                </div>
              )}
              <span className="text-xs font-medium text-white">{session.stylistId?.name}</span>
            </div>
          </div>
        )}

        {/* Book CTA */}
        {joined && (
          <div className="absolute top-4 right-4 z-20">
            <Link
              to={`/app/stylist/${session.stylistId?._id}`}
              className="flex items-center gap-1.5 bg-purple-500/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-purple-500 transition-colors"
            >
              <Calendar size={12} />
              Book
            </Link>
          </div>
        )}

        {/* Comment feed */}
        {joined && (
          <div className="absolute bottom-20 left-0 right-0 z-20 pointer-events-none">
            <LiveCommentFeed comments={comments} />
          </div>
        )}

        {/* Input bar */}
        {joined && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-30">
            <div className="flex items-center gap-2">
              <button
                onClick={handleHeart}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
              >
                <Heart size={20} />
              </button>
              <div className="flex-1 flex items-center bg-white/10 rounded-full px-4 py-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim()}
                  className="text-purple-400 disabled:text-white/20 ml-2"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
