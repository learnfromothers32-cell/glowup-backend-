import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Calendar, X, CheckCircle, Bell, Timer,
  AlertTriangle, Loader2,
  ChevronRight, Star, Info,  Search,
   Zap,

} from "lucide-react";
import { getMyBookings, cancelBooking } from "../../../api/bookings";
import {
  connectQueue, disconnectQueue,
  subscribeToQueue, unsubscribeFromQueue,
  getMyQueueStatus
} from "../../../services/socket";

interface Booking {
  _id: string;
  clientId?: { _id: string; name: string; email?: string; avatar?: string };
  stylistId: { _id: string; name: string; image?: string; category?: string };
  serviceId: { _id: string; name: string; duration: number; price: number };
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  totalPrice: number;
  notes?: string;
}

interface QueueEntry {
  userId: string;
  position: number;
  status: string;
  estimatedServiceMins: number;
  joinedAt: string;
}

interface QueueData {
  id: string;
  stylistId: string;
  currentPosition: number;
  predictedWaitMins: number;
  entries: QueueEntry[];
}

type FilterKey = "all" | "upcoming" | "today" | "cancelled";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  const tm = new Date(t); tm.setDate(t.getDate() + 1);
  if (d.toDateString() === t.toDateString()) return "Today";
  if (d.toDateString() === tm.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
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

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "cancelled") return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
      <X size={8} />Cancelled
    </span>
  );
  if (status === "confirmed" || status === "in-progress") {
    const isActive = status === "in-progress";
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${
        isActive ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-600"
      }`}>
        {isActive && <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />}
        {isActive ? "Active" : "Confirmed"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-gray-500 text-[10px] font-bold">
      {status}
    </span>
  );
}

function QueueBadge({ position, size = "sm" }: { position: number; size?: "sm" | "lg" }) {
  const isNext = position === 1;
  const dims = size === "lg" ? "w-16 h-16" : "w-11 h-11";
  const numSize = size === "lg" ? "text-2xl" : "text-base";
  const labelSize = size === "lg" ? "text-[9px]" : "text-[8px]";

  return (
    <div className={`${dims} rounded-xl flex flex-col items-center justify-center shrink-0 ${
      isNext
        ? "bg-green-50 border border-green-200"
        : "bg-amber-50 border border-amber-200"
    }`}>
      <span className={`${labelSize} font-bold uppercase tracking-wider ${
        isNext ? "text-green-600" : "text-amber-600"
      }`}>Queue</span>
      <span className={`${numSize} font-black tabular-nums leading-none ${
        isNext ? "text-green-700" : "text-amber-700"
      }`}>#{position}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number;
  icon: typeof Calendar;
  color: { bg: string; text: string; icon: string };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color.bg}`}>
          <Icon size={16} className={color.icon} />
        </div>
        <span className={`text-2xl font-bold tabular-nums ${color.text}`}>{value}</span>
      </div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

