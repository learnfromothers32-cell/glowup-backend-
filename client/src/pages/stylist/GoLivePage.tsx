import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  Loader2,
  Eye,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  useLiveSessions,
  useCreateLiveSession,
  useStartLiveSession,
  useEndLiveSession,
} from "../../domain/live/live.hooks";
import { LiveBadge } from "../../features/live/components/LiveBadge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { useAuth } from "../../context/authUtils";
import { cn } from "../../utils/cn";

export default function GoLivePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const { data, isLoading: sessionsLoading } = useLiveSessions({
    stylistId: user?.id,
    sort: "newest",
    limit: 10,
  });

  const createMutation = useCreateLiveSession();
  const startMutation = useStartLiveSession();
  const endMutation = useEndLiveSession();

  const activeSession = data?.sessions?.find(
    (s) => s.status === "live" || s.status === "paused",
  );

  const recentSessions = data?.sessions?.filter(
    (s) => s.status === "ended",
  ) ?? [];

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
    } catch {}
  }, [title, description, category, createMutation]);

  const handleStartLive = useCallback(
    async (sessionId: string) => {
      try {
        const result = await startMutation.mutateAsync(sessionId);
        navigate(`/app/live/${sessionId}`, {
          state: { token: result.token, liveKitUrl: result.liveKitUrl, isHost: true },
        });
      } catch {}
    },
    [startMutation, navigate],
  );

  const handleEndLive = useCallback(
    async (sessionId: string) => {
      await endMutation.mutateAsync(sessionId);
    },
    [endMutation],
  );

  const isSubmitting = createMutation.isPending || startMutation.isPending;

  return (
    <div className="page-container py-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-h3 font-display text-text-primary flex items-center gap-2">
          <Radio size={24} className="text-red-500" />
          Go Live
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Start a live session and connect with your audience
        </p>
      </div>

      {activeSession ? (
        <Card className="border-green-200 dark:border-green-800/30 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
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
                  onClick={() => navigate(`/app/live/${activeSession._id}`)}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start a New Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your live about?"
                className="input-field"
                maxLength={200}
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about your session..."
                className="input-field min-h-[80px] resize-none"
                maxLength={2000}
              />
            </div>

            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="">Select a category</option>
                <option value="Hair Tutorial">Hair Tutorial</option>
                <option value="Styling Tips">Styling Tips</option>
                <option value="Live Q&A">Live Q&A</option>
                <option value="Product Review">Product Review</option>
                <option value="Behind the Scenes">Behind the Scenes</option>
              </select>
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
      )}

      {recentSessions.length > 0 && (
        <section>
          <h2 className="text-h4 font-display text-text-primary mb-3">
            Past Sessions
          </h2>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <Card key={session._id} className="hover:shadow-card transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {session.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{session.viewerCount} viewers</span>
                      <span>{session.chatMessageCount} messages</span>
                      {session.endedAt && (
                        <span>
                          {new Date(session.endedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="badge-gray text-[10px]">Ended</span>
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
  );
}
