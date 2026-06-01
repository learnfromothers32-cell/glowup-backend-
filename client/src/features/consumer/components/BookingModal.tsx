import { useState, useEffect, useCallback, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  CheckCircle2,
  Calendar,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Clock,
  AlertCircle,
  CreditCard,
  Smartphone,
  Wallet,
  Shield,
  MapPin,
  WifiOff,
  Sparkles,
  ArrowRight,
  Copy,
  ExternalLink,
  MessageSquare,
  Star,
  ChevronDown,
} from "lucide-react";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { createBooking } from "../../../api/bookings";
import { useGamification } from "../../../hooks/useGamification";
import { getLocationString } from "@/utils/location";

// ─── Types ────────────────────────────────────────────────────────────────────
type BookingResponse = {
  bookingId: string;
  stylistName: string;
  date: string;
  time: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
};

type PaymentMethod = "card" | "mobile-money" | "cash";
type BookingPhase = "form" | "paying" | "success";

interface BookingState {
  selectedService: Stylist["services"][0] | null;
  selectedDate: string | null;
  selectedTime: string | null;
  paymentMethod: PaymentMethod;
  note: string;
}

interface BookingModalProps {
  stylist: Stylist;
  preSelectedService?: { name: string; price: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface UnavailableSlots {
  [date: string]: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { time: "09:00", label: "9:00 AM", period: "morning" },
  { time: "10:00", label: "10:00 AM", period: "morning" },
  { time: "11:00", label: "11:00 AM", period: "morning" },
  { time: "12:00", label: "12:00 PM", period: "afternoon" },
  { time: "13:00", label: "1:00 PM", period: "afternoon" },
  { time: "14:00", label: "2:00 PM", period: "afternoon" },
  { time: "15:00", label: "3:00 PM", period: "afternoon" },
  { time: "16:00", label: "4:00 PM", period: "evening" },
  { time: "17:00", label: "5:00 PM", period: "evening" },
];

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  detail: string;
  icon: typeof CreditCard;
}[] = [
  {
    id: "card",
    label: "Visa •••• 4242",
    detail: "Expires 08/27",
    icon: CreditCard,
  },
  {
    id: "mobile-money",
    label: "MTN MoMo",
    detail: "+233 •••• 1234",
    icon: Smartphone,
  },
  {
    id: "cash",
    label: "Cash",
    detail: "Pay in person after service",
    icon: Wallet,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function generateDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({
  id,
  number,
  title,
  subtitle,
  completed,
  active,
  disabled,
  children,
  summary,
}: {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  disabled: boolean;
  children: React.ReactNode;
  summary?: string;
}) {
  return (
    <div
      id={id}
      className={`
        rounded-2xl border transition-all duration-300
        ${
          active
            ? "border-gray-900 bg-white shadow-lg shadow-gray-100"
            : completed
              ? "border-gray-200 bg-white"
              : "border-gray-100 bg-gray-50/50"
        }
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Step number / check */}
        <div
          className={`
            w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
            transition-all duration-300
            ${
              completed
                ? "bg-green-500 text-white"
                : active
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-500"
            }
          `}
        >
          {completed ? <Check size={14} strokeWidth={3} /> : number}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold ${
              active
                ? "text-gray-900"
                : completed
                  ? "text-gray-700"
                  : "text-gray-400"
            }`}
          >
            {title}
          </p>
          {!active && completed && summary ? (
            <p className="text-xs text-gray-500 truncate">{summary}</p>
          ) : active ? (
            <p className="text-xs text-gray-400">{subtitle}</p>
          ) : null}
        </div>

        {/* Edit button when completed */}
        {completed && !disabled && (
          <button
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
            onClick={() => {
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            Edit
          </button>
        )}
      </div>

      {/* Content (expandable) */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Live Summary Card (sidebar / sticky) ─────────────────────────────────────
function LiveSummary({
  stylist,
  state,
}: {
  stylist: Stylist;
  state: BookingState;
}) {
  const timeLabel = state.selectedTime
    ? (TIME_SLOTS.find((s) => s.time === state.selectedTime)?.label ??
      state.selectedTime)
    : null;

  const selectedDate = state.selectedDate ? new Date(state.selectedDate) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Stylist header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            {stylist.image && (
              <img
                src={stylist.image}
                alt={stylist.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {stylist.name}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              {stylist.rating && (
                <span className="flex items-center gap-0.5">
                  <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
                  {stylist.rating}
                </span>
              )}
              {stylist.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin size={9} />
                    {getLocationString(stylist.location)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selections */}
      <div className="p-4 space-y-3">
        {/* Service */}
        <div className="flex items-start gap-3">
          <div
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
              ${state.selectedService ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}
              transition-colors
            `}
          >
            <Sparkles size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              Service
            </p>
            {state.selectedService ? (
              <p className="text-sm font-semibold text-gray-900">
                {state.selectedService.name}
              </p>
            ) : (
              <p className="text-sm text-gray-300">Not selected</p>
            )}
          </div>
          {state.selectedService && (
            <p className="text-sm font-bold text-gray-900 shrink-0">
              {state.selectedService.price}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="flex items-start gap-3">
          <div
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
              ${state.selectedDate ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}
              transition-colors
            `}
          >
            <Calendar size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              Date
            </p>
            {state.selectedDate ? (
              <p className="text-sm font-semibold text-gray-900">
                {formatShortDate(state.selectedDate)}
              </p>
            ) : (
              <p className="text-sm text-gray-300">Not selected</p>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3">
          <div
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
              ${state.selectedTime ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}
              transition-colors
            `}
          >
            <Clock size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
              Time
            </p>
            {state.selectedTime ? (
              <p className="text-sm font-semibold text-gray-900">{timeLabel}</p>
            ) : (
              <p className="text-sm text-gray-300">Not selected</p>
            )}
          </div>
        </div>

        {/* Duration */}
        {state.selectedService && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-gray-100 text-gray-400">
              <Clock size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                Duration
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {state.selectedService.duration}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      {state.selectedService && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {state.selectedService.price}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingModal({
  stylist,
  preSelectedService,
  onClose,
  onSuccess: _onSuccess,
}: BookingModalProps) {
  const { addPoints, incrementAction } = useGamification();

  const [state, setState] = useState<BookingState>(() => ({
    selectedService: preSelectedService
      ? stylist.services.find(
          (s) =>
            s.name === preSelectedService.name &&
            s.price === preSelectedService.price,
        ) || null
      : null,
    selectedDate: null,
    selectedTime: null,
    paymentMethod: "card",
    note: "",
  }));

  const [phase, setPhase] = useState<BookingPhase>("form");
  const [bookingResponse, setBookingResponse] =
    useState<BookingResponse | null>(null);
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlots>(
    {},
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const noteId = useId();

  // ── Active section logic ──
  const serviceComplete = state.selectedService !== null;
  const dateComplete = state.selectedDate !== null;
  const timeComplete = state.selectedTime !== null;
  const allSelected = serviceComplete && dateComplete && timeComplete;

  // Determine which section is active
  const getActiveSection = (): string => {
    if (!serviceComplete) return "section-service";
    if (!dateComplete) return "section-date";
    if (!timeComplete) return "section-time";
    return "section-pay";
  };

  const activeSection = getActiveSection();

  // ── Simulate fetching unavailable slots ──
  useEffect(() => {
    if (!state.selectedDate || !state.selectedService) return;
    setLoadingSlots(true);

    const timer = setTimeout(() => {
      setUnavailableSlots((prev) => ({
        ...prev,
        [state.selectedDate!]: ["09:00", "13:00"],
      }));
      setLoadingSlots(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [state.selectedDate, state.selectedService, stylist.id]);

  // ── Auto-scroll to next section ──
  useEffect(() => {
    const el = document.getElementById(activeSection);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
    }
  }, [activeSection]);

  // ── Lock body scroll ──
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const update = useCallback(
    <K extends keyof BookingState>(key: K, value: BookingState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ── Payment handler ──
  const handlePay = async () => {
    if (!state.selectedService || !state.selectedDate || !state.selectedTime)
      return;

    setPaymentError(null);
    setPhase("paying");

    try {
      const serviceId =
        (state.selectedService as any)._id ||
        (state.selectedService as any).id;

      if (!serviceId) {
        throw new Error("Service ID is missing. Please try selecting the service again.");
      }

      const startDateTime = new Date(`${state.selectedDate}T${state.selectedTime}:00`);

      const res = await createBooking({
        stylistId: stylist.id,
        serviceId,
        startTime: startDateTime.toISOString(),
        notes: state.note,
      });

      setBookingResponse({
        bookingId: res.data.booking._id,
        stylistName: stylist.name,
        date: state.selectedDate,
        time: state.selectedTime,
        queuePosition: res.data.booking.queuePosition || 1,
        estimatedWaitMinutes: res.data.booking.estimatedWaitMinutes || 0,
      });

      setPhase("success");
      addPoints(50);
      incrementAction("bookings");
    } catch (err: any) {
      console.error("Booking failed:", err);
      setPaymentError(
        err.response?.data?.message || err.message || "Booking failed. Please try again.",
      );
      setPhase("form");
    }
  };

  const handleCopyId = () => {
    if (!bookingResponse) return;
    navigator.clipboard.writeText(bookingResponse.bookingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDone = () => {
    _onSuccess();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={phase === "form" ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Book with ${stylist.name}`}
          className="
            relative w-full max-w-3xl
            bg-white
            rounded-t-3xl lg:rounded-2xl
            max-h-[92dvh] flex flex-col
            overflow-hidden
            shadow-2xl shadow-black/20
          "
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Offline banner */}
          {(() => {
            const [offline, setOffline] = useState(!navigator.onLine);
            useEffect(() => {
              const on = () => setOffline(false);
              const off = () => setOffline(true);
              window.addEventListener("online", on);
              window.addEventListener("offline", off);
              return () => {
                window.removeEventListener("online", on);
                window.removeEventListener("offline", off);
              };
            }, []);
            return offline ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs">
                <WifiOff size={13} className="shrink-0" />
                You're offline. Booking won't process until reconnected.
              </div>
            ) : null;
          })()}

          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-1 lg:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {phase === "success"
                  ? "Booking Confirmed"
                  : `Book with ${stylist.name}`}
              </h2>
              {phase !== "success" && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete each section below to finish your booking
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* ── SUCCESS PHASE ──────────────────────────────── */}
            {phase === "success" && bookingResponse ? (
              <div className="p-6 max-w-lg mx-auto">
                {/* Checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1,
                  }}
                  className="mx-auto w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mb-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle2
                      size={40}
                      className="text-green-500"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-6"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    You're all set!
                  </h3>
                  <p className="text-sm text-gray-400">
                    Confirmation sent to your email and phone
                  </p>
                </motion.div>

                {/* Ticket-style confirmation */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mb-6"
                >
                  {/* Top accent */}
                  <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />

                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      {stylist.image && (
                        <img
                          src={stylist.image}
                          alt={stylist.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {stylist.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {state.selectedService?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                          Queue
                        </p>
                        <p className="text-3xl font-black text-gray-900">
                          #{bookingResponse.queuePosition}
                        </p>
                      </div>
                    </div>

                    {/* Dashed divider */}
                    <div className="border-t border-dashed border-gray-200 my-4" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                          Date
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatShortDate(bookingResponse.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                          Time
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {bookingResponse.time}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                          Wait
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          ~{bookingResponse.estimatedWaitMinutes} min
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                          Booking ID
                        </p>
                        <p className="text-xs font-mono text-gray-600">
                          {bookingResponse.bookingId.slice(0, 12)}…
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <button
                    onClick={handleCopyId}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        Booking ID Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Booking ID
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDone}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 shadow-md transition-all active:scale-[0.98]"
                  >
                    Done
                    <Check size={14} />
                  </button>

                  <button
                    onClick={() => {
                      _onSuccess();
                      onClose();
                    }}
                    className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors py-2 flex items-center justify-center gap-1"
                  >
                    View my bookings
                    <ExternalLink size={10} />
                  </button>
                </motion.div>
              </div>
            ) : (
              /* ── FORM PHASE ─────────────────────────────── */
              <div className="lg:flex lg:min-h-0">
                {/* Left: Summary sidebar (desktop) */}
                <div className="hidden lg:block w-72 shrink-0 p-5 border-r border-gray-100 bg-gray-50/50 overflow-y-auto">
                  <LiveSummary stylist={stylist} state={state} />
                </div>

                {/* Right: Form sections */}
                <div className="flex-1 p-4 lg:p-6 space-y-3 overflow-y-auto">
                  {/* Mobile summary (collapsible) */}
                  <div className="lg:hidden">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-3">
                        {stylist.image && (
                          <img
                            src={stylist.image}
                            alt={stylist.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {stylist.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {[
                              state.selectedService?.name,
                              state.selectedDate &&
                                formatShortDate(state.selectedDate),
                              state.selectedTime &&
                                TIME_SLOTS.find(
                                  (s) => s.time === state.selectedTime,
                                )?.label,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Start by selecting a service"}
                          </p>
                        </div>
                        {state.selectedService && (
                          <p className="text-sm font-bold text-gray-900 shrink-0">
                            {state.selectedService.price}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Service */}
                  <Section
                    id="section-service"
                    number={1}
                    title="Select a Service"
                    subtitle="What would you like to book?"
                    completed={serviceComplete}
                    active={activeSection === "section-service"}
                    disabled={false}
                    summary={state.selectedService?.name}
                  >
                    <div className="space-y-2 mt-2">
                      {stylist.services.map((svc, i) => {
                        const isSelected =
                          state.selectedService?.name === svc.name;

                        return (
                          <motion.button
                            key={svc.name}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => {
                              update("selectedService", svc);
                              // Reset time if service changes
                              update("selectedTime", null);
                            }}
                            className={`
                              w-full flex items-center gap-4 p-3.5 rounded-xl border text-left
                              transition-all duration-200
                              ${
                                isSelected
                                  ? "border-gray-900 bg-gray-50 shadow-sm"
                                  : "border-gray-100 hover:border-gray-200 hover:bg-white"
                              }
                            `}
                          >
                            <div
                              className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                ${isSelected ? "border-gray-900 bg-gray-900" : "border-gray-300"}
                              `}
                            >
                              {isSelected && (
                                <Check
                                  size={12}
                                  className="text-white"
                                  strokeWidth={3}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {svc.name}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                {svc.duration}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 shrink-0">
                              {svc.price}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </Section>

                  {/* Section 2: Date */}
                  <Section
                    id="section-date"
                    number={2}
                    title="Pick a Date"
                    subtitle="When works for you?"
                    completed={dateComplete}
                    active={activeSection === "section-date"}
                    disabled={!serviceComplete}
                    summary={
                      state.selectedDate
                        ? formatShortDate(state.selectedDate)
                        : undefined
                    }
                  >
                    <div className="mt-2">
                      <div
                        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                        style={{ scrollbarWidth: "none" }}
                      >
                        {generateDates(14).map((date) => {
                          const d = new Date(date);
                          const dayName = d.toLocaleDateString("en-US", {
                            weekday: "short",
                          });
                          const dayNum = d.getDate();
                          const monthName = d.toLocaleDateString("en-US", {
                            month: "short",
                          });
                          const isToday = date === generateDates(14)[0];
                          const isSelected = state.selectedDate === date;

                          return (
                            <button
                              key={date}
                              onClick={() => {
                                update("selectedDate", date);
                                update("selectedTime", null);
                              }}
                              className={`
                                flex flex-col items-center py-2.5 px-3 rounded-xl border min-w-[56px]
                                transition-all duration-200 shrink-0
                                ${
                                  isSelected
                                    ? "border-gray-900 bg-gray-900 text-white shadow-md"
                                    : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
                                }
                              `}
                            >
                              <span
                                className={`text-[10px] font-semibold uppercase ${
                                  isSelected ? "text-gray-400" : "text-gray-400"
                                }`}
                              >
                                {isToday ? "Today" : dayName}
                              </span>
                              <span
                                className={`text-lg font-bold ${
                                  isSelected ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {dayNum}
                              </span>
                              <span
                                className={`text-[9px] ${
                                  isSelected ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                {monthName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Section>

                  {/* Section 3: Time */}
                  <Section
                    id="section-time"
                    number={3}
                    title="Choose a Time"
                    subtitle={
                      state.selectedDate
                        ? formatShortDate(state.selectedDate)
                        : "Select a date first"
                    }
                    completed={timeComplete}
                    active={activeSection === "section-time"}
                    disabled={!dateComplete}
                    summary={
                      state.selectedTime
                        ? TIME_SLOTS.find((s) => s.time === state.selectedTime)
                            ?.label
                        : undefined
                    }
                  >
                    <div className="mt-2">
                      {loadingSlots ? (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          <span className="text-sm">
                            Checking availability…
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(["morning", "afternoon", "evening"] as const).map(
                            (period) => {
                              const slots = TIME_SLOTS.filter(
                                (s) => s.period === period,
                              );
                              const periodLabel =
                                period === "morning"
                                  ? "Morning"
                                  : period === "afternoon"
                                    ? "Afternoon"
                                    : "Evening";

                              return (
                                <div key={period}>
                                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    {periodLabel}
                                  </p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {slots.map(({ time, label }) => {
                                      const unavailable =
                                        unavailableSlots[
                                          state.selectedDate ?? ""
                                        ]?.includes(time) ?? false;
                                      const isSelected =
                                        state.selectedTime === time;

                                      return (
                                        <button
                                          key={time}
                                          onClick={() =>
                                            !unavailable &&
                                            update("selectedTime", time)
                                          }
                                          disabled={unavailable}
                                          className={`
                                          py-2.5 px-2 rounded-xl border text-center text-xs font-medium
                                          transition-all duration-200
                                          ${
                                            unavailable
                                              ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                              : isSelected
                                                ? "border-gray-900 bg-gray-900 text-white shadow-md"
                                                : "border-gray-100 bg-white text-gray-700 hover:border-gray-200"
                                          }
                                        `}
                                        >
                                          {label}
                                          {unavailable && (
                                            <span className="block text-[9px] text-gray-300 mt-0.5">
                                              Booked
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* Section 4: Payment & Notes */}
                  <Section
                    id="section-pay"
                    number={4}
                    title="Review & Pay"
                    subtitle="Almost there!"
                    completed={false}
                    active={activeSection === "section-pay"}
                    disabled={!allSelected}
                  >
                    <div className="mt-2 space-y-4">
                      {/* Payment methods */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Payment Method
                        </p>
                        <div className="space-y-2">
                          {PAYMENT_METHODS.map((method) => {
                            const isSelected =
                              state.paymentMethod === method.id;
                            const Icon = method.icon;

                            return (
                              <button
                                key={method.id}
                                onClick={() =>
                                  update("paymentMethod", method.id)
                                }
                                className={`
                                  w-full flex items-center gap-3 p-3 rounded-xl border text-left
                                  transition-all duration-200
                                  ${
                                    isSelected
                                      ? "border-gray-900 bg-gray-50"
                                      : "border-gray-100 hover:border-gray-200"
                                  }
                                `}
                              >
                                <div
                                  className={`
                                    w-9 h-9 rounded-lg flex items-center justify-center
                                    ${
                                      isSelected
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-100 text-gray-400"
                                    }
                                  `}
                                >
                                  <Icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {method.label}
                                  </p>
                                  <p className="text-[11px] text-gray-400">
                                    {method.detail}
                                  </p>
                                </div>
                                <div
                                  className={`
                                    w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center
                                    ${
                                      isSelected
                                        ? "border-gray-900 bg-gray-900"
                                        : "border-gray-300"
                                    }
                                  `}
                                >
                                  {isSelected && (
                                    <Check
                                      size={10}
                                      className="text-white"
                                      strokeWidth={3}
                                    />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Note */}
                      <div>
                        <label
                          htmlFor={noteId}
                          className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2"
                        >
                          Note{" "}
                          <span className="normal-case font-normal text-gray-400">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          id={noteId}
                          value={state.note}
                          onChange={(e) => update("note", e.target.value)}
                          maxLength={200}
                          rows={2}
                          placeholder="Any special requests for your stylist?"
                          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 resize-none focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all bg-white"
                        />
                        <p className="text-right text-[11px] text-gray-300 mt-1">
                          {state.note.length}/200
                        </p>
                      </div>

                      {/* Error */}
                      <AnimatePresence>
                        {paymentError && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm"
                          >
                            <AlertCircle
                              size={16}
                              className="mt-0.5 shrink-0"
                            />
                            {paymentError}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Security */}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Shield size={12} className="shrink-0" />
                        <span>
                          Payments secured with 256-bit SSL encryption
                        </span>
                      </div>

                      {/* Pay button */}
                      <button
                        onClick={handlePay}
                        disabled={phase === "paying"}
                        className={`
                          w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold
                          transition-all duration-200 active:scale-[0.98]
                          ${
                            phase === "paying"
                              ? "bg-gray-400 text-white cursor-wait"
                              : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20"
                          }
                        `}
                      >
                        {phase === "paying" ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing payment…
                          </>
                        ) : (
                          <>
                            Confirm & Pay {state.selectedService?.price}
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </Section>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
