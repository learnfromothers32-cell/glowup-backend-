import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, CalendarClock, CalendarX, CheckCircle, Search, Calendar, Star, X, RotateCcw, Loader2, Clock, AlertTriangle } from "lucide-react";
import { useMyBookings, useCancelBookingMutation, useRescheduleBookingMutation } from "@/domain/booking/booking.hooks";
import { fmtDate, fmtTime, fmtISO, initials, todayStr, getLocationString, generateDates, fmtSlot } from "@/domain/booking/components/StatusBadge";
import { StatCard, EmptyState, FilterPills, Toast } from "@/domain/booking/components/SharedUI";
import CancelModal from "@/domain/booking/components/CancelModal";
import BookingDetailModal from "@/domain/booking/components/BookingDetailModal";
import RescheduleModal from "@/domain/booking/components/RescheduleModal";
import ReviewModal from "@/domain/booking/components/ReviewModal";
import { createReview } from "@/api/reviews";
import { useGamification } from "@/hooks/useGamification";
import { connectQueue, disconnectQueue, subscribeToQueue, getMyQueueStatus, getQueueSocket, onBookingStatusChanged, offBookingStatusChanged } from "@/services/socket";
import type { Booking } from "@/domain/booking/booking.types";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

type FilterKey = "all" | "today" | "upcoming" | "past" | "cancelled";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

function BookingStatusBadge({ status, date }: { status: string; date?: string }) {
  if (status === "cancelled")
    return <Badge variant="error" pill><X size={8} /> Cancelled</Badge>;
  if (status === "pending")
    return <Badge variant="warning" pill><Clock size={8} /> Pending</Badge>;
  if (status === "in-progress")
    return <Badge variant="success" pill><Loader2 size={8} className="animate-spin" /> In Progress</Badge>;
  if (status === "completed")
    return <Badge variant="gray" pill><CheckCircle size={8} /> Completed</Badge>;
  if (date) {
    const isToday = fmtDate(date) === "Today";
    const isPast = new Date(date + "T00:00:00") < new Date();
    if (isToday)
      return <Badge variant="success" pill><span className="w-1 h-1 rounded-full bg-green-500 animate-pulse mr-1" /> Today</Badge>;
    if (isPast)
      return <Badge variant="gray" pill><CheckCircle size={8} /> Done</Badge>;
  }
  return <Badge variant="info" pill><AlertTriangle size={8} /> {status}</Badge>;
}

