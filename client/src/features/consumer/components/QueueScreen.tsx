import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Calendar, X, CheckCircle, Bell, Timer, Info, Search,
  Zap, ArrowRight, Copy, Sparkles, Hourglass, MoveRight, Star
} from "lucide-react";
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

function QueuePositionRing({ position, isNext, size = "md" }: {
  position: number; isNext?: boolean; size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? 72 : size === "sm" ? 44 : 60;
  const stroke = size === "lg" ? 4 : size === "sm" ? 3 : 3.5;
  const mid = dims / 2;
  const radius = mid - stroke;
  const circ = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(5, 100 - (position - 1) * 15));
  const offset = circ - (progress / 100) * circ;

  return (
    <div className="relative shrink-0" style={{ width: dims, height: dims }}>
      <svg width={dims} height={dims} viewBox={`0 0 ${dims} ${dims}`} className="transform -rotate-90">
        <circle cx={mid} cy={mid} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-gray-100 dark:text-gray-800" />
        <motion.circle cx={mid} cy={mid} r={radius} fill="none" strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeDasharray={circ}
          className={isNext ? "text-emerald-500" : "text-brand-500"} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[7px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none">POS</span>
        <span className={`font-black leading-none tabular-nums ${isNext ? "text-emerald-600" : "text-brand-600 dark:text-brand-400"} ${size === "lg" ? "text-xl" : size === "sm" ? "text-xs" : "text-base"}`}>
          #{position}
        </span>
      </div>
    </div>
  );
}

function StatusBadgeInline({ status }: { status: string }) {
  if (status === "cancelled")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-[10px] font-bold border border-rose-200/50">
        <X size={10} />Cancelled
      </span>
    );
  if (status === "confirmed" || status === "in-progress") {
    const isActive = status === "in-progress";
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${isActive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200/50" : "bg-sky-50 dark:bg-sky-900/20 text-sky-600 border-sky-200/50"}`}>
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        {isActive ? "Active" : "Confirmed"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold capitalize">
      {status}
    </span>
  );
}

function HeroCard({ booking, queueData, onView }: { booking: Booking; queueData?: QueueEntry | null; onView: () => void }) {
  const isToday = fmtDate(new Date(booking.startTime)) === "Today";
  const isNext = queueData?.position === 1;
  const stylistName = booking.stylistId && typeof booking.stylistId === "object" ? (booking.stylistId as any).name || "Stylist" : "Stylist";
  const serviceName = booking.serviceId && typeof booking.serviceId === "object" ? (booking.serviceId as any).name || "Service" : "Service";
  const duration = booking.serviceId && typeof booking.serviceId === "object" ? (booking.serviceId as any).duration || 30 : 30;

  const accent = isNext ? "emerald" : isToday ? "brand" : "sky";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onView}
      className="relative bg-white dark:bg-surface-dark-secondary rounded-3xl border border-gray-100 dark:border-gray-700/40 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-gray-100/50 dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-300 mb-6 group"
    >
      {/* Top gradient accent */}
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${isNext ? "from-emerald-400 via-emerald-500 to-green-400" : isToday ? "from-brand-400 via-brand-500 to-rose-400" : "from-sky-400 via-sky-500 to-blue-400"}`} />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isNext ? "bg-emerald-50 dark:bg-emerald-900/20" : isToday ? "bg-brand-50 dark:bg-brand-900/20" : "bg-sky-50 dark:bg-sky-900/20"}`}>
              {isNext ? (
                <Sparkles size={18} className="text-emerald-500" />
              ) : isToday ? (
                <Zap size={18} className="text-brand-500" />
              ) : (
                <Calendar size={18} className="text-sky-500" />
              )}
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isNext ? "text-emerald-600 dark:text-emerald-400" : isToday ? "text-brand-600 dark:text-brand-400" : "text-sky-600 dark:text-sky-400"}`}>
                {isNext ? "You're next! ✨" : isToday ? "Today's appointment" : "Next appointment"}
              </span>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {isNext ? "Get ready, you're up!" : isToday ? "Your session is scheduled for today" : "Upcoming booking"}
              </p>
            </div>
          </div>
          <StatusBadgeInline status={booking.status} />
        </div>

        {/* Main content */}
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-0.5">
              {stylistName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{serviceName}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Calendar, text: fmtDateFull(booking.startTime) },
                { icon: Clock, text: fmtISO(booking.startTime) },
                { icon: Timer, text: `~${queueData ? queueData.estimatedServiceMins : duration}m` },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 font-medium border border-gray-100 dark:border-gray-700/30">
                  <Icon size={12} className="text-gray-400 dark:text-gray-500" />{text}
                </span>
              ))}
            </div>
          </div>

          {/* Queue position ring */}
          <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
            {queueData ? (
              <>
                <QueuePositionRing position={queueData.position} isNext={isNext} size="lg" />
                {isNext && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-200/50">
                    Go now
                  </span>
                )}
              </>
            ) : (
              <div className="w-[72px] h-[72px] rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-300 dark:text-gray-600 border border-gray-100 dark:border-gray-700/30">
                <Clock size={24} />
              </div>
            )}
          </div>
        </div>

        {/* Wait time bar */}
        {queueData && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(10, 100 - (queueData.position - 1) * 20)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${isNext ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-brand-400 to-rose-500"}`}
                />
              </div>
              <span className={`text-xs font-bold tabular-nums ${isNext ? "text-emerald-600 dark:text-emerald-400" : "text-brand-600 dark:text-brand-400"}`}>
                <Hourglass size={12} className="inline mr-1 -mt-0.5" />
                {fmtWait(queueData.estimatedWaitMins)}
              </span>
            </div>
            <p className={`text-[11px] mt-1.5 font-medium ${isNext ? "text-emerald-600 dark:text-emerald-400" : "text-brand-600 dark:text-brand-400"}`}>
              {queueData.estimatedWaitMins <= 0
                ? "You're up next — ready to go!"
                : `${queueData.position - 1} ${queueData.position - 1 === 1 ? "person" : "people"} ahead of you`}
            </p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3 bg-gradient-to-r from-gray-50 dark:from-gray-900/50 to-white dark:to-surface-dark-secondary border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1.5">
          <Info size={11} />
          Tap for full details
        </span>
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
          <span>View</span>
          <MoveRight size={12} />
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
  const stylistName = booking.stylistId && typeof booking.stylistId === "object" ? (booking.stylistId as any).name || "Stylist" : "Stylist";
  const serviceName = booking.serviceId && typeof booking.serviceId === "object" ? (booking.serviceId as any).name || "Service" : "Service";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onView}
      className={`group relative bg-white dark:bg-surface-dark-secondary rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 ${
        isCancelled
          ? "border-rose-200/50 dark:border-rose-900/30 opacity-55"
          : isToday
            ? "border-brand-100 dark:border-brand-900/30 hover:border-brand-200 dark:hover:border-brand-800/50 hover:shadow-lg hover:shadow-brand-50 dark:hover:shadow-black/20 hover:-translate-y-0.5"
            : "border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg hover:shadow-gray-50 dark:hover:shadow-black/10 hover:-translate-y-0.5"
      }`}
    >
      {/* Left accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isCancelled ? "bg-rose-400" : isToday ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />

      <div className="flex items-center gap-4 p-4 pl-5">
        {/* Time */}
        <div className="shrink-0 w-14 text-center">
          <p className="text-lg font-black text-gray-900 dark:text-gray-100 tabular-nums leading-none">
            {fmtISO(booking.startTime).split(" ")[0]}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
            {fmtISO(booking.startTime).split(" ")[1]}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-semibold truncate ${isCancelled ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-gray-100"}`}>
              {stylistName}
            </p>
            <StatusBadgeInline status={booking.status} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{serviceName}</p>
          {queueData && !isCancelled && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                queueData.estimatedWaitMins <= 5
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50"
                  : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200/50"
              }`}>
                <Timer size={10} />{fmtWait(queueData.estimatedWaitMins)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {queueData && <QueuePositionRing position={queueData.position} isNext={queueData.position === 1} size="sm" />}
          {!isCancelled && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
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
  const stylistName = booking.stylistId && typeof booking.stylistId === "object" ? (booking.stylistId as any).name || "Stylist" : "Stylist";
  const serviceName = booking.serviceId && typeof booking.serviceId === "object" ? (booking.serviceId as any).name || "Service" : "Service";
  const price = booking.serviceId && typeof booking.serviceId === "object" ? (booking.serviceId as any).price || booking.totalPrice : booking.totalPrice;
  const duration = booking.serviceId && typeof booking.serviceId === "object" ? (booking.serviceId as any).duration || 30 : 30;

  const handleCopy = () => { navigator.clipboard.writeText(booking._id); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-white dark:bg-surface-dark-secondary rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Top accent */}
        <div className={`h-1.5 ${isNext ? "bg-gradient-to-r from-emerald-400 to-green-500" : isToday ? "bg-gradient-to-r from-brand-400 to-rose-500" : cancelled ? "bg-gradient-to-r from-rose-400 to-red-300" : "bg-gradient-to-r from-sky-400 to-blue-500"}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold ${
              cancelled
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                : "bg-gradient-to-br from-brand-500 to-rose-600 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/30"
            }`}>
              {initials(stylistName)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{stylistName}</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500">{serviceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Queue status */}
          {isToday && !cancelled && queueData && (
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/40">
              <div className={`p-5 rounded-2xl border ${isNext ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 border-emerald-200 dark:border-emerald-800/30" : "bg-gradient-to-br from-brand-50 to-rose-50 dark:from-brand-900/20 dark:to-rose-900/10 border-brand-200 dark:border-brand-800/30"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <QueuePositionRing position={queueData.position} isNext={isNext} />
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${isNext ? "text-emerald-600 dark:text-emerald-400" : "text-brand-600 dark:text-brand-400"}`}>
                        {isNext ? "You're next! ✨" : "Queue status"}
                      </span>
                      <p className={`text-[11px] mt-0.5 font-medium ${isNext ? "text-emerald-500" : "text-brand-500"}`}>
                        {queueData.estimatedWaitMins <= 0 ? "Ready to go!" : `${queueData.position - 1} ahead`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xl font-black tabular-nums ${isNext ? "text-emerald-600 dark:text-emerald-400" : "text-brand-600 dark:text-brand-400"}`}>
                    {fmtWait(queueData.estimatedWaitMins)}
                  </span>
                </div>
                <div className="h-2.5 bg-white/60 dark:bg-gray-900/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(15, 100 - (queueData.position - 1) * 20)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full ${isNext ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-brand-400 to-rose-500"}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Booking details */}
          <div className="px-6 py-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 space-y-3 border border-gray-100 dark:border-gray-800">
              {[
                { label: "Date", value: fmtDateFull(booking.startTime), icon: Calendar },
                { label: "Time", value: `${fmtISO(booking.startTime)} – ${fmtEndTime(booking.startTime, duration)}`, icon: Clock },
                { label: "Duration", value: `${duration} min`, icon: Timer },
                { label: "Price", value: `$${price}.00`, icon: Star },
              ].map(({ label, value, icon: Icon }, i, arr) => (
                <div key={label} className={`flex items-center justify-between ${i < arr.length - 1 ? "pb-3 border-b border-white/60 dark:border-gray-800" : ""}`}>
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-medium flex items-center gap-2">
                    <Icon size={12} className="text-gray-300 dark:text-gray-600" />
                    {label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking ID */}
          <div className="px-6 py-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700/40">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Booking ID</p>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{booking._id.slice(0, 12)}…</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                {copied ? <><CheckCircle size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Policy */}
          <div className="px-6 py-3">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/5 border border-amber-200 dark:border-amber-800/30">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Info size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Cancellation policy</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">Free cancellation up to 24 hours before. Late cancellations incur a 50% fee.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700/40 shrink-0 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
          {!cancelled && (
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 text-sm font-bold text-white hover:from-rose-600 hover:to-red-600 shadow-lg shadow-rose-200 dark:shadow-rose-900/30 transition-all"
            >
              Cancel
            </button>
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
      const sid = b.stylistId && typeof b.stylistId === "object" ? (b.stylistId as any)._id : b.stylistId;
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
        const name = b.stylistId && typeof b.stylistId === "object" ? (b.stylistId as any).name || "" : "";
        const svcName = b.serviceId && typeof b.serviceId === "object" ? (b.serviceId as any).name || "" : "";
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
    const stylistId = booking.stylistId && typeof booking.stylistId === "object" ? (booking.stylistId as any)._id : booking.stylistId;
    const q = queues[stylistId];
    if (!q) return null;
    return q.entries.find((e) => e.userId === (booking.clientId && typeof booking.clientId === "object" ? (booking.clientId as any)?._id : booking.clientId)) || null;
  };

  const statCards = [
    { label: "Today", value: counts.today, icon: Zap, color: { bg: "bg-gradient-to-br from-brand-50 to-rose-50 dark:from-brand-900/20 dark:to-rose-900/10", text: "text-brand-600 dark:text-brand-400", icon: "text-brand-500", border: "border-brand-200 dark:border-brand-800/30" } },
    { label: "Upcoming", value: counts.upcoming, icon: Calendar, color: { bg: "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/10", text: "text-sky-600 dark:text-sky-400", icon: "text-sky-500", border: "border-sky-200 dark:border-sky-800/30" } },
    { label: "Cancelled", value: counts.cancelled, icon: X, color: { bg: "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/10", text: "text-rose-500 dark:text-rose-400", icon: "text-rose-400", border: "border-rose-200 dark:border-rose-800/30" } },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-surface-dark-secondary">
      {/* Header section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-brand-50/40 to-transparent dark:from-brand-900/10 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-tr from-rose-50/30 to-transparent dark:from-rose-900/5 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-5 pt-12 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1.5">My Schedule</p>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Queue &<br />
                <span className="bg-gradient-to-r from-brand-500 to-rose-500 bg-clip-text text-transparent">Appointments</span>
              </h1>
            </div>
            <button className="w-11 h-11 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/40 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-black/20 transition-all duration-200">
              <Bell size={20} />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[200, 96, 96, 96].map((h, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/40 skeleton-pulse" style={{ height: h }} />
              ))}
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {statCards.map((s) => (
                  <div key={s.label} className={`bg-white dark:bg-gray-900/30 rounded-2xl border ${s.color.border} p-4 hover:shadow-md hover:shadow-gray-100 dark:hover:shadow-black/10 transition-all duration-200`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color.bg}`}>
                        <s.icon size={18} className={s.color.icon} />
                      </div>
                      <span className={`text-2xl font-black tabular-nums ${s.color.text}`}>{s.value}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Hero card */}
              {heroBooking && filter !== "cancelled" && (
                <HeroCard booking={heroBooking} queueData={getQueueForBooking(heroBooking)} onView={() => setDetailBooking(heroBooking)} />
              )}

              {/* Filters + search */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
                  {[
                    { key: "all" as FilterKey, label: "All" },
                    { key: "today" as FilterKey, label: "Today" },
                    { key: "upcoming" as FilterKey, label: "Upcoming" },
                    { key: "cancelled" as FilterKey, label: "Cancelled" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        filter === key
                          ? "bg-gradient-to-r from-brand-500 to-rose-500 text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/30"
                          : "bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/40"
                      }`}
                    >
                      {label}
                      {counts[key] > 0 && (
                        <span className={`text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full inline-flex items-center justify-center ${
                          filter === key ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        }`}>
                          {counts[key]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="relative shrink-0">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search appointments…"
                    className="w-full sm:w-56 pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/40 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-brand-300 dark:focus:border-brand-700 focus:ring-2 focus:ring-brand-50 dark:focus:ring-brand-900/20 transition-all"
                  />
                </div>
              </div>

              {/* Booking list */}
              {filtered.length === 0 ? (
                <EmptyState icon={Calendar} title="No bookings yet" sub="Your appointments will appear here once you book a stylist." />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={`${filter}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    {grouped.map(([dateLabel, items]) => (
                      <div key={dateLabel} className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">{dateLabel}</h3>
                          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent" />
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700/40">
                            {items.length}
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {items.map((b, i) => (
                            <BookingRow
                              key={b._id}
                              booking={b}
                              queueData={getQueueForBooking(b)}
                              onView={() => setDetailBooking(b)}
                              onCancel={() => setCancelTarget(b)}
                              index={i}
                            />
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

      {/* Modals */}
      <AnimatePresence>
        {detailBooking && (
          <DetailModal
            booking={detailBooking}
            queueData={getQueueForBooking(detailBooking)}
            onClose={() => setDetailBooking(null)}
            onCancel={() => { setCancelTarget(detailBooking); setDetailBooking(null); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal
            booking={cancelTarget}
            onConfirm={handleCancel}
            onClose={() => setCancelTarget(null)}
            loading={cancellingId === cancelTarget._id}
          />
        )}
      </AnimatePresence>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
