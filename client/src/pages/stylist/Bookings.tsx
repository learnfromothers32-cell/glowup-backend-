import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  X,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  AlertTriangle,
} from "lucide-react";
import { getStylistBookings, updateBookingStatus } from "../../api/bookings";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterKey = "pending" | "today" | "upcoming" | "past" | "cancelled" | "all";

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

function fmtTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(`2000-01-01T${d}:00`) : d;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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

function getLocationString(loc: any): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  const parts = [loc.city, loc.state, loc.zip].filter(Boolean);
  return parts.join(", ") || loc.address || "";
}

// ─── Status Badge (matches client) ────────────────────────────────────────────
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
      Upcoming
    </span>
  );
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
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

function FilterPills({
  active,
  onChange,
  counts,
}: {
  active: FilterKey;
  onChange: (f: FilterKey) => void;
  counts: Record<string, number>;
}) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {FILTERS.map(({ key, label }) => {
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

// ─── Modal ────────────────────────────────────────────────────────────────────
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

// ─── Booking Detail Modal ─────────────────────────────────────────────────────
function BookingDetailModal({
  booking,
  onClose,
}: {
  booking: any;
  onClose: () => void;
}) {
  const isCancelled = booking.status === "cancelled";
  const b = booking;
  const clientName = b.clientId?.name || "Client";
  const serviceName = b.serviceId?.name || "Service";
  const start = new Date(b.startTime);
  const dateStr = start.toISOString().split("T")[0];
  const timeStr = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const clientAvatar = b.clientId?.avatar;
  const location = b.clientId?.location;

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Booking Details</h2>
          <p className="text-xs text-gray-400 mt-0.5">{serviceName}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Client info */}
        <div className="flex items-center gap-3">
          {clientAvatar ? (
            <img
              src={clientAvatar}
              alt={clientName}
              className={`w-12 h-12 rounded-xl object-cover ring-1 ring-gray-100 ${isCancelled ? "grayscale" : ""}`}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-400">
                {initials(clientName)}
              </span>
            </div>
          )}
          <div>
            <p className={`text-sm font-semibold ${isCancelled ? "text-gray-400 line-through" : "text-gray-900"}`}>
              {clientName}
            </p>
            <p className="text-xs text-gray-500">
              <StatusBadge status={b.status} date={dateStr} />
            </p>
          </div>
        </div>

        {/* Booking info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Date</p>
            <p className="text-sm font-semibold text-gray-900">{fmtDate(dateStr)}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Time</p>
            <p className="text-sm font-semibold text-gray-900">{fmtTime(timeStr)}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Status</p>
            <p><StatusBadge status={b.status} date={dateStr} /></p>
          </div>
          {b.totalPrice && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Price</p>
              <p className="text-sm font-semibold text-gray-900">${b.totalPrice}</p>
            </div>
          )}
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <p className="text-xs text-gray-600">{getLocationString(location)}</p>
          </div>
        )}

        {/* Booking ID */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Booking ID</p>
          <p className="text-xs text-gray-500 font-mono">{b._id}</p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filter }: { filter: FilterKey }) {
  const msgs: Record<FilterKey, { icon: typeof Calendar; title: string; sub: string }> = {
    pending: {
      icon: Clock,
      title: "No pending bookings",
      sub: "All appointments have been confirmed or cancelled.",
    },
    today: {
      icon: CalendarCheck,
      title: "Nothing scheduled today",
      sub: "No appointments today. Check your upcoming bookings.",
    },
    upcoming: {
      icon: CalendarClock,
      title: "No upcoming bookings",
      sub: "Future appointments will appear here.",
    },
    past: {
      icon: CheckCircle,
      title: "No past bookings",
      sub: "Completed appointments will appear here.",
    },
    cancelled: {
      icon: CalendarX,
      title: "No cancelled bookings",
      sub: "No appointments have been cancelled.",
    },
    all: {
      icon: Calendar,
      title: "No bookings yet",
      sub: "Bookings will appear here once clients make appointments.",
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
      <p className="text-sm text-gray-400 max-w-[280px] leading-relaxed">{m.sub}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StylistBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("pending");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<any | null>(null);

  useEffect(() => {
    getStylistBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = todayStr();

  // ── Counts ──
  const counts = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length;
    const todayCount = bookings.filter(
      (b) => (b.status === "confirmed" || b.status === "pending") &&
        new Date(b.startTime).toISOString().split("T")[0] === today,
    ).length;
    const upcoming = bookings.filter(
      (b) => (b.status === "confirmed" || b.status === "pending") &&
        new Date(b.startTime) > new Date(),
    ).length;
    const past = bookings.filter(
      (b) => b.status === "completed" || (b.status === "confirmed" && new Date(b.startTime) < new Date()),
    ).length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    return { pending, today: todayCount, upcoming, past, cancelled, all: bookings.length };
  }, [bookings, today]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let list = [...bookings];
    if (activeFilter === "pending")
      list = list.filter((b) => b.status === "pending");
    else if (activeFilter === "today")
      list = list.filter(
        (b) => (b.status === "confirmed" || b.status === "pending") &&
          new Date(b.startTime).toISOString().split("T")[0] === today,
      );
    else if (activeFilter === "upcoming")
      list = list.filter(
        (b) => (b.status === "confirmed" || b.status === "pending") &&
          new Date(b.startTime) > new Date(),
      );
    else if (activeFilter === "past")
      list = list.filter(
        (b) => b.status === "completed" || (b.status === "confirmed" && new Date(b.startTime) < new Date()),
      );
    else if (activeFilter === "cancelled")
      list = list.filter((b) => b.status === "cancelled");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        const clientName = b.clientId?.name || "";
        const serviceName = b.serviceId?.name || "";
        return clientName.toLowerCase().includes(q) || serviceName.toLowerCase().includes(q);
      });
    }

    list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return list;
  }, [bookings, activeFilter, search, today]);

  const handleConfirm = useCallback(async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "confirmed");
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "confirmed" } : b)),
      );
    } catch (err) {
      console.error("Failed to confirm booking", err);
    }
  }, []);

  const handleCancel = useCallback(async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "cancelled");
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "cancelled" } : b)),
      );
    } catch (err) {
      console.error("Failed to cancel booking", err);
    }
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white border border-gray-100 animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="pb-6">
        {/* ── Header ── */}
        <div className="pt-2 pb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            Bookings
          </h1>
          <p className="text-sm text-gray-400">
            Manage client appointments and requests
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <StatCard
            label="Pending"
            value={counts.pending}
            icon={Clock}
            color={{ bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", icon: "text-amber-500" }}
          />
          <StatCard
            label="Today"
            value={counts.today}
            icon={CalendarCheck}
            color={{ bg: "bg-green-50", text: "text-green-700", border: "border-green-100", icon: "text-green-500" }}
          />
          <StatCard
            label="Upcoming"
            value={counts.upcoming}
            icon={CalendarClock}
            color={{ bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: "text-blue-500" }}
          />
          <StatCard
            label="Completed"
            value={counts.past}
            icon={CheckCircle}
            color={{ bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-100", icon: "text-gray-500" }}
          />
          <StatCard
            label="Cancelled"
            value={counts.cancelled}
            icon={CalendarX}
            color={{ bg: "bg-red-50", text: "text-red-600", border: "border-red-100", icon: "text-red-400" }}
          />
        </div>

        {/* ── Filters + Search ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <FilterPills active={activeFilter} onChange={setActiveFilter} counts={counts} />
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
              placeholder="Search client or service…"
              className="w-full sm:w-48 pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
            />
          </div>
        </div>

        {/* ── Booking List ── */}
        {filtered.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <div className="space-y-2">
            {filtered.map((b: any) => {
              const start = new Date(b.startTime);
              const dateStr = start.toISOString().split("T")[0];
              const timeStr = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
              const clientName = b.clientId?.name || "Client";
              const serviceName = b.serviceId?.name || "Service";
              const isPending = b.status === "pending";
              const isCancelled = b.status === "cancelled";

              return (
                <motion.div
                  key={b._id}
                  onClick={() => setDetail(b)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    group bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer
                    hover:border-gray-200 hover:shadow-md transition-all duration-200
                    ${isCancelled ? "opacity-60" : ""}
                    ${isPending ? "border-amber-200 bg-amber-50/30" : ""}
                  `}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Time column */}
                    <div className="shrink-0 w-16 text-center">
                      <p className="text-sm font-bold text-gray-900 tabular-nums">
                        {fmtTime(timeStr).split(" ")[0]}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {fmtTime(timeStr).split(" ")[1]}
                      </p>
                    </div>

                    {/* Vertical divider */}
                    <div
                      className={`w-px h-10 shrink-0 ${
                        isCancelled ? "bg-red-200" : isPending ? "bg-amber-300" : fmtDate(dateStr) === "Today" ? "bg-green-300" : "bg-gray-200"
                      }`}
                    />

                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center ring-1 ring-gray-100">
                        <span className="text-xs font-bold text-gray-400">
                          {initials(clientName)}
                        </span>
                      </div>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-semibold truncate ${isCancelled ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {clientName}
                        </p>
                        <StatusBadge status={b.status} date={dateStr} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{serviceName}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {fmtDate(dateStr)}
                        </span>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {b.totalPrice && (
                        <p className={`text-sm font-bold ${isCancelled ? "text-gray-300" : "text-gray-900"}`}>
                          ${b.totalPrice}
                        </p>
                      )}

                      {/* Actions on hover for pending bookings */}
                      {isPending && (
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConfirm(b._id); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-green-600 hover:bg-green-50 transition-all"
                          >
                            <CheckCircle size={12} />
                            Confirm
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancel(b._id); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-red-500 hover:bg-red-50 transition-all"
                          >
                            <XCircle size={12} />
                            Cancel
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

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {detail && (
          <BookingDetailModal
            key="detail"
            booking={detail}
            onClose={() => setDetail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
