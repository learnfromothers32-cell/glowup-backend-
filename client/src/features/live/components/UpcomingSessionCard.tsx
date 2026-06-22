import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Bell, BellOff, BadgeCheck } from "lucide-react";
import type { UpcomingSession } from "../types/live.types";

interface Props {
  session: UpcomingSession;
  onRemind: (id: string) => void;
}

export function UpcomingSessionCard({ session, onRemind }: Props) {
  const navigate = useNavigate();
  const scheduledDate = new Date(session.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = scheduledDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm hover:shadow-md transition-all duration-200 p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/app/stylist/${session.host.id}`); }}
          className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs font-semibold text-text-secondary dark:text-text-dark-primary cursor-pointer hover:opacity-80 transition-opacity"
        >
          {session.host.name.charAt(0).toUpperCase()}
        </button>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">
            {session.title}
          </h4>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/app/stylist/${session.host.id}`); }}
            className="flex items-center gap-1 mt-0.5 cursor-pointer"
          >
            <span className="text-xs text-text-secondary dark:text-text-dark-muted truncate hover:underline">
              {session.host.name}
            </span>
            {session.host.isVerified && (
              <BadgeCheck size={12} className="text-blue-500 shrink-0" />
            )}
          </button>
          <span className="text-[11px] text-text-muted dark:text-text-dark-secondary capitalize mt-0.5 block">
            {session.category}
          </span>
        </div>
        <button
          onClick={() => onRemind(session.id)}
          className="shrink-0 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
          title={session.reminder ? "Remove reminder" : "Set reminder"}
        >
          {session.reminder ? (
            <BellOff size={16} className="text-text-muted dark:text-text-dark-muted" />
          ) : (
            <Bell size={16} className="text-text-muted dark:text-text-dark-muted" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/40">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-text-dark-muted">
          <Calendar size={14} />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-text-dark-muted">
          <Clock size={14} />
          <span>
            {timeStr} · {session.durationMinutes}m
          </span>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs text-text-secondary dark:text-text-dark-muted line-clamp-2">
          {session.description}
        </p>
      </div>
    </div>
  );
}
