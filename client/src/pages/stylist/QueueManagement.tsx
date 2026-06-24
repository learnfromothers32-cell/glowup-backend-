import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  Clock,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  X,
  Timer,
  Hourglass,
  SkipForward,
  Search,
  Play,
  Check,
} from "lucide-react";
import { getQueueStatus, advanceQueue, markQueueDone, skipQueueEntry } from "../../api/queue";
import { useAuth } from "../../context/authUtils";
import { connectQueue, getQueueSocket, subscribeToQueue, unsubscribeFromQueue } from "../../services/socket";
import { Button } from "../../components/ui/Button";

interface QueueEntry {
  userId: string;
  userName?: string;
  position: number;
  status: string;
  estimatedServiceMins: number;
  estimatedWaitMins: number;
  joinedAt: string;
}

interface QueueData {
  id: string;
  stylistId: string;
  currentPosition: number;
  predictedWaitMins: number;
  avgServiceDuration: number;
  entries: QueueEntry[];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtWait(mins: number): string {
  if (mins <= 0) return "Now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function PulseDot({ color = "brand" }: { color?: "brand" | "amber" | "rose" }) {
  const colors: Record<string, string> = {
    brand: "bg-stylist-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[color]}`} />
    </span>
  );
}

function QueueCard({
  entry,
  index,
  onDone,
  onSkip,
  isFirst,
  actionLoading,
}: {
  entry: QueueEntry;
  index: number;
  onDone: (id: string) => void;
  onSkip: (id: string) => void;
  isFirst: boolean;
  actionLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-black/10 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Position */}
          <div className="shrink-0 flex flex-col items-center min-w-[36px]">
            <span className={`text-lg font-black tabular-nums ${isFirst ? "text-stylist-500" : "text-gray-400 dark:text-gray-500"}`}>
              #{entry.position}
            </span>
            <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Queue</span>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-gray-100 dark:bg-gray-700/40 shrink-0 self-center" />

          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            isFirst
              ? "bg-gradient-to-br from-stylist-500 to-stylist-600 text-white shadow-md shadow-stylist-200 dark:shadow-stylist-900/30"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          }`}>
            {entry.userName ? initials(entry.userName) : initials(entry.userId)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {entry.userName || "Customer"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
              <Timer size={10} />
              ~{entry.estimatedServiceMins} min service
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <Clock size={10} />
              Joined {fmtTime(entry.joinedAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-1.5">
            {isFirst && (
              <button
                onClick={() => onDone(entry.userId)}
                disabled={actionLoading === `done-${entry.userId}`}
                aria-label="Mark as done"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-gradient-to-r from-stylist-500 to-stylist-600 text-white text-xs font-bold hover:from-stylist-600 hover:to-stylist-700 disabled:opacity-50 shadow-lg shadow-stylist-200 dark:shadow-stylist-900/30 transition-all min-w-[44px]"
              >
                {actionLoading === `done-${entry.userId}` ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                <span className="hidden sm:inline">Done</span>
              </button>
            )}
            <button
              onClick={() => onSkip(entry.userId)}
              disabled={actionLoading === `skip-${entry.userId}`}
              aria-label="Skip customer"
              className="flex items-center justify-center p-2.5 min-h-[42px] min-w-[42px] rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-stylist-200 hover:text-stylist-500 hover:bg-stylist-50 dark:hover:bg-stylist-900/10 disabled:opacity-50 transition-all"
            >
              {actionLoading === `skip-${entry.userId}` ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <SkipForward size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InServiceCard({
  entry,
  onDone,
  actionLoading,
}: {
  entry: QueueEntry;
  onDone: (id: string) => void;
  actionLoading: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      layout
      className="bg-gradient-to-br from-white to-stylist-50/30 dark:from-surface-dark-secondary dark:to-stylist-900/10 rounded-2xl border-2 border-stylist-200 dark:border-stylist-800/40 overflow-hidden shadow-lg shadow-stylist-100 dark:shadow-stylist-900/20"
    >
      {/* Pulse bar */}
      <div className="h-1 bg-gradient-to-r from-stylist-400 via-stylist-500 to-stylist-600" />

      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stylist-600 dark:text-stylist-400 flex items-center gap-1.5">
            <PulseDot color="brand" />
            In service
          </span>
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
            Since {fmtTime(entry.joinedAt)}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stylist-500 to-stylist-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-stylist-200 dark:shadow-stylist-900/30 shrink-0">
            {entry.userName ? initials(entry.userName) : initials(entry.userId)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">
              {entry.userName || "Customer"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
              <Hourglass size={10} />
              ~{entry.estimatedServiceMins} min estimated
            </p>
          </div>
          <button
            onClick={() => onDone(entry.userId)}
            disabled={actionLoading === `done-${entry.userId}`}
            className="flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-stylist-500 to-stylist-600 text-white text-xs font-bold hover:from-stylist-600 hover:to-stylist-700 disabled:opacity-50 shadow-lg shadow-stylist-200 dark:shadow-stylist-900/30 transition-all"
          >
            {actionLoading === `done-${entry.userId}` ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}
            Complete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function QueueManagement() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const stylistId = (user as any)?.stylistId || "";

  const fetchQueue = useCallback(async () => {
    if (!stylistId) return;
    setError("");
    try {
      const data = await getQueueStatus(stylistId);
      setQueue(data.queue);
    } catch {
      setError("Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [stylistId]);

  useEffect(() => {
    if (!stylistId) return;
    fetchQueue();
    connectQueue();
    subscribeToQueue(stylistId);
    const handleUpdate = (data: any) => {
      if (data?.stylistId === stylistId) setQueue(data);
    };
    const sock = getQueueSocket();
    sock.on("queue:update", handleUpdate);
    return () => {
      unsubscribeFromQueue(stylistId);
      sock.off("queue:update", handleUpdate);
    };
  }, [stylistId, fetchQueue]);

  const handleAdvance = async () => {
    setActionLoading("advance");
    try {
      await advanceQueue(stylistId);
      await fetchQueue();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to advance queue");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDone = async (entryUserId: string) => {
    setActionLoading(`done-${entryUserId}`);
    try {
      await markQueueDone(stylistId, entryUserId);
      await fetchQueue();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark as done");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (entryUserId: string) => {
    setActionLoading(`skip-${entryUserId}`);
    try {
      await skipQueueEntry(stylistId, entryUserId);
      await fetchQueue();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to skip entry");
    } finally {
      setActionLoading(null);
    }
  };

  const waiting = queue?.entries?.filter((e) => e.status === "waiting") || [];
  const inService = queue?.entries?.filter((e) => e.status === "in-service") || [];
  const hasInService = inService.length > 0;

  const filteredWaiting = waiting.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (e.userName || "Customer").toLowerCase().includes(q);
  });

  const isEmpty = waiting.length === 0 && !hasInService;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark-tertiary">
      {/* Background decorations */}
      <div className="relative">
        <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-gradient-to-bl from-stylist-50/30 to-transparent dark:from-stylist-900/10 pointer-events-none" />
        <div className="absolute top-40 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-stylist-50/20 to-transparent dark:from-stylist-900/5 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 pb-20">
          {/* Header */}
          <div className="pt-14 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">Queue Management</p>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  Customer <span className="bg-gradient-to-r from-stylist-500 to-stylist-500 bg-clip-text text-transparent">Queue</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 shadow-sm">
                  <Users size={15} className="text-stylist-500" />
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{waiting.length}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">waiting</span>
                </div>
                {queue?.predictedWaitMins != null && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 shadow-sm">
                    <Hourglass size={15} className="text-amber-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{fmtWait(queue.predictedWaitMins)}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">avg wait</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <AlertTriangle size={15} className="text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Error</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
                </div>
                <button onClick={() => setError("")} className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors">
                  <X size={14} className="text-rose-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 skeleton-pulse" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-6 shadow-inner">
                <Users size={36} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Queue is empty</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[300px] leading-relaxed">
                Customers you add to your queue will appear here. They'll flow from waiting → in service → done.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* In Service */}
              {hasInService && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-stylist-50 dark:bg-stylist-900/30 flex items-center justify-center">
                      <UserCheck size={12} className="text-stylist-600 dark:text-stylist-400" />
                    </div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Now serving</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-stylist-200 dark:from-stylist-800/50 to-transparent" />
                    <span className="text-[10px] font-bold text-stylist-600 dark:text-stylist-400 bg-stylist-50 dark:bg-stylist-900/20 px-2 py-0.5 rounded-full border border-stylist-200 dark:border-stylist-800/30">
                      {inService.length}
                    </span>
                  </div>
                  {inService.map((entry) => (
                    <InServiceCard
                      key={entry.userId}
                      entry={entry}
                      onDone={handleDone}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              )}

              {/* Waiting list */}
              {waiting.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-stylist-50 dark:bg-stylist-900/20 flex items-center justify-center">
                        <Clock size={12} className="text-stylist-600 dark:text-stylist-400" />
                      </div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Waiting list</h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent" />
                      <span className="text-[10px] font-bold text-stylist-600 dark:text-stylist-400 bg-stylist-50 dark:bg-stylist-900/20 px-2 py-0.5 rounded-full border border-stylist-200 dark:border-stylist-800/30">
                        {waiting.length}
                      </span>
                    </div>
                    {waiting.length >= 2 && (
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search customers…"
                          className="w-36 sm:w-44 pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-700/40 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-stylist-300 dark:focus:border-stylist-700 focus:ring-2 focus:ring-stylist-50 dark:focus:ring-stylist-900/20 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                      {filteredWaiting.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-sm text-gray-400 dark:text-gray-500">No customers match your search</p>
                        </div>
                      ) : (
                        filteredWaiting.map((entry, i) => (
                          <QueueCard
                            key={entry.userId}
                            entry={entry}
                            index={i}
                            onDone={handleDone}
                            onSkip={handleSkip}
                            isFirst={i === 0}
                            actionLoading={actionLoading}
                          />
                        ))
                      )}
                    </div>
                  </AnimatePresence>
                </div>
              )}

              {/* Call next button */}
              {!hasInService && waiting.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2"
                >
                  <button
                    onClick={handleAdvance}
                    disabled={actionLoading === "advance"}
                    className="w-full flex items-center justify-center gap-2.5 py-4 min-h-[52px] rounded-2xl bg-gradient-to-r from-stylist-500 to-stylist-500 text-white font-bold text-sm hover:from-stylist-600 hover:to-stylist-600 disabled:opacity-50 shadow-xl shadow-stylist-200 dark:shadow-stylist-900/30 transition-all"
                  >
                    {actionLoading === "advance" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Play size={16} className="fill-white" />
                    )}
                    Call next customer
                    <ArrowRight size={16} />
                  </button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                    Press to call the first person in the waiting list
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
