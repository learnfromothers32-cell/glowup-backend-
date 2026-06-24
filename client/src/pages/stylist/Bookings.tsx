import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle as CheckIcon, XCircle, Play, StopCircle, Timer, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { logger } from "@/utils/logger";
import { useStylistBookingsQuery, useUpdateBookingStatusMutation } from "@/domain/booking/booking.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { connectQueue, onBookingStatusChanged, offBookingStatusChanged } from "@/services/socket";
import { StatusBadge, todayStr } from "@/domain/booking/components/StatusBadge";
import { EmptyState, FilterPills } from "@/domain/booking/components/SharedUI";
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

function fmtTime12(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return { time: `${h12}:${m.toString().padStart(2, "0")}`, ampm };
}

function fmtDuration(b: Booking): string | null {
  if (b.endTime) {
    const diff = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
    const mins = Math.round(diff / 60000);
    if (mins > 0) {
      if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
      return `${mins}min`;
    }
  }
  if (typeof b.serviceId === "object" && (b.serviceId as any).duration) {
    return `${(b.serviceId as any).duration}min`;
  }
  return null;
}

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

  const sections = useMemo(() => {
    const inProgress = filtered.filter((b) => b.status === "in-progress");
    const todayList = filtered.filter((b) => b.status !== "in-progress" && b.status !== "completed" && b.status !== "cancelled" && new Date(b.startTime).toISOString().split("T")[0] === today);
    const upcoming = filtered.filter((b) => (b.status === "confirmed" || b.status === "pending") && new Date(b.startTime) > new Date() && new Date(b.startTime).toISOString().split("T")[0] !== today);
    const completed = filtered.filter((b) => b.status === "completed");
    const cancelled = filtered.filter((b) => b.status === "cancelled");
    const groups: { title: string; bookings: Booking[] }[] = [];
    if (inProgress.length > 0) groups.push({ title: "In Progress", bookings: inProgress });
    if (todayList.length > 0) groups.push({ title: "Today", bookings: todayList });
    if (upcoming.length > 0) groups.push({ title: "Upcoming", bookings: upcoming });
    if (completed.length > 0) groups.push({ title: "Completed", bookings: completed });
    if (cancelled.length > 0) groups.push({ title: "Cancelled", bookings: cancelled });
    return groups;
  }, [filtered, today]);

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
      <div className="space-y-6">
        <div className="h-7 w-48 skeleton-pulse rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 skeleton-pulse rounded-lg" />
            <div className="h-[140px] rounded-2xl skeleton-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            <div className="h-[140px] rounded-2xl skeleton-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
          </div>
        ))}
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
        {/* ── Header + summary ── */}
        <div className="pt-2 pb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight font-display mb-1">Bookings</h1>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">
            {counts.today > 0 ? `${counts.today} booking${counts.today > 1 ? "s" : ""} today` : "No bookings today"}
            {counts.pending > 0 ? ` · ${counts.pending} pending` : ""}
            {counts.cancelled > 0 ? ` · ${counts.cancelled} cancelled` : ""}
          </p>
        </div>

        {/* ── Filters + Search ── */}
        <div className="bg-white dark:bg-surface-dark-secondary rounded-xl border border-gray-100 dark:border-gray-700/40 p-2 sm:p-3 mb-3 sm:mb-5">
          {/* Mobile search - full width */}
          <div className="relative mb-2 sm:hidden">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or service\u2026"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-600 text-sm text-text-primary dark:text-text-dark-primary placeholder:text-text-muted outline-none focus:border-stylist-300 dark:focus:border-stylist-700 transition-all" />
          </div>
          {/* Pills + Desktop search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 max-w-full">
              <FilterPills filters={FILTERS} active={activeFilter} onChange={(f) => setActiveFilter(f as FilterKey)} counts={counts} />
            </div>
            <div className="relative shrink-0 hidden sm:block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search\u2026"
                className="w-44 pl-8 pr-2.5 py-2 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-600 text-xs text-text-primary dark:text-text-dark-primary placeholder:text-text-muted outline-none focus:border-stylist-300 dark:focus:border-stylist-700 transition-all" />
            </div>
          </div>
        </div>

        {/* ── Bookings ── */}
        {filtered.length === 0 ? (
          <EmptyState icon={CalendarIcon} title="No bookings" sub="No bookings match your current filter. Try adjusting your search or filter." />
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                {/* Section header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h2 className="text-sm font-bold text-text-primary dark:text-text-dark-primary uppercase tracking-wider">{section.title}</h2>
                  <span className="text-xs font-medium text-text-muted dark:text-text-dark-muted bg-gray-100 dark:bg-surface-dark-tertiary px-2 py-0.5 rounded-full">{section.bookings.length}</span>
                </div>

                <div className="space-y-2">
                  {section.bookings.map((b) => {
                    const dateStr = new Date(b.startTime).toISOString().split("T")[0];
                    const clientName = typeof b.clientId === "object" ? (b.clientId as any).name || "Client" : "Client";
                    const serviceName = typeof b.serviceId === "object" ? (b.serviceId as any).name || "Service" : "Service";
                    const isPending = b.status === "pending";
                    const isCancelled = b.status === "cancelled";
                    const tf = fmtTime12(b.startTime);
                    const dur = fmtDuration(b);

                    return (
                      <motion.div key={b._id} onClick={() => setDetail(b)}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className={`group bg-white dark:bg-surface-dark-secondary rounded-2xl border cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 ${isCancelled ? "opacity-60" : "border-gray-100 dark:border-gray-700/40"} ${isPending ? "border-l-4 border-l-stylist-500 dark:border-l-stylist-400" : ""}`}>
                        <div className="p-2.5 sm:p-3">
                          {/* Row 1: time | name + badge */}
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            <div className="flex flex-col items-center w-[52px] shrink-0 pt-0.5">
                              <span className="text-sm sm:text-[15px] font-bold text-text-primary dark:text-text-dark-primary tabular-nums leading-tight">{tf.time}</span>
                              <span className="text-[10px] text-text-muted dark:text-text-dark-muted font-medium leading-tight">{tf.ampm}</span>
                              {dur && (
                                <span className="text-[9px] text-text-secondary dark:text-text-dark-secondary mt-1 font-medium">{dur}</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <p className={`text-sm sm:text-base font-semibold truncate ${isCancelled ? "text-text-muted dark:text-text-dark-muted line-through" : "text-text-primary dark:text-text-dark-primary"}`}>{clientName}</p>
                                <StatusBadge status={b.status} date={dateStr} />
                              </div>
                              <p className="text-xs sm:text-sm text-text-secondary dark:text-text-dark-secondary truncate mt-0.5">
                                {serviceName}{b.totalPrice > 0 ? " \u00B7 GH\u20B5" + b.totalPrice : ""}
                              </p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          {(isPending || b.status === "confirmed" || b.status === "in-progress") && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/40">
                              {isPending && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleConfirm(b._id); }} disabled={actionLoading === b._id}
                                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl border border-stylist-300 bg-stylist-50 dark:bg-stylist-950/20 text-sm font-semibold text-stylist-600 dark:text-stylist-400 hover:bg-stylist-100 dark:hover:bg-stylist-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {actionLoading === b._id ? <Loader2 size={16} className="animate-spin" /> : <CheckIcon size={16} />}
                                    Confirm
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleCancel(b._id); }} disabled={actionLoading === b._id}
                                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/20 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {actionLoading === b._id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                    Cancel
                                  </button>
                                </>
                              )}
                              {b.status === "confirmed" && (
                                <button onClick={(e) => { e.stopPropagation(); handleStartService(b._id); }} disabled={actionLoading === b._id}
                                  className="flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl border border-stylist-300 bg-stylist-50 dark:bg-stylist-950/20 text-sm font-semibold text-stylist-600 dark:text-stylist-400 hover:bg-stylist-100 dark:hover:bg-stylist-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                  {actionLoading === b._id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                  Start Service
                                </button>
                              )}
                              {b.status === "in-progress" && (
                                <div className="flex items-center gap-2 flex-1">
                                  {elapsed[b._id] && (
                                    <span className="flex items-center gap-1 text-xs font-mono text-stylist-600 dark:text-stylist-400 font-semibold shrink-0">
                                      <Timer size={14} /> {elapsed[b._id]}
                                    </span>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleComplete(b._id); }} disabled={actionLoading === b._id}
                                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 text-sm font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {actionLoading === b._id ? <Loader2 size={16} className="animate-spin" /> : <StopCircle size={16} />}
                                    Complete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {detail && <BookingDetailModal booking={detail} clientView={false} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}
