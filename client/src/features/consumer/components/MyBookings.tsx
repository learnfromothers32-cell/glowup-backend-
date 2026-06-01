import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMyBookings,
  cancelBooking,
  updateBookingStatus,
} from "../../../api/bookings";
import api from "../../../api/axios";
import { getStylists } from "../../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Info,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  CalendarCheck,
  CalendarClock,
  CalendarX,
} from "lucide-react";
import { useGamification } from "../../../hooks/useGamification";
import { getLocationString } from "@/utils/location";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterKey = "all" | "today" | "upcoming" | "past" | "cancelled";

interface Booking {
  bookingId: string;
  _id?: string;
  date: string;
  time: string;
  service: string;
  stylistId: string;
  status: string;
  totalPrice?: number;
  reviewSubmitted?: boolean;
  _original: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  const t = new Date();
  const tm = new Date(t);
  tm.setDate(t.getDate() + 1);
  if (date.toDateString() === t.toDateString()) return "Today";
  if (date.toDateString() === tm.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(`2000-01-01T${d}:00`) : d;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Adapting backend booking to frontend UI expectation
function adaptBooking(b: any) {
  const start = new Date(b.startTime);
  return {
    ...b,
    bookingId: b._id,
    date: start.toISOString().split("T")[0],
    time: start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    service: b.serviceId?.name || "Service",
    stylistId: b.stylistId?._id || b.stylistId,
    totalPrice: b.totalPrice,
    status: b.status,
    reviewSubmitted: !!b.reviewId, // Assuming backend provides this
    _original: b
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Calendar;
  color: { bg: string; text: string; border: string; icon: string };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2.5">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${color.bg}`}
        >
          <Icon size={16} className={color.icon} />
        </div>
        <span className={`text-2xl font-bold tabular-nums ${color.text}`}>
          {value}
        </span>
      </div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────────────────────
function FilterPills({
  active,
  onChange,
  counts,
}: {
  active: FilterKey;
  onChange: (f: FilterKey) => void;
  counts: Record<FilterKey, number>;
}) {
  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {filters.map(({ key, label }) => {
        const on = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              transition-all duration-200
              ${
                on
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }
            `}
          >
            {label}
            {counts[key] > 0 && (
              <span
                className={`
                text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full inline-flex items-center justify-center
                ${on ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}
              `}
              >
                {counts[key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, date }: { status: string; date: string }) {
  const isToday = fmtDate(date) === "Today";
  const isPast = new Date(date + "T00:00:00") < new Date();

  if (status === "cancelled")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
        <X size={8} />
        Cancelled
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">
        <Clock size={8} />
        Pending
      </span>
    );
  if (isToday)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-bold">
        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
        Today
      </span>
    );
  if (isPast)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">
        <CheckCircle size={8} />
        Done
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">
      <CheckCircle size={8} />
      Confirmed
    </span>
  );
}

// ─── Booking Row ──────────────────────────────────────────────────────────────
function BookingRow({
  booking,
  stylist,
  filterKey,
  onCancel,
  onReschedule,
  onReview,
  onView,
  actionLoading,
}: {
  booking: Booking;
  stylist?: Stylist;
  filterKey: FilterKey;
  onCancel: () => void;
  onReschedule: () => void;
  onReview: () => void;
  onView: () => void;
  actionLoading: string | null;
}) {
  const isBusy = actionLoading === booking.bookingId;
  const isCancelled = booking.status === "cancelled";
  const isPast =
    filterKey === "past" ||
    (booking.status === "confirmed" && booking.date < todayStr());
  const showReview = isPast && !booking.reviewSubmitted;
  const showActions = !isCancelled && !isPast;

  return (
    <motion.div
      onClick={onView}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer
        hover:border-gray-200 hover:shadow-md transition-all duration-200
        ${isCancelled ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Time column */}
        <div className="shrink-0 w-16 text-center">
          <p className="text-sm font-bold text-gray-900 tabular-nums">
            {fmtTime(booking.time).split(" ")[0]}
          </p>
          <p className="text-[10px] text-gray-400 font-medium">
            {fmtTime(booking.time).split(" ")[1]}
          </p>
        </div>

        {/* Vertical divider */}
        <div
          className={`w-px h-10 shrink-0 ${
            isCancelled
              ? "bg-red-200"
              : fmtDate(booking.date) === "Today"
                ? "bg-green-300"
                : "bg-gray-200"
          }`}
        />

        {/* Avatar */}
        <div className="shrink-0">
          {stylist?.image ? (
            <img
              src={stylist.image}
              alt={stylist.name}
              className={`w-11 h-11 rounded-xl object-cover ring-1 ring-gray-100 ${isCancelled ? "grayscale" : ""}`}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-400">
                {initials(stylist?.name || "S")}
              </span>
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p
              className={`text-sm font-semibold truncate ${isCancelled ? "text-gray-400 line-through" : "text-gray-900"}`}
            >
              {stylist?.name || "Stylist"}
            </p>
            <StatusBadge status={booking.status} date={booking.date} />
          </div>
          <p className="text-xs text-gray-500 truncate">{booking.service}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {fmtDate(booking.date)}
            </span>
            {stylist?.location && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                {getLocationString(stylist.location)}
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          {booking.totalPrice && (
            <p
              className={`text-sm font-bold ${isCancelled ? "text-gray-300" : "text-gray-900"}`}
            >
              {booking.totalPrice}
            </p>
          )}

          {/* Review stars if reviewed */}
          {isPast && booking.reviewSubmitted && (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={10}
                  fill="#f59e0b"
                  className="text-amber-400"
                />
              ))}
            </div>
          )}

          {/* Inline actions on hover */}
          {showActions && (
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule();
                }}
                disabled={isBusy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <RotateCcw size={10} />
                Reschedule
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                disabled={isBusy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-400 hover:border-red-200 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all"
              >
                {isBusy ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <X size={10} />
                )}
                Cancel
              </button>
            </div>
          )}

          {showReview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-gray-800 shadow-sm transition-all"
            >
              <Star size={10} />
              Review
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filter }: { filter: FilterKey }) {
  const msgs: Record<
    FilterKey,
    { icon: typeof Calendar; title: string; sub: string }
  > = {
    all: {
      icon: Calendar,
      title: "No bookings yet",
      sub: "Your appointments will appear here once you book a stylist.",
    },
    today: {
      icon: CalendarCheck,
      title: "Nothing scheduled today",
      sub: "You have no appointments today. Browse stylists to book one!",
    },
    upcoming: {
      icon: CalendarClock,
      title: "No upcoming bookings",
      sub: "Your confirmed future appointments will appear here.",
    },
    past: {
      icon: CheckCircle,
      title: "No past bookings",
      sub: "Completed appointments will be shown here.",
    },
    cancelled: {
      icon: CalendarX,
      title: "No cancelled bookings",
      sub: "You haven't cancelled any bookings.",
    },
  };
  const m = msgs[filter];
  const Icon = m.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Icon size={28} className="text-gray-300" />
      </div>
      <p className="text-base font-semibold text-gray-700 mb-1">{m.title}</p>
      <p className="text-sm text-gray-400 max-w-[280px] leading-relaxed">
        {m.sub}
      </p>
    </div>
  );
}

// ─── Centered Modal Wrapper ───────────────────────────────────────────────────
function Modal({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col ${
          wide ? "w-full max-w-lg" : "w-full max-w-md"
        }`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

function generateDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

// ─── Reschedule Modal ─────────────────────────────────────────────────────────
function RescheduleModal({
  booking,
  stylist,
  newDate,
  newTime,
  onDateChange,
  onTimeChange,
  onConfirm,
  onClose,
  loading,
}: {
  booking: Booking;
  stylist?: Stylist;
  newDate: string;
  newTime: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const fmtSlot = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  return (
    <Modal onClose={onClose} wide>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Reschedule</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {stylist?.name} · {booking.service}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Current */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <Info size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            Currently: <strong>{fmtDate(booking.date)}</strong> at{" "}
            <strong>{fmtTime(booking.time)}</strong>
          </p>
        </div>

        {/* Date */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
            Date
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {generateDates().map((d) => {
              const sel = d === newDate;
              const dt = new Date(d + "T00:00:00");
              return (
                <button
                  key={d}
                  onClick={() => onDateChange(d)}
                  className={`shrink-0 flex flex-col items-center py-2.5 px-3 rounded-xl border min-w-[56px] transition-all ${
                    sel
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase ${sel ? "text-gray-400" : "text-gray-400"}`}
                  >
                    {fmtDate(d) === "Today"
                      ? "Today"
                      : dt.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span
                    className={`text-lg font-bold ${sel ? "text-white" : "text-gray-900"}`}
                  >
                    {dt.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
            Time
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => onTimeChange(t)}
                className={`py-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                  t === newTime
                    ? "border-gray-900 bg-gray-900 text-white shadow-md"
                    : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                }`}
              >
                {fmtSlot(t)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onConfirm}
          disabled={loading || !newDate || !newTime}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            loading || !newDate || !newTime
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800 shadow-md"
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Rescheduling…
            </>
          ) : (
            <>
              <RotateCcw size={14} />
              Confirm Reschedule
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  booking,
  stylist,
  rating,
  comment,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onClose,
  loading,
}: {
  booking: Booking;
  stylist?: Stylist;
  rating: number;
  comment: string;
  onRatingChange: (r: number) => void;
  onCommentChange: (c: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || rating;
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Leave a Review
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {stylist?.name} · {fmtDate(booking.date)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700">
              Earn 20 reward points
            </p>
            <p className="text-[11px] text-amber-500">
              Share your experience to earn points.
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">
            How was it?
          </p>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => onRatingChange(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={30}
                  className={display >= s ? "text-amber-400" : "text-gray-200"}
                  fill={display >= s ? "#f59e0b" : "none"}
                />
              </button>
            ))}
          </div>
          {display > 0 && (
            <p className="text-sm font-bold text-amber-500">
              {labels[display]}
            </p>
          )}
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Comments <span className="normal-case font-normal">(optional)</span>
          </p>
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Share your experience…"
            maxLength={400}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-300 resize-none focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
          />
          <p className="text-right text-[11px] text-gray-300 mt-1">
            {comment.length}/400
          </p>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800 shadow-md"
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <MessageSquare size={14} />
              Submit Review
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
function CancelModal({
  booking,
  stylist,
  onConfirm,
  onClose,
  loading,
}: {
  booking: Booking;
  stylist?: Stylist;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="h-1 bg-gradient-to-r from-red-500 to-red-300" />
      <div className="p-5">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          Cancel this booking?
        </h3>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 mb-3">
          <div className="flex items-center gap-3">
            {stylist?.image ? (
              <img
                src={stylist.image}
                alt={stylist.name}
                className="w-9 h-9 rounded-lg object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-400">
                  {initials(stylist?.name || "S")}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {stylist?.name}
              </p>
              <p className="text-xs text-gray-500">{booking.service}</p>
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Calendar size={10} />
                {fmtDate(booking.date)} at {fmtTime(booking.time)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
          <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Late cancellations within 24 hours may incur a fee.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              loading
                ? "bg-red-100 text-red-400 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cancelling…
              </>
            ) : (
              "Yes, cancel"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Booking Detail Modal ──────────────────────────────────────────────────────
function BookingDetailModal({
  booking,
  stylist,
  onClose,
}: {
  booking: Booking;
  stylist?: Stylist;
  onClose: () => void;
}) {
  const isCancelled = booking.status === "cancelled";
  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Booking Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {booking.service}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Stylist info */}
        <div className="flex items-center gap-3">
          {stylist?.image ? (
            <img
              src={stylist.image}
              alt={stylist.name}
              className={`w-12 h-12 rounded-xl object-cover ring-1 ring-gray-100 ${isCancelled ? "grayscale" : ""}`}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-400">
                {initials(stylist?.name || "S")}
              </span>
            </div>
          )}
          <div>
            <p className={`text-sm font-semibold ${isCancelled ? "text-gray-400 line-through" : "text-gray-900"}`}>
              {stylist?.name || "Stylist"}
            </p>
            <p className="text-xs text-gray-500">
              <StatusBadge status={booking.status} date={booking.date} />
            </p>
          </div>
        </div>

        {/* Booking info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Date</p>
            <p className="text-sm font-semibold text-gray-900">{fmtDate(booking.date)}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Time</p>
            <p className="text-sm font-semibold text-gray-900">{fmtTime(booking.time)}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Status</p>
            <p><StatusBadge status={booking.status} date={booking.date} /></p>
          </div>
          {booking.totalPrice && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Price</p>
              <p className="text-sm font-semibold text-gray-900">${booking.totalPrice}</p>
            </div>
          )}
        </div>

        {/* Stylist location */}
        {stylist?.location && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <p className="text-xs text-gray-600">{getLocationString(stylist.location)}</p>
          </div>
        )}

        {/* Booking ID */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Booking ID</p>
          <p className="text-xs text-gray-500 font-mono">{booking.bookingId}</p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 z-[400] pointer-events-none flex items-center gap-2 px-5 py-3 rounded-full bg-gray-900 text-white text-sm font-medium shadow-xl whitespace-nowrap transition-all duration-300 ${
        visible
          ? "-translate-x-1/2 translate-y-0 opacity-100"
          : "-translate-x-1/2 translate-y-5 opacity-0"
      }`}
    >
      <CheckCircle size={15} className="text-green-400" />
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stylists, setStylists] = useState<Record<string, Stylist>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<any | null>(null);
  const [reschedule, setReschedule] = useState<any | null>(null);
  const [review, setReview] = useState<any | null>(null);
  const [cancel, setCancel] = useState<any | null>(null);

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState({ message: "", visible: false });

  const { addPoints, incrementAction } = useGamification();
  const today = todayStr();

  const flash = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  const fetchBookings = useCallback(async () => {
    setError(null);
    try {
      const [b, s] = await Promise.all([getMyBookings(), getStylists()]);
      setBookings(b.map(adaptBooking));
      const m: Record<string, Stylist> = {};
      s.forEach((x) => {
        m[x.id] = x;
      });
      setStylists(m);
    } catch (err: any) {
      console.error("Failed to load bookings:", err);
      setError(err.response?.data?.message || err.message || "Failed to load bookings. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    const onVisible = () => { if (document.visibilityState === "visible") fetchBookings(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchBookings]);

  // ── Counts ──
  const counts = useMemo<Record<FilterKey, number>>(
    () => ({
      all: bookings.length,
      today: bookings.filter(
        (b) => (b.status === "pending" || b.status === "confirmed") && b.date === today,
      ).length,
      upcoming: bookings.filter(
        (b) => (b.status === "pending" || b.status === "confirmed") && b.date > today,
      ).length,
      past: bookings.filter((b) => (b.status === "confirmed" || b.status === "completed") && b.date < today)
        .length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings, today],
  );

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let list = [...bookings];
    if (filter === "today")
      list = list.filter((b) => (b.status === "pending" || b.status === "confirmed") && b.date === today);
    else if (filter === "upcoming")
      list = list.filter((b) => (b.status === "pending" || b.status === "confirmed") && b.date > today);
    else if (filter === "past")
      list = list.filter((b) => (b.status === "confirmed" || b.status === "completed") && b.date < today);
    else if (filter === "cancelled")
      list = list.filter((b) => b.status === "cancelled");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        const s = stylists[b.stylistId];
        return (
          b.service.toLowerCase().includes(q) ||
          s?.name.toLowerCase().includes(q) ||
          b.date.includes(q)
        );
      });
    }

    list.sort((a, b) => {
      if (a.date === b.date) return a.time.localeCompare(b.time);
      return a.date.localeCompare(b.date);
    });

    return list;
  }, [bookings, filter, search, stylists, today]);

  // ── Handlers ──
  const handleCancel = useCallback(async () => {
    if (!cancel) return;
    setActionLoading(cancel.bookingId);
    try {
      await cancelBooking(cancel.bookingId);
      await fetchBookings();
      setCancel(null);
      flash("Booking cancelled");
    } catch {
      flash("Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  }, [cancel, fetchBookings]);

  const handleReschedule = useCallback(async () => {
    if (!reschedule || !newDate || !newTime) return;
    setActionLoading(reschedule.bookingId);
    try {
      const startDateTime = new Date(`${newDate}T${newTime}:00`);
      await api.patch(`/bookings/${reschedule.bookingId}/reschedule`, { 
        startTime: startDateTime.toISOString() 
      });
      await fetchBookings();
      setReschedule(null);
      flash("Booking rescheduled");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Reschedule failed";
      flash(msg);
    } finally {
      setActionLoading(null);
    }
  }, [reschedule, newDate, newTime, fetchBookings]);

  const handleReview = useCallback(async () => {
    if (!review) return;
    setActionLoading(review.bookingId);
    try {
      await api.post('/reviews', { 
        bookingId: review.bookingId, 
        rating, 
        comment 
      });
      addPoints(20);
      incrementAction("reviews");
      await fetchBookings();
      setReview(null);
      flash("Review submitted · +20 pts");
    } catch {
      flash("Failed to submit review");
    } finally {
      setActionLoading(null);
    }
  }, [review, rating, comment, addPoints, incrementAction, fetchBookings]);

  // ── Group by date for display ──
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filtered.forEach((b) => {
      const key = fmtDate(new Date(b._original.startTime));
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return Object.entries(groups);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {/* ── Header ── */}
        <div className="pt-14 pb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            My Bookings
          </h1>
          <p className="text-sm text-gray-400">
            Manage your appointments and schedule
          </p>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchBookings}
                className="text-xs font-medium text-red-600 hover:text-red-800 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Today"
            value={counts.today}
            icon={CalendarCheck}
            color={{
              bg: "bg-green-50",
              text: "text-green-700",
              border: "border-green-100",
              icon: "text-green-500",
            }}
          />
          <StatCard
            label="Upcoming"
            value={counts.upcoming}
            icon={CalendarClock}
            color={{
              bg: "bg-blue-50",
              text: "text-blue-700",
              border: "border-blue-100",
              icon: "text-blue-500",
            }}
          />
          <StatCard
            label="Completed"
            value={counts.past}
            icon={CheckCircle}
            color={{
              bg: "bg-gray-50",
              text: "text-gray-700",
              border: "border-gray-100",
              icon: "text-gray-500",
            }}
          />
          <StatCard
            label="Cancelled"
            value={counts.cancelled}
            icon={CalendarX}
            color={{
              bg: "bg-red-50",
              text: "text-red-600",
              border: "border-red-100",
              icon: "text-red-400",
            }}
          />
        </div>

        {/* ── Filters + Search ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <FilterPills active={filter} onChange={setFilter} counts={counts} />
          </div>
          <div className="relative shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full sm:w-48 pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
            />
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-white border border-gray-100 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {grouped.map(([dateLabel, items]) => (
                <div key={dateLabel} className="mb-6">
                  {/* Date group header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {dateLabel}
                    </h3>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-bold text-gray-300">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((b) => (
                      <BookingRow
                        key={b.bookingId}
                        booking={b}
                        stylist={stylists[b.stylistId]}
                        filterKey={filter}
                        onCancel={() => setCancel(b)}
                        onReschedule={() => {
                          setReschedule(b);
                          setNewDate(b.date);
                          setNewTime(b.time);
                        }}
                        onReview={() => {
                          setReview(b);
                          setRating(5);
                          setComment("");
                        }}
                        onView={() => setDetail(b)}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {reschedule && (
          <RescheduleModal
            key="reschedule"
            booking={reschedule}
            stylist={stylists[reschedule.stylistId]}
            newDate={newDate}
            newTime={newTime}
            onDateChange={setNewDate}
            onTimeChange={setNewTime}
            onConfirm={handleReschedule}
            onClose={() => setReschedule(null)}
            loading={actionLoading === reschedule.bookingId}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {review && (
          <ReviewModal
            key="review"
            booking={review}
            stylist={stylists[review.stylistId]}
            rating={rating}
            comment={comment}
            onRatingChange={setRating}
            onCommentChange={setComment}
            onSubmit={handleReview}
            onClose={() => setReview(null)}
            loading={actionLoading === review.bookingId}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cancel && (
          <CancelModal
            key="cancel"
            booking={cancel}
            stylist={stylists[cancel.stylistId]}
            onConfirm={handleCancel}
            onClose={() => setCancel(null)}
            loading={actionLoading === cancel.bookingId}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detail && (
          <BookingDetailModal
            key="detail"
            booking={detail}
            stylist={stylists[detail.stylistId]}
            onClose={() => setDetail(null)}
          />
        )}
      </AnimatePresence>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