function BookingRow({
  booking,
  filterKey,
  queueData,
  onCancel,
  onReschedule,
  onReview,
  onView,
  actionLoading,
}: {
  booking: Booking;
  filterKey: FilterKey;
  queueData?: { position: number; estimatedServiceMins: number } | null;
  onCancel: () => void;
  onReschedule: () => void;
  onReview: () => void;
  onView: () => void;
  actionLoading: string | null;
}) {
  const isBusy = actionLoading === booking._id;
  const isCancelled = booking.status === "cancelled";
  const dateStr = new Date(booking.startTime).toISOString().split("T")[0];
  const isPast = filterKey === "past" || (booking.status === "confirmed" && dateStr < todayStr());
  const showReview = isPast && filterKey !== "cancelled" && booking.status === "completed";
  const showActions = !isCancelled && !isPast;
  const stylistName = booking.stylistId && typeof booking.stylistId === "object" ? (booking.stylistId as any).name || "Stylist" : "Stylist";
  const stylistImage = booking.stylistId && typeof booking.stylistId === "object" ? (booking.stylistId as any).image : undefined;
  const serviceName = booking.serviceId && typeof booking.serviceId === "object" ? (booking.serviceId as any).name || "Service" : "Service";

  return (
    <motion.div
      onClick={onView}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 ${isCancelled ? "opacity-60" : ""}`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 w-12 sm:w-16 text-center">
            <p className="text-xs sm:text-sm font-bold text-text-primary dark:text-text-dark-primary tabular-nums">{fmtTime(fmtISO(booking.startTime)).split(" ")[0]}</p>
            <p className="text-[9px] sm:text-[10px] text-text-muted dark:text-text-dark-muted font-medium">{fmtTime(fmtISO(booking.startTime)).split(" ")[1]}</p>
          </div>

          <div className={`w-px h-10 shrink-0 self-center hidden sm:block ${isCancelled ? "bg-red-200 dark:bg-red-900/40" : fmtDate(new Date(booking.startTime)) === "Today" ? "bg-green-300 dark:bg-green-700/50" : "bg-gray-200 dark:bg-gray-600"}`} />

          <div className="shrink-0">
            {stylistImage ? (
              <img src={stylistImage} alt={stylistName} className={`w-10 sm:w-11 h-10 sm:h-11 rounded-xl object-cover ring-1 ring-gray-100 dark:ring-gray-700/40 ${isCancelled ? "grayscale" : ""}`} />
            ) : (
              <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center">
                <span className="text-[10px] sm:text-xs font-bold text-text-muted dark:text-text-dark-muted">{initials(stylistName)}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 flex-wrap">
              <p className={`text-xs sm:text-sm font-semibold truncate max-w-[120px] sm:max-w-none ${isCancelled ? "text-text-muted dark:text-text-dark-muted line-through" : "text-text-primary dark:text-text-dark-primary"}`}>{stylistName}</p>
              <BookingStatusBadge status={booking.status} date={dateStr} />
            </div>
            <p className="text-[11px] sm:text-xs text-text-secondary dark:text-text-dark-secondary truncate">{serviceName}</p>
            <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-text-muted dark:text-text-dark-muted">
              <span className="flex items-center gap-1"><Calendar size={9} className="sm:hidden" /><Calendar size={10} className="hidden sm:block" />{fmtDate(new Date(booking.startTime))}</span>
              {booking.totalPrice > 0 && (
                <span className="sm:hidden font-semibold text-text-primary dark:text-text-dark-primary">GH₵{booking.totalPrice}</span>
              )}
            </div>
          </div>

          <div className="hidden sm:flex shrink-0 flex-col items-end gap-2">
            {booking.totalPrice > 0 && (
              <p className={`text-sm font-bold ${isCancelled ? "text-text-muted dark:text-text-dark-muted" : "text-text-primary dark:text-text-dark-primary"}`}>GH₵{booking.totalPrice}</p>
            )}

            {queueData && !isCancelled && (
              <div className={`flex flex-col items-center px-2 py-1 rounded-xl border ${queueData.position === 1 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"}`}>
                <span className={`text-[8px] font-bold uppercase tracking-wider ${queueData.position === 1 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>Queue</span>
                <span className={`text-sm font-black tabular-nums leading-none ${queueData.position === 1 ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}>#{queueData.position}</span>
              </div>
            )}

            {showActions && (
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost-gray" size="sm" onClick={(e) => { e.stopPropagation(); onReschedule(); }} disabled={isBusy}
                  className="flex items-center gap-1">
                  <RotateCcw size={10} /> Reschedule
                </Button>
                <Button variant="ghost-gray" size="sm" onClick={(e) => { e.stopPropagation(); onCancel(); }} disabled={isBusy}
                  className="flex items-center gap-1 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  {isBusy ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />} Cancel
                </Button>
              </div>
            )}

            {showReview && (
              <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onReview(); }}
                className="flex items-center gap-1.5">
                <Star size={10} /> Review
              </Button>
            )}
          </div>
        </div>

        {queueData && !isCancelled && (
          <div className={`flex sm:hidden items-center gap-2 mt-2 ${queueData.position === 1 ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"} rounded-xl px-3 py-1.5`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${queueData.position === 1 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>Queue</span>
            <span className={`text-sm font-black tabular-nums leading-none ${queueData.position === 1 ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}>#{queueData.position}</span>
          </div>
        )}

        {(showActions || showReview) && (
          <div className="flex sm:hidden items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/40">
            {showActions && (
              <>
                <Button variant="ghost-gray" size="sm" onClick={(e) => { e.stopPropagation(); onReschedule(); }} disabled={isBusy}
                  className="flex-1 flex items-center justify-center gap-1">
                  <RotateCcw size={10} /> Reschedule
                </Button>
                <Button variant="ghost-gray" size="sm" onClick={(e) => { e.stopPropagation(); onCancel(); }} disabled={isBusy}
                  className="flex-1 flex items-center justify-center gap-1 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  {isBusy ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />} Cancel
                </Button>
              </>
            )}
            {showReview && (
              <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onReview(); }}
                className="flex-1 flex items-center justify-center gap-1.5">
                <Star size={10} /> Review
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MyBookings() {
  const { data: bookings = [], isLoading, error: queryError, refetch } = useMyBookings();
  const cancelMutation = useCancelBookingMutation();
  const rescheduleMutation = useRescheduleBookingMutation();
  const { addPoints, incrementAction } = useGamification();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [reschedule, setReschedule] = useState<Booking | null>(null);
  const [review, setReview] = useState<Booking | null>(null);
  const [cancel, setCancel] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState({ message: "", visible: false });
  const [queues, setQueues] = useState<Record<string, any>>({});

  const today = todayStr();

  const flash = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  useEffect(() => {
    if (bookings.length === 0) return;
    connectQueue();
    bookings.forEach((b) => {
      const sid = b.stylistId && typeof b.stylistId === "object" ? (b.stylistId as any)._id : b.stylistId;
      if (sid) { subscribeToQueue(sid); getMyQueueStatus(sid); }
    });
    return () => { disconnectQueue(); };
  }, [bookings]);

  useEffect(() => {
    const sock = getQueueSocket();
    const handleUpdate = (data: any) => setQueues((prev) => ({ ...prev, [data.stylistId]: data }));
    const handleStatus = (data: { queue: any | null }) => { if (data.queue) setQueues((prev) => ({ ...prev, [data.queue.stylistId]: data.queue })); };
    const handleBookingStatus = (data: { bookingId: string; status: string; stylistId: string }) => {
      const statusLabels: Record<string, string> = {
        "in-progress": "Stylist is now working on your service",
        completed: "Service completed",
        confirmed: "Booking confirmed",
        cancelled: "Booking was cancelled",
      };
      const msg = statusLabels[data.status];
      if (msg) flash(msg);
      refetch();
    };
    sock.on("queue:update", handleUpdate);
    sock.on("queue:status", handleStatus);
    onBookingStatusChanged(handleBookingStatus);
    return () => {
      sock.off("queue:update", handleUpdate);
      sock.off("queue:status", handleStatus);
      offBookingStatusChanged(handleBookingStatus);
    };
  }, [refetch]);

  const counts = useMemo(() => ({
    all: bookings.length,
    today: bookings.filter((b) => (b.status === "pending" || b.status === "confirmed") && new Date(b.startTime).toISOString().split("T")[0] === today).length,
    upcoming: bookings.filter((b) => (b.status === "pending" || b.status === "confirmed") && new Date(b.startTime).toISOString().split("T")[0] > today).length,
    past: bookings.filter((b) => (b.status === "confirmed" || b.status === "completed") && new Date(b.startTime).toISOString().split("T")[0] < today).length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }), [bookings, today]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (filter === "today") list = list.filter((b) => (b.status === "pending" || b.status === "confirmed") && new Date(b.startTime).toISOString().split("T")[0] === today);
    else if (filter === "upcoming") list = list.filter((b) => (b.status === "pending" || b.status === "confirmed") && new Date(b.startTime).toISOString().split("T")[0] > today);
    else if (filter === "past") list = list.filter((b) => (b.status === "confirmed" || b.status === "completed") && new Date(b.startTime).toISOString().split("T")[0] < today);
    else if (filter === "cancelled") list = list.filter((b) => b.status === "cancelled");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        const name = b.stylistId && typeof b.stylistId === "object" ? (b.stylistId as any).name || "" : "";
        const svcName = b.serviceId && typeof b.serviceId === "object" ? (b.serviceId as any).name || "" : "";
        return svcName.toLowerCase().includes(q) || name.toLowerCase().includes(q) || b.startTime?.includes(q);
      });
    }
    list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return list;
  }, [bookings, filter, search, today]);

  const handleCancel = useCallback(async () => {
    if (!cancel) return;
    setActionLoading(cancel._id);
    try {
      await cancelMutation.mutateAsync(cancel._id);
      setCancel(null);
      flash("Booking cancelled");
    } catch { flash("Failed to cancel"); }
    finally { setActionLoading(null); }
  }, [cancel, cancelMutation]);

  const handleReschedule = useCallback(async () => {
    if (!reschedule || !newDate || !newTime) return;
    setActionLoading(reschedule._id);
    try {
      const startDateTime = new Date(`${newDate}T${newTime}:00`);
      await rescheduleMutation.mutateAsync({ id: reschedule._id, startTime: startDateTime.toISOString() });
      setReschedule(null);
      flash("Booking rescheduled");
    } catch { flash("Failed to reschedule"); }
    finally { setActionLoading(null); }
  }, [reschedule, newDate, newTime, rescheduleMutation]);

  const handleReview = useCallback(async () => {
    if (!review) return;
    setActionLoading(review._id);
    try {
      await createReview({ bookingId: review._id, rating, comment });
      addPoints(20);
      incrementAction("reviews");
      await refetch();
      setReview(null);
      flash("Review submitted · +20 pts");
    } catch { flash("Failed to submit review"); }
    finally { setActionLoading(null); }
  }, [review, rating, comment, addPoints, incrementAction, refetch]);

  const grouped = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    filtered.forEach((b) => {
      const key = fmtDate(new Date(b.startTime));
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return Object.entries(groups);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark-tertiary">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pb-20">
        <div className="pt-4 sm:pt-14 pb-4 sm:pb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-1">My Bookings</h1>
          <p className="text-xs sm:text-sm text-text-muted dark:text-text-dark-muted">Manage your appointments and schedule</p>
        </div>

        <div className="mb-4">
          {queryError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 mb-4">
              <p className="text-sm text-red-700 dark:text-red-400">Failed to load bookings</p>
              <button onClick={() => refetch()} className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline mt-1">Try again</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <StatCard label="Today" value={counts.today} icon={CalendarCheck} color={{ bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", icon: "text-green-500 dark:text-green-400" }} />
          <StatCard label="Upcoming" value={counts.upcoming} icon={CalendarClock} color={{ bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", icon: "text-blue-500 dark:text-blue-400" }} />
          <StatCard label="Completed" value={counts.past} icon={CheckCircle} color={{ bg: "bg-gray-50 dark:bg-surface-dark-tertiary", text: "text-gray-700 dark:text-text-dark-primary", icon: "text-gray-500 dark:text-text-dark-secondary" }} />
          <StatCard label="Cancelled" value={counts.cancelled} icon={CalendarX} color={{ bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", icon: "text-red-400 dark:text-red-400" }} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="flex-1 min-w-0 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <FilterPills filters={FILTERS} active={filter} onChange={(f) => setFilter(f as FilterKey)} counts={counts} />
          </div>
          <div className="relative shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="w-full sm:w-48 pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 text-xs text-text-primary dark:text-text-dark-primary placeholder:text-text-muted dark:placeholder:text-text-dark-muted outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 transition-all" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 sm:h-20 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 skeleton-pulse" style={{ animationDelay: `${i * 0.1}s` }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="pt-8">
            <EmptyState icon={Calendar} title="No bookings yet" sub="Your appointments will appear here once you book a stylist." />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${filter}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {grouped.map(([dateLabel, items]) => (
                <div key={dateLabel} className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted dark:text-text-dark-muted">{dateLabel}</h3>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700/40" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-text-muted dark:text-text-dark-muted">{items.length}</span>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    {items.map((b) => {
                      const sid = b.stylistId && typeof b.stylistId === "object" ? (b.stylistId as any)._id : b.stylistId;
                      const q = queues[sid];
                      const queueEntry = q?.entries?.find((e: any) => e.userId === (b.clientId && typeof b.clientId === "object" ? (b.clientId as any)?._id : b.clientId));
                      return (
                        <BookingRow key={b._id} booking={b} filterKey={filter} queueData={queueEntry || null}
                          onCancel={() => setCancel(b)} onReschedule={() => { setReschedule(b); setNewDate(new Date(b.startTime).toISOString().split("T")[0]); setNewTime(fmtISO(b.startTime)); }}
                          onReview={() => { setReview(b); setRating(5); setComment(""); }} onView={() => setDetail(b)} actionLoading={actionLoading} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {reschedule && (
          <RescheduleModal booking={reschedule} stylistName={reschedule.stylistId && typeof reschedule.stylistId === "object" ? (reschedule.stylistId as any).name : undefined}
            newDate={newDate} newTime={newTime} onDateChange={setNewDate} onTimeChange={setNewTime}
            onConfirm={handleReschedule} onClose={() => setReschedule(null)} loading={actionLoading === reschedule._id} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {review && (
          <ReviewModal stylistName={review.stylistId && typeof review.stylistId === "object" ? (review.stylistId as any).name : undefined}
            bookingDate={review.startTime} onRatingChange={setRating} onCommentChange={setComment}
            onSubmit={handleReview} onClose={() => setReview(null)} loading={actionLoading === review._id} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cancel && (
          <CancelModal booking={cancel} stylistImage={cancel.stylistId && typeof cancel.stylistId === "object" ? (cancel.stylistId as any).image : undefined}
            stylistName={cancel.stylistId && typeof cancel.stylistId === "object" ? (cancel.stylistId as any).name : undefined}
            onConfirm={handleCancel} onClose={() => setCancel(null)} loading={actionLoading === cancel._id} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detail && <BookingDetailModal booking={detail} stylistImage={detail.stylistId && typeof detail.stylistId === "object" ? (detail.stylistId as any).image : undefined} onClose={() => setDetail(null)} />}
      </AnimatePresence>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
