import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, X, CheckCircle, Bell, Timer, AlertTriangle, Loader2, ChevronRight, Info, Search, Zap, ArrowRight } from "lucide-react";
import { useMyBookings, useCancelBookingMutation } from "@/domain/booking/booking.hooks";
import { fmtDate, fmtDateFull, fmtISO, initials, todayStr } from "@/domain/booking/components/StatusBadge";
import { StatCard, EmptyState, Toast } from "@/domain/booking/components/SharedUI";
import CancelModal from "@/domain/booking/components/CancelModal";
import { connectQueue, disconnectQueue, subscribeToQueue, getMyQueueStatus, getQueueSocket } from "@/services/socket";
import type { Booking } from "@/domain/booking/booking.types";

type FilterKey = "all" | "upcoming" | "today" | "cancelled";

interface QueueEntry {
  userId: string;
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
  entries: QueueEntry[];
}

function fmtEndTime(iso: string, dur: number) {
  const d = new Date(iso);
  const total = d.getHours() * 60 + d.getMinutes() + dur;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  const ampm = nh >= 12 ? "PM" : "AM";
  const h12 = nh % 12 || 12;
  return `${h12}:${String(nm).padStart(2, "0")} ${ampm}`;
}

function fmtWait(mins: number): string {
  if (mins <= 0) return "Ready now";
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

function QueueBadge({ position, size = "sm" }: { position: number; size?: "sm" | "lg" }) {
  const dims = size === "lg" ? "w-16 h-16" : "w-11 h-11";
  const numSize = size === "lg" ? "text-2xl" : "text-base";

  return (
    <div className={`${dims} rounded-2xl flex flex-col items-center justify-center shrink-0 bg-brand-500 shadow-lg shadow-brand-200 dark:shadow-brand-900/30`}>
      <span className={`text-[8px] font-bold uppercase tracking-wider text-white/80`}>Queue</span>
      <span className={`${numSize} font-black tabular-nums leading-none text-white`}>#{position}</span>
    </div>
  );
}

function StatusBadgeInline({ status }: { status: string }) {
  if (status === "cancelled")
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[10px] font-bold"><X size={10} />Cancelled</span>;
  if (status === "confirmed" || status === "in-progress") {
    const isActive = status === "in-progress";
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-sky-50 text-sky-600"}`}>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {isActive ? "Active" : "Confirmed"}
    </span>;
  }
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-text-muted dark:text-text-dark-muted text-[10px] font-bold">{status}</span>;
}

function HeroCard({ booking, queueData, onView }: { booking: Booking; queueData?: QueueEntry | null; onView: () => void }) {
  const isToday = fmtDate(new Date(booking.startTime)) === "Today";
  const isNext = queueData?.position === 1;
  const stylistName = typeof booking.stylistId === "object" ? (booking.stylistId as any).name || "Stylist" : "Stylist";
  const serviceName = typeof booking.serviceId === "object" ? (booking.serviceId as any).name || "Service" : "Service";
  const duration = typeof booking.serviceId === "object" ? (booking.serviceId as any).duration || 30 : 30;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={onView}
      className="relative bg-white dark:bg-surface-dark-secondary rounded-3xl border border-gray-100 dark:border-gray-700/40 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 mb-6 group">
      <div className={`absolute inset-x-0 top-0 h-1.5 ${isNext ? "bg-gradient-to-r from-emerald-400 to-green-500" : isToday ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-sky-400 to-blue-500"}`} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isNext ? "bg-emerald-50" : isToday ? "bg-amber-50" : "bg-sky-50"}`}>
              <Zap size={16} className={isNext ? "text-emerald-500" : isToday ? "text-amber-500" : "text-sky-500"} />
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isNext ? "text-emerald-600" : isToday ? "text-amber-600" : "text-sky-600"}`}>
                {isNext ? "You're next!" : isToday ? "Live now" : "Next appointment"}
              </span>
              <p className="text-[11px] text-text-muted dark:text-text-dark-muted mt-0.5">{isNext ? "Get ready, you're up!" : isToday ? "Your appointment is today" : "Upcoming booking"}</p>
            </div>
          </div>
          <StatusBadgeInline status={booking.status} />
        </div>

        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-0.5">{stylistName}</h2>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-3">{serviceName}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Calendar, text: fmtDateFull(booking.startTime) },
                { icon: Clock, text: fmtISO(booking.startTime) },
                { icon: Timer, text: `~${queueData ? queueData.estimatedServiceMins : duration}m` },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary text-xs text-text-secondary dark:text-text-dark-secondary font-medium">
                  <Icon size={12} className="text-text-muted dark:text-text-dark-muted" />{text}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
            {queueData ? (
              <>
                <QueueBadge position={queueData.position} size="lg" />
                {isNext && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-xl">Go now</span>}
              </>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary flex items-center justify-center text-gray-300"><Clock size={24} /></div>
            )}
          </div>
        </div>

          {queueData && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(10, 100 - (queueData.position - 1) * 20)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${isNext ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-amber-400 to-orange-400"}`} />
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${isNext ? "text-emerald-600" : "text-amber-600"}`}>{fmtWait(queueData.estimatedWaitMins)}</span>
                    </div>
                    <p className={`text-[11px] mt-1.5 ${isNext ? "text-emerald-600" : "text-amber-600"}`}>
                      {queueData.estimatedWaitMins <= 0 ? "You're up next! Ready to go?" : `${queueData.position - 1} ${queueData.position - 1 === 1 ? "person" : "people"} ahead of you`}
                    </p>
                  </div>
                )}
      </div>
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-gray-50 dark:from-surface-dark-tertiary to-white dark:to-surface-dark-secondary border-t border-gray-100 dark:border-gray-700/40">
        <span className="text-xs text-text-muted dark:text-text-dark-muted font-medium">Tap for full details</span>
        <div className="flex items-center gap-1 text-xs font-medium text-text-muted dark:text-text-dark-muted group-hover:text-text-primary dark:group-hover:text-text-dark-primary transition-colors">
          <span>View</span>
          <ArrowRight size={12} />
        </div>
      </div>
    </motion.div>
  );
}

function BookingRow({ booking, queueData, onView, onCancel, index }: {
  booking: Booking; queueData?: QueueEntry | null; onView: () => void; onCancel: () => void; index: number;
}) {
  const isToday = fmtDate(new Date(booking.startTime)) === "Today";
  const isCancelled = booking.status === "cancelled";
  const stylistName = typeof booking.stylistId === "object" ? (booking.stylistId as any).name || "Stylist" : "Stylist";
  const serviceName = typeof booking.serviceId === "object" ? (booking.serviceId as any).name || "Service" : "Service";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} onClick={onView}
      className={`group relative bg-white dark:bg-surface-dark-secondary rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 ${isCancelled ? "border-red-100 opacity-60" : isToday ? "border-emerald-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50" : "border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:border-gray-600 hover:shadow-lg hover:shadow-gray-50"}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCancelled ? "bg-red-400" : isToday ? "bg-emerald-400" : "bg-gray-200"}`} />
      <div className="flex items-center gap-4 p-4 pl-5">
        <div className="shrink-0 w-14 text-center">
          <p className="text-lg font-black text-text-primary dark:text-text-dark-primary tabular-nums leading-none">{fmtISO(booking.startTime).split(" ")[0]}</p>
          <p className="text-[10px] text-text-muted dark:text-text-dark-muted font-semibold mt-0.5">{fmtISO(booking.startTime).split(" ")[1]}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-semibold truncate ${isCancelled ? "text-text-muted dark:text-text-dark-muted line-through" : "text-text-primary dark:text-text-dark-primary"}`}>{stylistName}</p>
            <StatusBadgeInline status={booking.status} />
          </div>
          <p className="text-xs text-text-muted dark:text-text-dark-muted truncate">{serviceName}</p>
          {queueData && !isCancelled && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${queueData.estimatedWaitMins <= 5 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                <Timer size={10} />{fmtWait(queueData.estimatedWaitMins)}
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          {queueData && <QueueBadge position={queueData.position} />}
          {!isCancelled && (
            <button onClick={(e) => { e.stopPropagation(); onCancel(); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-[11px] font-semibold text-text-muted dark:text-text-dark-muted hover:border-red-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <X size={10} /> Cancel
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailModal({ booking, queueData, onClose, onCancel }: {
  booking: Booking; queueData?: QueueEntry | null; onClose: () => void; onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isToday = fmtDate(new Date(booking.startTime)) === "Today";
  const isNext = queueData?.position === 1;
  const cancelled = booking.status === "cancelled";
  const stylistName = typeof booking.stylistId === "object" ? (booking.stylistId as any).name || "Stylist" : "Stylist";
  const serviceName = typeof booking.serviceId === "object" ? (booking.serviceId as any).name || "Service" : "Service";
  const price = typeof booking.serviceId === "object" ? (booking.serviceId as any).price || booking.totalPrice : booking.totalPrice;
  const duration = typeof booking.serviceId === "object" ? (booking.serviceId as any).duration || 30 : 30;

  const handleCopy = () => { navigator.clipboard.writeText(booking._id); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }} onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-white dark:bg-surface-dark-secondary rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className={`h-1.5 ${isNext ? "bg-gradient-to-r from-emerald-400 to-green-500" : isToday ? "bg-gradient-to-r from-amber-400 to-orange-400" : cancelled ? "bg-gradient-to-r from-red-400 to-red-300" : "bg-gradient-to-r from-sky-400 to-blue-500"}`} />
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold ${cancelled ? "bg-gray-100 text-text-muted dark:text-text-dark-muted" : "bg-gray-900 text-white dark:bg-surface-dark-secondary dark:text-gray-900"}`}>
              {initials(stylistName)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">{stylistName}</h2>
              <p className="text-sm text-text-muted dark:text-text-dark-muted">{serviceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isToday && !cancelled && queueData && (
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/40">
                <div className={`p-5 rounded-2xl ${isNext ? "bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200" : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <QueueBadge position={queueData.position} />
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isNext ? "text-emerald-600" : "text-amber-600"}`}>
                        {isNext ? "You're next!" : "Queue status"}
                      </span>
                      <p className={`text-[11px] mt-0.5 ${isNext ? "text-emerald-500" : "text-amber-500"}`}>
                        {queueData.estimatedWaitMins <= 0 ? "Ready to go!" : `${queueData.position - 1} ahead`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xl font-black tabular-nums ${isNext ? "text-emerald-600" : "text-amber-600"}`}>{fmtWait(queueData.estimatedWaitMins)}</span>
                </div>
                <div className="h-2.5 bg-white dark:bg-surface-dark-secondary/70 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(15, 100 - (queueData.position - 1) * 20)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${isNext ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-amber-400 to-orange-400"}`} />
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-4">
            <div className="bg-gray-50 dark:bg-surface-dark-tertiary rounded-2xl p-4 space-y-3">
              {[
                { label: "Date", value: fmtDateFull(booking.startTime) },
                { label: "Time", value: `${fmtISO(booking.startTime)} – ${fmtEndTime(booking.startTime, duration)}` },
                { label: "Duration", value: `${duration} min` },
                { label: "Price", value: `$${price}.00` },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? "pb-3 border-b border-white/80" : ""}`}>
                  <span className="text-sm text-text-muted dark:text-text-dark-muted font-medium">{label}</span>
                  <span className="text-sm font-semibold text-text-primary dark:text-text-dark-primary text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-dark-muted mb-0.5">Booking ID</p>
                <p className="text-xs font-mono text-text-secondary dark:text-text-dark-secondary">{booking._id.slice(0, 12)}…</p>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-semibold text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-all">
                {copied ? <><CheckCircle size={12} className="text-emerald-500" /> Copied</> : "Copy"}
              </button>
            </div>
          </div>

          <div className="px-6 py-3">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Info size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800">Cancellation policy</p>
                <p className="text-xs text-amber-600 mt-1 leading-relaxed">Free cancellation up to 24 hours before. Late cancellations incur a 50% fee.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700/40 shrink-0 bg-gray-50 dark:bg-surface-dark-tertiary/50">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-text-secondary dark:text-text-dark-secondary hover:bg-white dark:hover:bg-surface-dark-secondary transition-colors">Close</button>
          {!cancelled && (
            <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-red-400 text-sm font-bold text-white hover:from-red-600 hover:to-red-500 shadow-lg shadow-red-200 transition-all">Cancel</button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function QueueScreen() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const cancelMutation = useCancelBookingMutation();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [queues, setQueues] = useState<Record<string, QueueData>>({});

  const today = todayStr();

  const flash = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  useEffect(() => {
    connectQueue();
    const stylistIds = [...new Set(bookings.map((b) => {
      const sid = typeof b.stylistId === "object" ? (b.stylistId as any)._id : b.stylistId;
      return typeof sid === "string" ? sid : "";
    }).filter(Boolean))];
    stylistIds.forEach((sid) => { subscribeToQueue(sid); getMyQueueStatus(sid); });
    return () => { disconnectQueue(); };
  }, [bookings]);

  useEffect(() => {
    const sock = getQueueSocket();
    const handleUpdate = (data: QueueData) => setQueues((prev) => ({ ...prev, [data.stylistId]: data }));
    const handleStatus = (data: { queue: QueueData | null }) => { if (data.queue) setQueues((prev) => ({ ...prev, [data.queue.stylistId]: data.queue })); };
    sock.on("queue:update", handleUpdate);
    sock.on("queue:status", handleStatus);
    return () => { sock.off("queue:update", handleUpdate); sock.off("queue:status", handleStatus); };
  }, []);

  const counts = useMemo(() => ({
    all: bookings.length,
    today: bookings.filter((b) => (b.status === "confirmed" || b.status === "in-progress") && new Date(b.startTime).toISOString().split("T")[0] === today).length,
    upcoming: bookings.filter((b) => (b.status === "confirmed" || b.status === "in-progress") && new Date(b.startTime) >= new Date(today)).length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }), [bookings, today]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (filter === "today") list = list.filter((b) => (b.status === "confirmed" || b.status === "in-progress") && new Date(b.startTime).toISOString().split("T")[0] === today);
    else if (filter === "upcoming") list = list.filter((b) => (b.status === "confirmed" || b.status === "in-progress") && new Date(b.startTime) >= new Date(today));
    else if (filter === "cancelled") list = list.filter((b) => b.status === "cancelled");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        const name = typeof b.stylistId === "object" ? (b.stylistId as any).name || "" : "";
        const svcName = typeof b.serviceId === "object" ? (b.serviceId as any).name || "" : "";
        return name.toLowerCase().includes(q) || svcName.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings, filter, search, today]);

  const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "in-progress");
  const todayBookings = upcoming.filter((b) => new Date(b.startTime).toISOString().split("T")[0] === today);
  const heroBooking = todayBookings.length > 0 ? todayBookings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0] : upcoming[0];

  const handleCancel = useCallback(async () => {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget._id);
    try {
      await cancelMutation.mutateAsync(cancelTarget._id);
      flash("Appointment cancelled");
    } catch { flash("Failed to cancel appointment"); }
    finally { setCancellingId(null); setCancelTarget(null); }
  }, [cancelTarget, cancelMutation]);

  const grouped = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    filtered.forEach((b) => {
      const key = fmtDate(new Date(b.startTime));
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return Object.entries(groups);
  }, [filtered]);

  const getQueueForBooking = (booking: Booking): QueueEntry | null | undefined => {
    const stylistId = typeof booking.stylistId === "object" ? (booking.stylistId as any)._id : booking.stylistId;
    const q = queues[stylistId];
    if (!q) return null;
    return q.entries.find((e) => e.userId === (typeof booking.clientId === "object" ? (booking.clientId as any)?._id : booking.clientId)) || null;
  };

  const statCards = [
    { label: "Today", value: counts.today, icon: Zap, color: { bg: "bg-gradient-to-br from-emerald-50 to-green-50", text: "text-emerald-600", icon: "text-emerald-500", border: "border-emerald-200" } },
    { label: "Upcoming", value: counts.upcoming, icon: Calendar, color: { bg: "bg-gradient-to-br from-sky-50 to-blue-50", text: "text-sky-600", icon: "text-sky-500", border: "border-sky-200" } },
    { label: "Cancelled", value: counts.cancelled, icon: X, color: { bg: "bg-gradient-to-br from-red-50 to-rose-50", text: "text-red-500", icon: "text-red-400", border: "border-red-200" } },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-surface-dark-secondary">
      <div className="bg-gradient-to-b from-gray-50 dark:from-surface-dark-tertiary to-white dark:to-surface-dark-secondary">
        <div className="max-w-3xl mx-auto px-5 pt-12 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted dark:text-text-dark-muted mb-1.5">My Schedule</p>
              <h1 className="text-3xl font-black text-text-primary dark:text-text-dark-primary tracking-tight">Queue & Appointments</h1>
            </div>
            <button className="w-11 h-11 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary hover:border-gray-300 hover:shadow-md transition-all">
              <Bell size={20} />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[200, 96, 96, 96].map((h, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 skeleton-pulse" style={{ height: h }} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {statCards.map((s) => (
                  <div key={s.label} className={`bg-white dark:bg-surface-dark-secondary rounded-2xl border ${s.color.border || "border-gray-100 dark:border-gray-700/40"} p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color.bg}`}>
                        <s.icon size={18} className={s.color.icon} />
                      </div>
                      <span className={`text-2xl font-black tabular-nums ${s.color.text}`}>{s.value}</span>
                    </div>
                    <p className="text-xs font-semibold text-text-muted dark:text-text-dark-muted">{s.label}</p>
                  </div>
                ))}
              </div>

              {heroBooking && filter !== "cancelled" && (
                <HeroCard booking={heroBooking} queueData={getQueueForBooking(heroBooking)} onView={() => setDetailBooking(heroBooking)} />
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
                  {[ 
                    { key: "all" as FilterKey, label: "All" },
                    { key: "today" as FilterKey, label: "Today" },
                    { key: "upcoming" as FilterKey, label: "Upcoming" },
                    { key: "cancelled" as FilterKey, label: "Cancelled" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilter(key)}
                      className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === key ? "bg-gray-900 text-white shadow-lg shadow-gray-200 dark:bg-surface-dark-secondary dark:text-gray-900" : "bg-gray-50 dark:bg-surface-dark-tertiary text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"}`}>
                      {label}
                      {counts[key] > 0 && <span className={`text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full inline-flex items-center justify-center ${filter === key ? "bg-white dark:bg-surface-dark-secondary/20 text-white" : "bg-gray-200 text-text-secondary dark:text-text-dark-secondary"}`}>{counts[key]}</span>}
                    </button>
                  ))}
                </div>
                <div className="relative shrink-0">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search appointments…"
                    className="w-full sm:w-56 pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-600 text-sm text-text-primary dark:text-text-dark-primary placeholder:text-text-muted dark:placeholder:text-text-dark-muted outline-none focus:border-gray-300 focus:bg-white dark:bg-surface-dark-secondary focus:ring-2 focus:ring-gray-100 transition-all" />
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState icon={Calendar} title="No bookings yet" sub="Your appointments will appear here once you book a stylist." />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={`${filter}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    {grouped.map(([dateLabel, items]) => (
                      <div key={dateLabel} className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted dark:text-text-dark-muted">{dateLabel}</h3>
                          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                          <span className="text-[10px] font-bold text-gray-300 bg-gray-50 dark:bg-surface-dark-tertiary px-2 py-0.5 rounded-full">{items.length}</span>
                        </div>
                        <div className="space-y-2.5">
                          {items.map((b, i) => (
                            <BookingRow key={b._id} booking={b} queueData={getQueueForBooking(b)} onView={() => setDetailBooking(b)} onCancel={() => setCancelTarget(b)} index={i} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {detailBooking && (
          <DetailModal booking={detailBooking} queueData={getQueueForBooking(detailBooking)} onClose={() => setDetailBooking(null)}
            onCancel={() => { setCancelTarget(detailBooking); setDetailBooking(null); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal booking={cancelTarget} onConfirm={handleCancel} onClose={() => setCancelTarget(null)} loading={cancellingId === cancelTarget._id} />
        )}
      </AnimatePresence>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
