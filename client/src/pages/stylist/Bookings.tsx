import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, CalendarCheck, CalendarClock, CalendarX, CheckCircle, CheckCircle as CheckIcon, XCircle, Play, StopCircle, Timer, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { logger } from "@/utils/logger";
import { useStylistBookingsQuery, useUpdateBookingStatusMutation } from "@/domain/booking/booking.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { connectQueue, onBookingStatusChanged, offBookingStatusChanged } from "@/services/socket";
import { StatusBadge, fmtDate, fmtISO, initials, todayStr } from "@/domain/booking/components/StatusBadge";
import { StatCard, EmptyState, FilterPills } from "@/domain/booking/components/SharedUI";
import BookingDetailModal from "@/domain/booking/components/BookingDetailModal";
import type { Booking } from "@/domain/booking/booking.types";

type FilterKey = "pending" | "today" | "upcoming" | "past" | "cancelled" | "all";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

export default function StylistBookings() {
  const { data: bookings = [], isLoading } = useStylistBookingsQuery();
  const updateStatus = useUpdateBookingStatusMutation();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("pending");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  const flash = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  const today = todayStr();

  const counts = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length;
    const inProgress = bookings.filter((b) => b.status === "in-progress").length;
    const todayCount = bookings.filter((b) => (b.status === "in-progress" || b.status === "confirmed" || b.status === "pending") && new Date(b.startTime).toISOString().split("T")[0] === today).length;
    const upcoming = bookings.filter((b) => (b.status === "confirmed" || b.status === "pending") && new Date(b.startTime) > new Date()).length;
    const past = bookings.filter((b) => b.status === "completed" || (b.status === "confirmed" && new Date(b.startTime) < new Date())).length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    return { pending, inProgress, today: todayCount, upcoming, past, cancelled, all: bookings.length };
  }, [bookings, today]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (activeFilter === "pending") list = list.filter((b) => b.status === "pending");
    else if (activeFilter === "today") list = list.filter((b) => (b.status === "in-progress" || b.status === "confirmed" || b.status === "pending") && new Date(b.startTime).toISOString().split("T")[0] === today);
    else if (activeFilter === "upcoming") list = list.filter((b) => (b.status === "confirmed" || b.status === "pending") && new Date(b.startTime) > new Date());
    else if (activeFilter === "past") list = list.filter((b) => b.status === "completed" || (b.status === "confirmed" && new Date(b.startTime) < new Date()));
    else if (activeFilter === "cancelled") list = list.filter((b) => b.status === "cancelled");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        const clientName = typeof b.clientId === "object" ? (b.clientId as any).name || "" : "";
        const svcName = typeof b.serviceId === "object" ? (b.serviceId as any).name || "" : "";
        return clientName.toLowerCase().includes(q) || svcName.toLowerCase().includes(q);
      });
    }
    list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return list;
  }, [bookings, activeFilter, search, today]);

  const withLoading = useCallback(async (bookingId: string, action: () => Promise<void>, successMsg: string) => {
    setActionLoading(bookingId);
    try {
      await action();
      flash(successMsg);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Action failed";
      flash(msg);
      logger.error(msg, err);
    } finally {
      setActionLoading(null);
    }
  }, [flash]);

  const handleConfirm = useCallback((bookingId: string) =>
    withLoading(bookingId, () => updateStatus.mutateAsync({ id: bookingId, status: "confirmed" }), "Booking confirmed"),
  [updateStatus, withLoading]);

  const handleCancel = useCallback((bookingId: string) =>
    withLoading(bookingId, () => updateStatus.mutateAsync({ id: bookingId, status: "cancelled" }), "Booking cancelled"),
  [updateStatus, withLoading]);

  const handleStartService = useCallback((bookingId: string) =>
    withLoading(bookingId, () => updateStatus.mutateAsync({ id: bookingId, status: "in-progress" }), "Service started"),
  [updateStatus, withLoading]);

  const handleComplete = useCallback((bookingId: string) =>
    withLoading(bookingId, () => updateStatus.mutateAsync({ id: bookingId, status: "completed" }), "Service completed"),
  [updateStatus, withLoading]);

  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState<Record<string, string>>({});
  useEffect(() => {
    connectQueue();
    const handleBookingEvent = () => queryClient.invalidateQueries({ queryKey: ["bookings"] });
    onBookingStatusChanged(handleBookingEvent);
    return () => { offBookingStatusChanged(handleBookingEvent); };
  }, [queryClient]);

  useEffect(() => {
    const tick = () => {
      const next: Record<string, string> = {};
      for (const b of bookings) {
        if (b.status === "in-progress" && b.startTime) {
          const diff = Date.now() - new Date(b.startTime).getTime();
          if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            next[b._id] = h > 0 ? `${h}h ${m}m` : `${m}m`;
          }
        }
      }
      setElapsed(next);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 w-36 sm:w-auto sm:flex-1 rounded-2xl skeleton-pulse shrink-0" />)}
        </div>
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-2xl skeleton-pulse" style={{ animationDelay: `${i * 0.1}s` }} />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-lg shadow-black/20 dark:bg-white dark:text-gray-900"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pb-6">
        <div className="pt-2 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight font-display mb-1">Bookings</h1>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">Manage client appointments and requests</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <StatCard label="Pending" value={counts.pending} icon={Clock} color={{ bg: "bg-brand-50 dark:bg-brand-950/20", text: "text-brand-600 dark:text-brand-400", icon: "text-brand-500 dark:text-brand-400" }} />
          <StatCard label="In Progress" value={counts.inProgress} icon={Play} color={{ bg: "bg-brand-50 dark:bg-brand-950/20", text: "text-brand-600 dark:text-brand-400", icon: "text-brand-500 dark:text-brand-400" }} />
          <StatCard label="Today" value={counts.today} icon={CalendarCheck} color={{ bg: "bg-gray-50 dark:bg-surface-dark-tertiary", text: "text-text-primary dark:text-text-dark-primary", icon: "text-text-muted dark:text-text-dark-muted" }} />
          <StatCard label="Upcoming" value={counts.upcoming} icon={CalendarClock} color={{ bg: "bg-brand-50 dark:bg-brand-950/20", text: "text-brand-600 dark:text-brand-400", icon: "text-brand-500 dark:text-brand-400" }} />
          <StatCard label="Completed" value={counts.past} icon={CheckCircle} color={{ bg: "bg-gray-50 dark:bg-surface-dark-tertiary", text: "text-text-secondary dark:text-text-dark-secondary", icon: "text-text-muted dark:text-text-dark-muted" }} />
          <StatCard label="Cancelled" value={counts.cancelled} icon={CalendarX} color={{ bg: "bg-gray-50 dark:bg-surface-dark-tertiary", text: "text-text-muted dark:text-text-dark-muted", icon: "text-text-muted dark:text-text-dark-muted" }} />
        </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="flex-1 min-w-0 max-w-full">
            <FilterPills filters={FILTERS} active={activeFilter} onChange={(f) => setActiveFilter(f as FilterKey)} counts={counts} />
          </div>
          <div className="relative shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client or service…"
              className="w-full sm:w-48 pl-9 pr-3 py-2.5 input-field-sm" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={CalendarIcon} title="No bookings" sub="Bookings will appear here once clients make appointments." />
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => {
              const dateStr = new Date(b.startTime).toISOString().split("T")[0];
              const clientName = typeof b.clientId === "object" ? (b.clientId as any).name || "Client" : "Client";
              const serviceName = typeof b.serviceId === "object" ? (b.serviceId as any).name || "Service" : "Service";
              const isPending = b.status === "pending";
              const isCancelled = b.status === "cancelled";

              return (
                <motion.div key={b._id} onClick={() => setDetail(b)}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                   className={`group bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 ${isCancelled ? "opacity-60" : ""} ${isPending ? "border border-gray-100 dark:border-gray-700/40 border-l-4 border-l-brand-500 dark:border-l-brand-400" : ""}`}>
                   <div className="p-2.5 sm:p-3">
                    <div className="flex items-center gap-2 sm:gap-3 w-full">
                      <div className="hidden sm:flex flex-col items-center w-14 shrink-0 leading-tight">
                        <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary tabular-nums">{fmtISO(b.startTime).split(" ")[0]}</p>
                        <p className="text-[10px] text-text-muted dark:text-text-dark-muted font-medium">{fmtISO(b.startTime).split(" ")[1]}</p>
                      </div>

                      <div className="shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center ring-1 ring-gray-100 dark:ring-gray-700/40">
                          <span className="text-[10px] sm:text-[11px] font-bold text-text-muted dark:text-text-dark-muted">{initials(clientName)}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className={`text-xs sm:text-sm font-semibold truncate max-w-[140px] sm:max-w-none ${isCancelled ? "text-text-muted dark:text-text-dark-muted line-through" : "text-text-primary dark:text-text-dark-primary"}`}>{clientName}</p>
                          <StatusBadge status={b.status} date={dateStr} />
                        </div>
                        <p className="text-[11px] sm:text-xs text-text-secondary dark:text-text-dark-secondary truncate">{serviceName}</p>
                        <div className="flex sm:hidden items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-text-muted dark:text-text-dark-muted">{fmtISO(b.startTime)}</span>
                          {b.totalPrice > 0 && (
                            <span className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary">· GH₵{b.totalPrice}</span>
                          )}
                        </div>
                      </div>

                      {b.totalPrice > 0 && (
                        <p className={`hidden sm:block text-sm font-bold shrink-0 ${isCancelled ? "text-gray-300 dark:text-gray-600" : "text-text-primary dark:text-text-dark-primary"}`}>
                          GH₵{b.totalPrice}
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/40 justify-end">
                      {/* desktop actions */}
                      {isPending && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); handleConfirm(b._id); }} disabled={actionLoading === b._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-brand-300 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <CheckIcon size={12} />} Confirm
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleCancel(b._id); }} disabled={actionLoading === b._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-300 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Cancel
                          </button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <button onClick={(e) => { e.stopPropagation(); handleStartService(b._id); }} disabled={actionLoading === b._id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-brand-300 bg-brand-50 dark:bg-brand-950/20 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Start Service
                        </button>
                      )}
                      {b.status === "in-progress" && (
                        <div className="flex items-center gap-2">
                          {elapsed[b._id] && (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-brand-600 dark:text-brand-400 font-semibold">
                              <Timer size={12} /> {elapsed[b._id]}
                            </span>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleComplete(b._id); }} disabled={actionLoading === b._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 text-[11px] font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <StopCircle size={12} />} Complete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:hidden items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700/40">
                      {isPending && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); handleConfirm(b._id); }} disabled={actionLoading === b._id}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border border-brand-300 bg-brand-50 dark:bg-brand-950/20 text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <CheckIcon size={12} />} Confirm
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleCancel(b._id); }} disabled={actionLoading === b._id}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/20 text-[11px] font-semibold text-red-600 dark:text-red-400 flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Cancel
                          </button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <button onClick={(e) => { e.stopPropagation(); handleStartService(b._id); }} disabled={actionLoading === b._id}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border border-brand-300 bg-brand-50 dark:bg-brand-950/20 text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                          {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Start Service
                        </button>
                      )}
                      {b.status === "in-progress" && (
                        <div className="flex items-center gap-2 flex-1">
                          {elapsed[b._id] && (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-brand-600 dark:text-brand-400 font-semibold shrink-0">
                              <Timer size={12} /> {elapsed[b._id]}
                            </span>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleComplete(b._id); }} disabled={actionLoading === b._id}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 text-[11px] font-semibold text-green-700 dark:text-green-400 flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                            {actionLoading === b._id ? <Loader2 size={12} className="animate-spin" /> : <StopCircle size={12} />} Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {detail && <BookingDetailModal booking={detail} clientView={false} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}
