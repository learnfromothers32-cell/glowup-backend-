import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle as CheckIcon, XCircle, Play, StopCircle,
  Timer, Loader2, Calendar as CalendarIcon, RefreshCcw,
  Clock, ChevronRight, BarChart3, DollarSign,
  ArrowRight, CheckCheck,
} from "lucide-react";
import { logger } from "@/utils/logger";
import { useStylistBookingsQuery, useUpdateBookingStatusMutation } from "@/domain/booking/booking.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { connectQueue, onBookingStatusChanged, offBookingStatusChanged } from "@/services/socket";
import { StatusBadge, todayStr, initials } from "@/domain/booking/components/StatusBadge";
import BookingDetailModal from "@/domain/booking/components/BookingDetailModal";
import type { Booking } from "@/domain/booking/booking.types";

type FilterKey = "pending" | "today" | "upcoming" | "past" | "cancelled" | "all";

const FILTERS: { key: FilterKey; label: string; icon: typeof Clock }[] = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "today", label: "Today", icon: CalendarIcon },
  { key: "upcoming", label: "Upcoming", icon: ArrowRight },
  { key: "past", label: "Past", icon: CheckCheck },
  { key: "cancelled", label: "Cancelled", icon: XCircle },
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
  if (b.serviceId && typeof b.serviceId === "object" && (b.serviceId as any).duration) {
    return `${(b.serviceId as any).duration}min`;
  }
  return null;
}

function getClientName(b: Booking): string {
  if (typeof b.clientId === "object" && b.clientId !== null) return (b.clientId as any).name || "Client";
  return "Client";
}

function getServiceName(b: Booking): string {
  if (typeof b.serviceId === "object" && b.serviceId !== null) return (b.serviceId as any).name || "Service";
  return "Service";
}

function StatCard({ label, value, icon: Icon, color, subtitle }: {
  label: string; value: string | number; icon: typeof DollarSign; color: string; subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 p-3 sm:p-4 hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={14} className="sm:hidden text-white" />
          <Icon size={18} className="hidden sm:block text-white" />
        </div>
        <span className="text-lg sm:text-2xl font-bold tabular-nums text-text-primary dark:text-text-dark-primary">
          {value}
        </span>
      </div>
      <p className="text-[11px] sm:text-xs font-medium text-text-secondary dark:text-text-dark-secondary">{label}</p>
      {subtitle && (
        <p className="text-[10px] text-text-muted dark:text-text-dark-muted mt-0.5">{subtitle}</p>
      )}
    </motion.div>
  );
}

