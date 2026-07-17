import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  CalendarCheck,
  Heart,
  Share2,
  Users,
  MessageSquare,
  Gift,
  Clock,
  Star,
  ArrowRight,
  Repeat,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import type { LiveSession } from "@/domain/live/live.types";

interface LiveEndScreenProps {
  session: LiveSession;
  stylistName?: string;
  stylistImage?: string;
  onRebook?: () => void;
  onFollow?: () => void;
  isFollowing?: boolean;
  className?: string;
}

export function LiveEndScreen({
  session,
  stylistName = "Stylist",
  stylistImage,
  onRebook,
  onFollow,
  isFollowing = false,
  className,
}: LiveEndScreenProps) {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const durationMin = Math.round((session.durationMs || 0) / 60000);
    return [
      { icon: Users, label: "Total Views", value: session.totalViews.toLocaleString(), color: "text-blue-500" },
      { icon: Users, label: "Peak Viewers", value: session.peakViewerCount.toLocaleString(), color: "text-purple-500" },
      { icon: MessageSquare, label: "Messages", value: session.chatMessageCount.toLocaleString(), color: "text-green-500" },
      { icon: Heart, label: "Reactions", value: session.likeCount.toLocaleString(), color: "text-pink-500" },
      { icon: Gift, label: "Gifts", value: session.giftCount.toLocaleString(), color: "text-yellow-500" },
      { icon: Clock, label: "Duration", value: `${durationMin}min`, color: "text-orange-500" },
    ];
  }, [session]);

  return (
    <div
      className={cn(
        "min-h-[80vh] flex items-center justify-center p-4",
        "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950",
        className,
      )}
      role="status"
      aria-label="Live stream ended"
    >
      <div className="w-full max-w-md mx-auto text-center">
        {/* Stylist avatar + name */}
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 mx-auto mb-3 overflow-hidden">
            {stylistImage ? (
              <img src={stylistImage} alt={stylistName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                {stylistName[0]}
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">{stylistName}</h2>
          <p className="text-sm text-gray-400 mt-1">{session.title}</p>
        </div>

        {/* Session ended label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-sm font-medium text-gray-300">Stream Ended</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-2xl bg-white/5 border border-white/5"
            >
              <stat.icon size={16} className={cn(stat.color, "mx-auto mb-1.5")} />
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Rewatch + Follow */}
        {session.replayUrl && (
          <button
            onClick={() => navigate(`/app/live/${session._id}/replay`)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors mb-3"
          >
            <Play size={16} className="text-brand-400" />
            <span className="text-sm font-semibold">Watch Replay</span>
            <ArrowRight size={14} className="ml-auto text-gray-500" />
          </button>
        )}

        {/* Rebook CTA */}
        {onRebook && (
          <Button
            variant="primary"
            size="lg"
            className="w-full mb-3"
            onClick={onRebook}
          >
            <Repeat size={16} />
            Book Again
          </Button>
        )}

        {/* Follow + Share row */}
        <div className="flex gap-3">
          {onFollow && (
            <button
              onClick={onFollow}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                isFollowing
                  ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                  : "bg-brand-500 text-white hover:bg-brand-600",
              )}
            >
              <Star size={14} className={isFollowing ? "fill-yellow-400 text-yellow-400" : ""} />
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: session.title, url: window.location.href });
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 border border-gray-700 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>

        {/* Back to discover */}
        <button
          onClick={() => navigate("/app/live")}
          className="mt-6 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Browse more live streams
        </button>
      </div>
    </div>
  );
}
