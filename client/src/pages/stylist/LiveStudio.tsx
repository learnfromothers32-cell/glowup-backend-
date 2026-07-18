import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Radio,
  Loader2, ChevronLeft, Sparkles, Eye,
} from 'lucide-react';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useToast } from '../../components/ui/Toast';
import * as liveApi from '../../api/live';
import { Track, RoomEvent } from 'livekit-client';


const CATEGORIES = [
  'Braids', 'Nails', 'Barber', 'Colorist', 'Stylist',
  'Makeup', 'Locs', 'Twists', 'Natural Hair', 'Extensions',
];

export default function LiveStudio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'setup' | 'preview' | 'live'>('setup');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const {
    room,
    connect,
    disconnect,
    toggleCamera,
    toggleMicrophone,
  } = useLiveSession({ sessionId: sessionId || '', isBroadcaster: true });

  // Attach video track to DOM
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

  // Viewer count + comment listeners
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: any) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'reaction') {
          const id = Date.now() + Math.random();
          setHearts((prev) => [...prev.slice(-15), { id, x: 20 + Math.random() * 60 }]);
          setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2000);
        }
      } catch (e) {
        console.warn('Failed to parse live data:', e);
      }
    };

    const handleParticipant = () => {
      setViewerCount(room.remoteParticipants.size);
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.ParticipantConnected, handleParticipant);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipant);
    setViewerCount(room.remoteParticipants.size);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ParticipantConnected, handleParticipant);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipant);
    };
  }, [room]);

  // Timer
  useEffect(() => {
    if (step !== 'live') return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleGoLive = async () => {
    if (!title.trim() || !category) {
      toast('error', 'Please fill in title and category');
      return;
    }
    setIsStarting(true);
    let sessionCreated = false;
    let sessionId = '';
    try {
      const { session, token, wsUrl } = await liveApi.createLiveSession({
        title: title.trim(),
        category,
      });
      sessionId = session._id;
      sessionCreated = true;
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
      setStep('setup');
      toast('info', 'Stream ended', `Peak viewers: ${viewerCount} | Duration: ${formatTime(elapsed)}`);
    } catch {
      toast('error', 'Failed to end stream');
    } finally {
      setIsEnding(false);
    }
  };

  const handleToggleMic = async () => {
    await toggleMicrophone();
    setMicEnabled((prev) => !prev);
  };

  const handleToggleCam = async () => {
    await toggleCamera();
    setCamEnabled((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-20">
        <button
          onClick={() => (step === 'live' ? handleEndStream() : navigate(-1))}
          className="text-white/70 hover:text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          {step === 'live' && (
            <>
              <LiveBadge />
              <span className="text-white/60 text-xs font-mono">{formatTime(elapsed)}</span>
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                <Eye size={12} className="text-white/60" />
                <span className="text-white text-xs font-medium">{viewerCount}</span>
              </div>
            </>
          )}
        </div>
        <div className="w-10" />
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative">
        <div ref={videoContainerRef} className="w-full h-full bg-gray-900" />

        {/* Floating hearts */}
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -200, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute bottom-32 pointer-events-none z-50"
              style={{ left: `${h.x}%` }}
            >
              <span className="text-3xl">❤️</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Setup overlay */}
        {step === 'setup' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-6 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-purple-400" />
                <h2 className="text-lg font-bold text-white">Go Live</h2>
              </div>

              <div>
                <label className="text-xs font-medium text-white/60 mb-1 block">Stream Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Braiding tutorial, Fresh fade watch"
                  maxLength={100}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white/60 mb-1 block">Category</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                        category === c
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGoLive}
                disabled={isStarting || !title.trim() || !category}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isStarting ? (
                  <><Loader2 size={16} className="animate-spin" /> Starting...</>
                ) : (
                  <><Radio size={16} /> Go Live</>
                )}
              </button>
            </motion.div>
          </div>
        )}

        {/* Live controls */}
        {step === 'live' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-10">
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={handleToggleCam}
                className={`p-3 rounded-full ${camEnabled ? 'bg-white/20' : 'bg-red-500'} text-white`}
              >
                {camEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button
                onClick={handleToggleMic}
                className={`p-3 rounded-full ${micEnabled ? 'bg-white/20' : 'bg-red-500'} text-white`}
              >
                {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                onClick={handleEndStream}
                disabled={isEnding}
                className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                {isEnding ? <Loader2 size={20} className="animate-spin" /> : <PhoneOff size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