export default function StylistBookings() {
  const { data: bookings = [], isLoading } = useStylistBookingsQuery();
  const updateStatus = useUpdateBookingStatusMutation();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("pending");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  const flash = useCallback((msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, []);

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

  const totalRevenue = useMemo(
    () => bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + (b.totalPrice || 0), 0),
    [bookings]
  );

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
        const clientName = getClientName(b).toLowerCase();
        const svcName = getServiceName(b).toLowerCase();
        return clientName.includes(q) || svcName.includes(q);
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

  const isLoadingOrEmpty = isLoading && bookings.length === 0;

  return (
    <div className="min-h-screen pb-8">
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold shadow-2xl shadow-black/25 dark:shadow-black/40 flex items-center gap-2.5"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckIcon size={12} className="text-emerald-400" />
            </div>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight font-display">
            Bookings
          </h1>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
            {counts.today > 0
              ? `${counts.today} booking${counts.today > 1 ? "s" : ""} today`
              : "No bookings today"}
            {counts.pending > 0 && ` · ${counts.pending} pending`}
            {counts.inProgress > 0 && ` · ${counts.inProgress} in progress`}
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["bookings"] })}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:border-gray-300 dark:hover:border-gray-500 hover:text-text-primary dark:hover:text-text-dark-primary transition-all"
        >
          <RefreshCcw size={14} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Today"
          value={counts.today}
          icon={CalendarIcon}
          color="bg-violet-500"
          subtitle={counts.inProgress > 0 ? `${counts.inProgress} active` : undefined}
        />
        <StatCard
          label="Pending"
          value={counts.pending}
          icon={Clock}
          color="bg-amber-500"
          subtitle="Awaiting confirmation"
        />
        <StatCard
          label="In Progress"
          value={counts.inProgress}
          icon={BarChart3}
          color="bg-emerald-500"
        />
        <StatCard
          label="Revenue"
          value={`GH₵${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-blue-500"
          subtitle="From completed bookings"
        />
      </div>

      {/* ── Mobile search (above pills) ── */}
      <div className="relative mb-3 sm:hidden">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or service..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 text-sm text-text-primary dark:text-text-dark-primary placeholder:text-text-muted outline-none focus:border-stylist-300 dark:focus:border-stylist-700 transition-all"
        />
      </div>

      {/* ── Filters + Desktop Search ── */}
      <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 p-2 sm:p-3 mb-5 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
            {FILTERS.map(({ key, label, icon: Icon }) => {
              const isActive = activeFilter === key;
              const count = counts[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`inline-flex items-center gap-1 px-2 sm:gap-1.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                      : "bg-gray-50 dark:bg-surface-dark-tertiary text-text-secondary dark:text-text-dark-secondary border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-surface-dark"
                  }`}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full inline-flex items-center justify-center ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-600 text-text-secondary dark:text-text-dark-secondary"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop search */}
          <div className="relative shrink-0 hidden sm:block">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-40 lg:w-48 pl-8 pr-2.5 py-2 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-600 text-xs text-text-primary dark:text-text-dark-primary placeholder:text-text-muted outline-none focus:border-stylist-300 dark:focus:border-stylist-700 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Bookings List ── */}
      {isLoadingOrEmpty ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[100px] rounded-2xl skeleton-pulse" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center mb-4">
              <CalendarIcon size={24} className="text-text-muted dark:text-text-dark-muted" />
            </div>
            <p className="text-sm sm:text-base font-semibold text-text-primary dark:text-text-dark-primary mb-1">No bookings found</p>
            <p className="text-xs sm:text-sm text-text-secondary dark:text-text-dark-secondary max-w-[280px] leading-relaxed">
              {search ? "No results match your search. Try a different name or service." : "No bookings match this filter yet."}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {sections.map((section, sectionIdx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.05 }}
            >
              {/* Section Header */}
              <div className="flex items-center gap-2.5 mb-3 px-1">
                <div className={`w-1 h-5 rounded-full ${
                  section.title === "In Progress" ? "bg-emerald-500" :
                  section.title === "Today" ? "bg-violet-500" :
                  section.title === "Upcoming" ? "bg-blue-500" :
                  section.title === "Completed" ? "bg-gray-400" : "bg-red-400"
                }`} />
                <h2 className="text-sm font-bold text-text-primary dark:text-text-dark-primary">
                  {section.title}
                </h2>
                <span className="text-xs font-medium text-text-muted dark:text-text-dark-muted bg-gray-100 dark:bg-surface-dark-tertiary px-2 py-0.5 rounded-full">
                  {section.bookings.length}
                </span>
              </div>

              {/* Booking Cards */}
              <div className="space-y-2.5">
                {section.bookings.map((b, cardIdx) => {
                  const clientName = getClientName(b);
                  const serviceName = getServiceName(b);
                  const isPending = b.status === "pending";
                  const isInProgress = b.status === "in-progress";
                  const isConfirmed = b.status === "confirmed";
                  const isCancelled = b.status === "cancelled";
                  const tf = fmtTime12(b.startTime);
                  const dur = fmtDuration(b);
                  const dateStr = new Date(b.startTime).toISOString().split("T")[0];

                  return (
                    <motion.div
                      key={b._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: cardIdx * 0.03 }}
                    >
                      <div
                        onClick={() => setDetail(b)}
                        className={`group relative w-full bg-white dark:bg-surface-dark-secondary rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md ${
                          isCancelled
                            ? "border-red-100 dark:border-red-900/30 opacity-60 hover:opacity-80"
                            : isInProgress
                              ? "border-emerald-200 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700/50"
                              : isPending
                                ? "border-amber-200 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700/50"
                                : isConfirmed
                                  ? "border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700/50"
                                  : "border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600"
                        }`}
                      >
                        {/* Mobile layout */}
                        <div className="sm:hidden p-3.5 w-full">
                          {/* Row 1: Time + Status */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                isInProgress ? "bg-emerald-500 animate-pulse" :
                                isPending ? "bg-amber-400" :
                                isConfirmed ? "bg-blue-400" :
                                isCancelled ? "bg-red-300" : "bg-gray-300"
                              }`} />
                              <span className="text-sm font-bold text-text-primary dark:text-text-dark-primary tabular-nums">{tf.time} {tf.ampm}</span>
                              {dur && (
                                <span className="text-[11px] text-text-muted dark:text-text-dark-muted font-medium">({dur})</span>
                              )}
                            </div>
                            <StatusBadge status={b.status} date={dateStr} />
                          </div>

                          {/* Row 2: Client name + service */}
                          <div className="flex items-center gap-2.5 mb-1">
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                              isCancelled ? "bg-gray-100 dark:bg-gray-800" : "bg-stylist-100 dark:bg-stylist-900/40"
                            }`}>
                              <span className={`text-xs font-bold ${
                                isCancelled ? "text-gray-400" : "text-stylist-600 dark:text-stylist-400"
                              }`}>{initials(clientName)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${isCancelled ? "text-text-muted line-through" : "text-text-primary dark:text-text-dark-primary"}`}>
                                {clientName}
                              </p>
                              <p className="text-[12px] text-text-secondary dark:text-text-dark-secondary truncate">
                                {serviceName}{b.totalPrice > 0 ? ` · GH₵${b.totalPrice}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Elapsed timer for in-progress */}
                          {isInProgress && elapsed[b._id] && (
                            <div className="mb-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {elapsed[b._id]} elapsed
                              </span>
                            </div>
                          )}

                          {/* Actions */}
                          {(isPending || isConfirmed || isInProgress) && (
                            <div className="flex items-center gap-2 pt-2.5 mt-2 border-t border-gray-100 dark:border-gray-700/40">
                              {isPending && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleConfirm(b._id); }} disabled={actionLoading === b._id}
                                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm">
                                    {actionLoading === b._id ? <Loader2 size={15} className="animate-spin" /> : <CheckIcon size={15} />}
                                    Confirm
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleCancel(b._id); }} disabled={actionLoading === b._id}
                                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-950/20 active:scale-[0.97] transition-all disabled:opacity-50">
                                    {actionLoading === b._id ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                                    Cancel
                                  </button>
                                </>
                              )}
                              {isConfirmed && (
                                <button onClick={(e) => { e.stopPropagation(); handleStartService(b._id); }} disabled={actionLoading === b._id}
                                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-stylist-500 text-white text-sm font-semibold hover:from-violet-600 hover:to-stylist-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm">
                                  {actionLoading === b._id ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                                  Start
                                </button>
                              )}
                              {isInProgress && (
                                <div className="flex items-center gap-2 flex-1">
                                  <button onClick={(e) => { e.stopPropagation(); handleComplete(b._id); }} disabled={actionLoading === b._id}
                                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold hover:from-emerald-600 hover:to-green-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm">
                                    {actionLoading === b._id ? <Loader2 size={15} className="animate-spin" /> : <StopCircle size={15} />}
                                    Complete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Desktop layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-stretch">
                            {/* Time column */}
                            <div className="flex flex-col items-center justify-center w-24 py-4 px-3 bg-gray-50/50 dark:bg-surface-dark-tertiary/30 border-r border-gray-100 dark:border-gray-700/40 shrink-0">
                              <span className="text-xl font-bold text-text-primary dark:text-text-dark-primary tabular-nums leading-none">{tf.time}</span>
                              <span className="text-[11px] font-medium text-text-muted dark:text-text-dark-muted mt-0.5">{tf.ampm}</span>
                              {dur && (
                                <span className="text-[10px] text-text-secondary dark:text-text-dark-secondary mt-1.5 font-medium bg-white dark:bg-surface-dark-secondary px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700/40">
                                  {dur}
                                </span>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex items-center gap-4 py-4 px-4 min-w-0">
                              {/* Client avatar */}
                              <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                                isCancelled
                                  ? "bg-gray-100 dark:bg-gray-800"
                                  : "bg-stylist-100 dark:bg-stylist-900/40"
                              }`}>
                                <span className={`text-xs font-bold ${
                                  isCancelled ? "text-gray-400" : "text-stylist-600 dark:text-stylist-400"
                                }`}>
                                  {initials(clientName)}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5">
                                  <p className={`text-[15px] font-semibold truncate ${
                                    isCancelled
                                      ? "text-text-muted line-through"
                                      : "text-text-primary dark:text-text-dark-primary"
                                  }`}>
                                    {clientName}
                                  </p>
                                  {b.totalPrice > 0 && (
                                    <span className="text-xs font-semibold text-text-secondary dark:text-text-dark-secondary bg-gray-100 dark:bg-surface-dark-tertiary px-2 py-0.5 rounded-md whitespace-nowrap">
                                      GH₵{b.totalPrice}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-text-secondary dark:text-text-dark-secondary truncate mt-0.5">
                                  {serviceName}
                                </p>
                              </div>

                              {/* Elapsed timer for in-progress */}
                              {isInProgress && elapsed[b._id] && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{elapsed[b._id]}</span>
                                </div>
                              )}

                              {/* Status */}
                              <div className="shrink-0 hidden lg:block">
                                <StatusBadge status={b.status} date={dateStr} />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pr-4 py-4 shrink-0">
                              {(isPending || isConfirmed || isInProgress) && (
                                <div className="flex items-center gap-2">
                                  {isPending && (
                                    <>
                                      <button onClick={(e) => { e.stopPropagation(); handleConfirm(b._id); }} disabled={actionLoading === b._id}
                                        className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                        {actionLoading === b._id ? <Loader2 size={15} className="animate-spin" /> : <CheckIcon size={15} />}
                                        Confirm
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleCancel(b._id); }} disabled={actionLoading === b._id}
                                        className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-950/20 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        {actionLoading === b._id ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {isConfirmed && (
                                    <button onClick={(e) => { e.stopPropagation(); handleStartService(b._id); }} disabled={actionLoading === b._id}
                                      className="inline-flex items-center gap-1.5 px-5 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-stylist-500 text-white text-sm font-semibold hover:from-violet-600 hover:to-stylist-600 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                      {actionLoading === b._id ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                                      Start
                                    </button>
                                  )}
                                  {isInProgress && (
                                    <button onClick={(e) => { e.stopPropagation(); handleComplete(b._id); }} disabled={actionLoading === b._id}
                                      className="inline-flex items-center gap-1.5 px-5 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold hover:from-emerald-600 hover:to-green-600 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                      {actionLoading === b._id ? <Loader2 size={15} className="animate-spin" /> : <StopCircle size={15} />}
                                      Complete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Click hint */}
                        <div className="hidden sm:flex absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-text-muted dark:text-text-dark-muted flex items-center gap-0.5">
                            View details <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {detail && <BookingDetailModal booking={detail} clientView={false} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </div>
  );
}
