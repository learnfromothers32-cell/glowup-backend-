import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
  Eye,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Calendar,
  ChevronRight,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  useLiveSessions,
  useCreateLiveSession,
  useStartLiveSession,
  useEndLiveSession,
} from "../../domain/live/live.hooks";
import { LiveBadge } from "../../features/live/components/LiveBadge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { useAuth } from "../../context/authUtils";
import { useToast } from "../../components/ui/Toast";
import { cn } from "../../utils/cn";

const CATEGORIES = [
  "Hair Tutorial",
  "Styling Tips",
  "Live Q&A",
  "Product Review",
  "Behind the Scenes",
];

export default function GoLivePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [cameraPreview, setCameraPreview] = useState(false);
  const [previewCameraOn, setPreviewCameraOn] = useState(true);
  const [previewMicOn, setPreviewMicOn] = useState(true);

  const { data, isLoading: sessionsLoading } = useLiveSessions({
    hostUserId: user?.id,
    sort: "newest",
    limit: 10,
  });

  const createMutation = useCreateLiveSession();
  const startMutation = useStartLiveSession();
  const endMutation = useEndLiveSession();

  const activeSession = data?.sessions?.find(
    (s) => s.status === "live" || s.status === "paused",
  );
  const recentSessions = data?.sessions?.filter((s) => s.status === "ended") ?? [];

  // Camera preview
  useEffect(() => {
    if (!cameraPreview) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setCameraPreview(false);
        toast("error", "Camera access denied", "Please allow camera access to preview your stream");
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraPreview]);

  const handleCreateSession = useCallback(async () => {
    if (!title.trim()) return;
    try {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
      });
      setTitle("");
      setDescription("");
      setCategory("");
      return result;
    } catch (error) {
      toast("error", "Failed to create session", error instanceof Error ? error.message : "Please try again");
    }
  }, [title, description, category, createMutation, toast]);

  const handleStartLive = useCallback(
    async (sessionId: string) => {
      try {
        const result = await startMutation.mutateAsync(sessionId);
        // Stop preview before navigating
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        navigate(`/stylist/live/${sessionId}`, {
          state: { token: result.token, liveKitUrl: result.liveKitUrl, isHost: true },
        });
      } catch (error) {
        toast("error", "Failed to start live session", error instanceof Error ? error.message : "Please try again");
      }
    },
    [startMutation, navigate, toast],
  );

  const handleEndLive = useCallback(
    async (sessionId: string) => {
      try {
        await endMutation.mutateAsync(sessionId);
        navigate("/stylist/go-live");
      } catch (error) {
        toast("error", "Failed to end live session", error instanceof Error ? error.message : "Please try again");
      }
    },
    [endMutation, navigate, toast],
  );

  const isSubmitting = createMutation.isPending || startMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-red-500/20 backdrop-blur-sm">
              <Radio size={20} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold">Go Live</h1>
              <p className="text-sm text-white/50 mt-0.5">
                Connect with your audience in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-12">
        {activeSession ? (
          /* Active Session Card */
          <Card className="mb-6 border-green-200 dark:border-green-800/30 bg-green-50/50 dark:bg-green-900/10 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <LiveBadge />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      Active Session
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {activeSession.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {activeSession.viewerCount} viewers
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Started{" "}
                      {activeSession.startedAt
                        ? new Date(activeSession.startedAt).toLocaleTimeString()
                        : "just now"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={startMutation.isPending}
                    onClick={async () => {
                      try {
                        const result = await startMutation.mutateAsync(activeSession._id);
                        navigate(`/stylist/live/${activeSession._id}`, {
                          state: { token: result.token, liveKitUrl: result.liveKitUrl, isHost: true },
                        });
                      } catch (error) {
                        toast("error", "Failed to reconnect", error instanceof Error ? error.message : "Please try again");
                      }
                    }}
                  >
                    <Video size={14} />
                    Go to Stream
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={endMutation.isPending}
                    onClick={() => handleEndLive(activeSession._id)}
                  >
                    End
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Go Live Setup */
          <div className="space-y-4">
            {/* Camera Preview */}
            <Card className="overflow-hidden shadow-lg">
              <div className="relative aspect-video bg-gray-900">
                {cameraPreview ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                    {/* Preview controls */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <button
                        onClick={() => setPreviewCameraOn(!previewCameraOn)}
                        className={cn(
                          "p-2.5 rounded-full transition-all",
                          previewCameraOn
                            ? "bg-white/20 text-white backdrop-blur-sm"
                            : "bg-red-500 text-white"
                        )}
                        aria-label={previewCameraOn ? "Turn camera off" : "Turn camera on"}
                      >
                        {previewCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
                      </button>
                      <button
                        onClick={() => setPreviewMicOn(!previewMicOn)}
                        className={cn(
                          "p-2.5 rounded-full transition-all",
                          previewMicOn
                            ? "bg-white/20 text-white backdrop-blur-sm"
                            : "bg-red-500 text-white"
                        )}
                        aria-label={previewMicOn ? "Mute microphone" : "Unmute microphone"}
                      >
                        {previewMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                      </button>
                      <button
                        onClick={() => setCameraPreview(false)}
                        className="p-2.5 rounded-full bg-white/20 text-white backdrop-blur-sm"
                        aria-label="Close preview"
                      >
                        <VideoOff size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setCameraPreview(true)}
                    className="absolute inset-0 flex flex-col items-center justify-center text-white/60 hover:text-white/80 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                      <Video size={24} />
                    </div>
                    <span className="text-sm font-medium">Preview Camera</span>
                    <span className="text-xs text-white/40 mt-1">See how you'll look on stream</span>
                  </button>
                )}
              </div>
            </Card>

            {/* Session Setup */}
            <Card className="shadow-lg">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Stream Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's your live about?"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers what to expect..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
                    maxLength={2000}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(category === cat ? "" : cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                          category === cat
                            ? "bg-brand-500 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {createMutation.isError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">
                    <AlertCircle size={14} />
                    Failed to create session. Please try again.
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  disabled={!title.trim()}
                  className="w-full"
                  onClick={async () => {
                    const result = await handleCreateSession();
                    if (result?.session) {
                      handleStartLive(result.session._id);
                    }
                  }}
                >
                  <Radio size={16} />
                  Go Live Now
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Dashboard */}
        {recentSessions.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-500" />
              Performance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                icon={Eye}
                label="Total Views"
                value={recentSessions.reduce((a, s) => a + s.peakViewerCount, 0).toLocaleString()}
              />
              <StatCard
                icon={Users}
                label="Total Sessions"
                value={String(recentSessions.length)}
              />
              <StatCard
                icon={DollarSign}
                label="Bookings"
                value={String(recentSessions.reduce((a, s) => a + (s.bookingCount || 0), 0))}
              />
              <StatCard
                icon={ShoppingBag}
                label="Messages"
                value={recentSessions.reduce((a, s) => a + s.chatMessageCount, 0).toLocaleString()}
              />
            </div>
          </section>
        )}

        {/* Past Sessions */}
        {recentSessions.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              Past Sessions
            </h2>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <Card key={session._id} className="hover:shadow-card transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye size={11} /> {session.peakViewerCount} peak
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={11} /> {session.viewerCount} viewers
                          </span>
                          <span className="flex items-center gap-1">
                            💬 {session.chatMessageCount}
                          </span>
                          {session.bookingCount > 0 && (
                            <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium">
                              📅 {session.bookingCount} bookings
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="badge-gray text-[10px]">
                          {session.endedAt
                            ? new Date(session.endedAt).toLocaleDateString()
                            : "Ended"}
                        </span>
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {sessionsLoading && (
          <div className="text-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-400 mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-gray-400" />
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