function HeroCard({ booking, queueData, onView }: {
  booking: Booking & { queueData?: QueueEntry | null };
  queueData?: QueueEntry | null;
  onView: () => void;
}) {
  const isToday = fmtDate(booking.startTime) === "Today";
  const isNext = queueData?.position === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onView}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-gray-100 transition-all duration-200 mb-6"
    >
      <div className={`h-1 ${isNext ? "bg-green-500" : isToday ? "bg-amber-400" : "bg-blue-500"}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
              isNext ? "bg-green-100" : isToday ? "bg-amber-100" : "bg-blue-100"
            }`}>
              <Zap size={12} className={isNext ? "text-green-600" : isToday ? "text-amber-600" : "text-blue-600"} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isNext ? "text-green-600" : isToday ? "text-amber-600" : "text-blue-600"
            }`}>
              {isNext ? "You're next!" : isToday ? "Live now" : "Next appointment"}
            </span>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-0.5">
              {typeof booking.stylistId === "object" ? booking.stylistId.name : "Stylist"}
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              {typeof booking.serviceId === "object" ? booking.serviceId.name : "Service"}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[
                { icon: Calendar, text: fmtDate(booking.startTime) },
                { icon: Clock, text: fmtTime(booking.startTime) },
                { icon: Timer, text: `~${queueData ? queueData.estimatedServiceMins : "—"}m` },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600 font-medium">
                  <Icon size={11} className="text-gray-400" />
                  {text}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-1">
            {queueData ? (
              <>
                <QueueBadge position={queueData.position} size="lg" />
                {isNext && (
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Go now</span>
                )}
              </>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                <Clock size={20} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
        <span className="text-xs text-gray-400">Tap for full details</span>
        <ChevronRight size={14} className="text-gray-300" />
      </div>
    </motion.div>
  );
}

function BookingRow({ booking, queueData, onView, onCancel, index }: {
  booking: Booking;
  queueData?: QueueEntry | null;
  onView: () => void;
  onCancel: () => void;
  index: number;
}) {
  const isToday = fmtDate(booking.startTime) === "Today";
  const isCancelled = booking.status === "cancelled";
  const stylistName = typeof booking.stylistId === "object" ? booking.stylistId.name : "Stylist";
  const serviceName = typeof booking.serviceId === "object" ? booking.serviceId.name : "Service";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onView}
      className={`
        group bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer
        hover:border-gray-200 hover:shadow-md transition-all duration-200
        ${isCancelled ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="shrink-0 w-14 text-center">
          <p className="text-sm font-bold text-gray-900 tabular-nums">
            {fmtTime(booking.startTime).split(" ")[0]}
          </p>
          <p className="text-[10px] text-gray-400 font-medium">
            {fmtTime(booking.startTime).split(" ")[1]}
          </p>
        </div>

        <div className={`w-px h-10 shrink-0 ${
          isCancelled ? "bg-red-200" : isToday ? "bg-green-300" : "bg-gray-200"
        }`} />

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
          isCancelled ? "bg-gray-100 text-gray-400" : "bg-gray-900 text-white"
        }`}>
          {initials(stylistName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate ${isCancelled ? "text-gray-400 line-through" : "text-gray-900"}`}>
              {stylistName}
            </p>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-xs text-gray-500 truncate">{serviceName}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={10} />{fmtDate(booking.startTime)}
            </span>
            {queueData && !isCancelled && (
              <span className={`flex items-center gap-1 font-medium ${
                queueData.estimatedServiceMins <= 10 ? "text-green-600" : "text-amber-600"
              }`}>
                <Timer size={10} />~{queueData.estimatedServiceMins}m
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {queueData ? (
            <QueueBadge position={queueData.position} size="sm" />
          ) : null}

          {!isCancelled && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-400 hover:border-red-200 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={10} />Cancel
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const msgs: Record<string, { icon: typeof Calendar; title: string; sub: string }> = {
    all: { icon: Calendar, title: "No bookings yet", sub: "Your appointments will appear here once you book a stylist." },
    today: { icon: Clock, title: "Nothing today", sub: "You have no appointments scheduled for today." },
    upcoming: { icon: Calendar, title: "No upcoming bookings", sub: "Your confirmed future appointments will appear here." },
    cancelled: { icon: X, title: "No cancelled bookings", sub: "You haven't cancelled any bookings." },
  };
  const m = msgs[filter] || msgs.all;
  const Icon = m.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Icon size={28} className="text-gray-300" />
      </div>
      <p className="text-base font-semibold text-gray-700 mb-1">{m.title}</p>
      <p className="text-sm text-gray-400 max-w-[280px] leading-relaxed">{m.sub}</p>
    </div>
  );
}

function DetailModal({ booking, queueData, onClose, onCancel }: {
  booking: Booking;
  queueData?: QueueEntry | null;
  onClose: () => void;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isToday = fmtDate(booking.startTime) === "Today";
  const isNext = queueData?.position === 1;
  const cancelled = booking.status === "cancelled";
  const stylistName = typeof booking.stylistId === "object" ? booking.stylistId.name : "Stylist";
  const serviceName = typeof booking.serviceId === "object" ? booking.serviceId.name : "Service";
  const price = typeof booking.serviceId === "object" ? booking.serviceId.price : booking.totalPrice;
  const duration = typeof booking.serviceId === "object" ? booking.serviceId.duration : 30;

  const handleCopy = () => {
    navigator.clipboard.writeText(booking._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className={`h-1 ${isNext ? "bg-green-500" : isToday ? "bg-amber-400" : cancelled ? "bg-red-400" : "bg-blue-500"}`} />

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold ${
              cancelled ? "bg-gray-100 text-gray-400" : "bg-gray-900 text-white"
            }`}>
              {initials(stylistName)}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{stylistName}</h2>
              <p className="text-xs text-gray-400">{serviceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isToday && !cancelled && queueData && (
            <div className="px-5 py-4 border-b border-gray-100">
              <div className={`p-4 rounded-xl ${isNext ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isNext ? "text-green-600" : "text-amber-600"}`}>
                    {isNext ? "You're next!" : "Queue status"}
                  </span>
                  <span className={`text-sm font-bold ${isNext ? "text-green-700" : "text-amber-700"}`}>
                    ~{queueData.estimatedServiceMins} min
                  </span>
                </div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(15, 100 - (queueData.position - 1) * 15)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${isNext ? "bg-green-500" : "bg-amber-500"}`}
                  />
                </div>
                <p className={`text-xs mt-2 ${isNext ? "text-green-600" : "text-amber-600"}`}>
                  {isNext
                    ? "Please make your way to the salon now"
                    : `${queueData.position - 1} ${queueData.position - 1 === 1 ? "person" : "people"} ahead of you`}
                </p>
              </div>
            </div>
          )}

          <div className="px-5 py-3">
            {[
              { label: "Date", value: fmtDateFull(booking.startTime) },
              { label: "Time", value: `${fmtTime(booking.startTime)} – ${fmtEndTime(booking.startTime, duration)}` },
              { label: "Duration", value: `${duration} min` },
              { label: "Price", value: `$${price}.00` },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between py-3 ${
                i < arr.length - 1 ? "border-b border-gray-50" : ""
              }`}>
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Booking ID</p>
                <p className="text-xs font-mono text-gray-600">{booking._id}</p>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all">
                {copied ? <><CheckCircle size={12} className="text-green-600" />Copied</> : "Copy"}
              </button>
            </div>
          </div>

          <div className="px-5 py-3">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
              <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-700">Cancellation policy</p>
                <p className="text-xs text-amber-500 mt-0.5 leading-relaxed">Free cancellation up to 24 hours before. Late cancellations incur a 50% fee.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
          {!cancelled && (
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
              Cancel appointment
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CancelModal({ booking, onConfirm, onClose, loading }: {
  booking: Booking; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  const stylistName = typeof booking.stylistId === "object" ? booking.stylistId.name : "Stylist";
  const serviceName = typeof booking.serviceId === "object" ? booking.serviceId.name : "Service";
  const price = typeof booking.serviceId === "object" ? booking.serviceId.price : booking.totalPrice;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="h-1 bg-gradient-to-r from-red-500 to-red-300" />
        <div className="p-5">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel this appointment?</h3>
          <p className="text-sm text-gray-600 mb-1">{stylistName}</p>
          <p className="text-xs text-gray-400 mb-3">{serviceName} · {fmtDate(booking.startTime)} at {fmtTime(booking.startTime)}</p>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
            <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Cancellations within 24 hours may incur a fee of ${Math.round(price * 0.5)}.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Keep it
            </button>
            <button onClick={onConfirm} disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                loading ? "bg-red-100 text-red-400 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
              }`}
            >
              {loading ? <><Loader2 size={14} className="animate-spin" />Cancelling…</> : "Yes, cancel"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={`fixed bottom-8 left-1/2 z-[400] pointer-events-none flex items-center gap-2 px-5 py-3 rounded-full bg-gray-900 text-white text-sm font-medium shadow-xl whitespace-nowrap transition-all duration-300 ${
      visible ? "-translate-x-1/2 translate-y-0 opacity-100" : "-translate-x-1/2 translate-y-5 opacity-0"
    }`}>
      <CheckCircle size={15} className="text-green-400" />
      {message}
    </div>
  );
}

export default function QueueScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
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
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  useEffect(() => {
    connectQueue();

    const loadBookings = async () => {
      try {
        const data = await getMyBookings();
        setBookings(data || []);

        const stylistIds = [...new Set((data || []).map((b: Booking) => {
          const sid = b.stylistId;
          return typeof sid === "object" ? sid._id : sid;
        }))];

        stylistIds.forEach((sid: string) => {
          subscribeToQueue(sid);
          getMyQueueStatus(sid);
        });
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();

    return () => {
      disconnectQueue();
    };
  }, []);

  useEffect(() => {
    const { io } = require("socket.io-client");
    const sock = io(`${import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"}/queue`, {
      auth: { token: localStorage.getItem("access_token") },
      autoConnect: false,
    });
    sock.connect();

    sock.on("queue:update", (data: QueueData) => {
      setQueues(prev => ({ ...prev, [data.stylistId]: data }));
    });

    sock.on("queue:status", (data: { queue: QueueData | null; myEntry?: QueueEntry | null }) => {
      if (data.queue) {
        setQueues(prev => ({ ...prev, [data.queue.stylistId]: data.queue }));
      }
    });

    return () => {
      sock.disconnect();
    };
  }, []);

  const counts = useMemo(() => ({
    all: bookings.length,
    today: bookings.filter(b => (b.status === "confirmed" || b.status === "in-progress") && new Date(b.startTime).toISOString().split("T")[0] === today).length,
    upcoming: bookings.filter(b => (b.status === "confirmed" || b.status === "in-progress") && new Date(b.startTime) >= new Date(today)).length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  }), [bookings, today]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (filter === "today") list = list.filter(b => (b.status === "confirmed" || b.status === "in-progress") && new Date(b.startTime).toISOString().split("T")[0] === today);
    else if (filter === "upcoming") list = list.filter(b => (b.status === "confirmed" || b.status === "in-progress") && new Date(b.startTime) >= new Date(today));
    else if (filter === "cancelled") list = list.filter(b => b.status === "cancelled");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => {
        const name = typeof b.stylistId === "object" ? b.stylistId.name : "";
        const service = typeof b.serviceId === "object" ? b.serviceId.name : "";
        return name.toLowerCase().includes(q) || service.toLowerCase().includes(q);
      });
    }

    return list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings, filter, search, today]);

  const upcoming = bookings.filter(b => b.status === "confirmed" || b.status === "in-progress");
  const todayBookings = upcoming.filter(b => new Date(b.startTime).toISOString().split("T")[0] === today);
  const heroBooking = todayBookings.length > 0
    ? todayBookings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]
    : upcoming[0];

  const handleCancel = useCallback(async () => {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget._id);
    try {
      await cancelBooking(cancelTarget._id);
      setBookings(prev => prev.map(b => b._id === cancelTarget._id ? { ...b, status: "cancelled" as const } : b));
      flash("Appointment cancelled");
    } catch {
      flash("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  }, [cancelTarget]);

  const grouped = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    filtered.forEach(b => {
      const key = fmtDate(b.startTime);
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return Object.entries(groups);
  }, [filtered]);

  const getQueueForBooking = (booking: Booking): QueueEntry | null | undefined => {
    const stylistId = typeof booking.stylistId === "object" ? booking.stylistId._id : booking.stylistId;
    const q = queues[stylistId];
    if (!q) return null;
    return q.entries.find(e => e.userId === (typeof booking.clientId === "object" ? booking.clientId?._id : booking.clientId)) || null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="flex items-start justify-between pt-14 pb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">My Schedule</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Queue & Appointments</h1>
          </div>
          <button className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:shadow-sm transition-all">
            <Bell size={18} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[180, 80, 80, 80].map((h, i) => (
              <div key={i} className="rounded-xl bg-white border border-gray-100 animate-pulse" style={{ height: h }} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard label="Today" value={counts.today} icon={Zap} color={{ bg: "bg-green-50", text: "text-green-700", icon: "text-green-500" }} />
              <StatCard label="Upcoming" value={counts.upcoming} icon={Calendar} color={{ bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500" }} />
              <StatCard label="Cancelled" value={counts.cancelled} icon={X} color={{ bg: "bg-red-50", text: "text-red-600", icon: "text-red-400" }} />
            </div>

            {heroBooking && filter !== "cancelled" && (
              <HeroCard
                booking={heroBooking}
                queueData={getQueueForBooking(heroBooking)}
                onView={() => setDetailBooking(heroBooking)}
              />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
                {([{ key: "all" as FilterKey, label: "All" },
                  { key: "today" as FilterKey, label: "Today" },
                  { key: "upcoming" as FilterKey, label: "Upcoming" },
                  { key: "cancelled" as FilterKey, label: "Cancelled" },
                ]).map(({ key, label }) => (
                  <button key={key} onClick={() => setFilter(key)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      filter === key ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {label}
                    {counts[key] > 0 && (
                      <span className={`text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full inline-flex items-center justify-center ${
                        filter === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {counts[key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="relative shrink-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  className="w-full sm:w-48 pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={`${filter}-${search}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {grouped.map(([dateLabel, items]) => (
                    <div key={dateLabel} className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">{dateLabel}</h3>
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] font-bold text-gray-300">{items.length}</span>
                      </div>
                      <div className="space-y-2">
                        {items.map((b, i) => (
                          <BookingRow key={b._id} booking={b}
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

      <AnimatePresence>
        {detailBooking && (
          <DetailModal key="detail" booking={detailBooking}
            queueData={getQueueForBooking(detailBooking)}
            onClose={() => setDetailBooking(null)}
            onCancel={() => { setCancelTarget(detailBooking); setDetailBooking(null); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal key="cancel" booking={cancelTarget}
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
