import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, ChevronLeft, ChevronRight, Star, MapPin } from "lucide-react";
import type { Stylist } from "@/domain/stylist/stylist.types";
import type { PaymentMethod } from "@/domain/booking/booking.types";
import { getLocationString } from "@/utils/location";
import { useCreateBookingMutation } from "@/domain/booking/booking.hooks";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/context/authUtils";
import { initializePayment } from "@/api/payments";
import { joinWaitlist } from "@/api/waitlist";
import OfflineBanner from "./OfflineBanner";
import ServiceStep from "./ServiceStep";
import DateStep from "./DateStep";
import TimeStep from "./TimeStep";
import PaymentStep from "./PaymentStep";
import SuccessView from "./SuccessView";
import PaymentFormModal from "../PaymentFormModal";
import { connectQueue, subscribeToQueue } from "@/services/socket";

export type BookingPhase = "form" | "paying" | "success";

interface BookingState {
  selectedService: ServiceObject | null;
  selectedDate: string | null;
  selectedTime: string | null;
  paymentMethod: PaymentMethod;
  note: string;
}

export type ServiceObject = {
  _id?: string;
  name: string;
  price: string;
  duration?: string;
  category?: string;
  popular?: boolean;
};

interface SlotInfo {
  time: string;
  available: boolean;
}

interface SlotsByDate {
  [date: string]: SlotInfo[];
}

interface BookingModalProps {
  stylist: Stylist;
  preSelectedService?: { name: string; price: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({
  stylist,
  preSelectedService,
  onClose,
  onSuccess: _onSuccess,
}: BookingModalProps) {
  const { addPoints, incrementAction } = useGamification();
  const { user } = useAuth();
  const createBooking = useCreateBookingMutation();

  const [state, setState] = useState<BookingState>(() => ({
    selectedService: preSelectedService
      ? stylist.services?.find(
          (s): s is ServiceObject =>
            typeof s !== "string" &&
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
  const [bookingResponse, setBookingResponse] = useState<{
    bookingId: string;
    stylistName: string;
    date: string;
    time: string;
    queuePosition: number;
    estimatedWaitMinutes: number;
  } | null>(null);
  const [slotsByDate, setSlotsByDate] = useState<SlotsByDate>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<{
    bookingId: string;
    queuePosition: number;
    estimatedWaitMinutes: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [joiningWaitlistBm, setJoiningWaitlistBm] = useState(false);
  const [waitlistJoinedBm, setWaitlistJoinedBm] = useState(false);

  // ── Image carousel ──────────────────────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);

  const allImages = useMemo(() => {
    const images: string[] = [];
    if (stylist.image) images.push(stylist.image);
    if (stylist.portfolioImages?.length) {
      stylist.portfolioImages.forEach((p) => {
        if (p.type === "image" && p.url) images.push(p.url);
      });
    }
    return images;
  }, [stylist]);

  const currentImage = allImages[currentImageIndex] ?? stylist.image ?? "";

  const goToNext = useCallback(() => {
    if (allImages.length > 1) {
      setCurrentImageIndex((p) => (p + 1) % allImages.length);
    }
  }, [allImages.length]);

  const goToPrev = useCallback(() => {
    if (allImages.length > 1) {
      setCurrentImageIndex((p) => (p - 1 + allImages.length) % allImages.length);
    }
  }, [allImages.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goToNext();
        else goToPrev();
      }
    },
    [goToNext, goToPrev],
  );
  // ─────────────────────────────────────────────────────────

  const dateSlots = slotsByDate[state.selectedDate ?? ""] || [];
  const allSlotsUnavailable = state.selectedDate !== null && dateSlots.length > 0 && dateSlots.every(s => !s.available) && !loadingSlots;

  const serviceComplete = state.selectedService !== null;
  const dateComplete = state.selectedDate !== null;
  const timeComplete = state.selectedTime !== null;
  const allSelected = serviceComplete && dateComplete && timeComplete;

  const getActiveSection = (): string => {
    if (!serviceComplete) return "section-service";
    if (!dateComplete) return "section-date";
    if (!timeComplete) return "section-time";
    return "section-pay";
  };

  const activeSection = getActiveSection();

  useEffect(() => {
    if (!state.selectedDate) return;
    setLoadingSlots(true);
    const controller = new AbortController();

    const serviceId =
      (state.selectedService as any)?._id || (state.selectedService as any)?.id || '';
    const params = new URLSearchParams({ date: state.selectedDate });
    if (serviceId) params.set('serviceId', serviceId);

    fetch(`/api/bookings/stylists/${stylist.id}/available-slots?${params}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.slots) {
          setSlotsByDate((prev) => ({ ...prev, [state.selectedDate!]: res.data.slots }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
    return () => controller.abort();
  }, [state.selectedDate, state.selectedService, stylist.id]);

  useEffect(() => {
    const el = document.getElementById(activeSection);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
    }
  }, [activeSection]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const update = useCallback(
    <K extends keyof BookingState>(key: K, value: BookingState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const doCreateBooking = async () => {
    const serviceId =
      (state.selectedService as any)._id || (state.selectedService as any).id;
    if (!serviceId) throw new Error("Service ID is missing");

    const startDateTime = new Date(
      `${state.selectedDate}T${state.selectedTime}:00`,
    );

    const res = await createBooking.mutateAsync({
      stylistId: stylist.id,
      serviceId,
      startTime: startDateTime.toISOString(),
      notes: state.note,
      paymentMethod: state.paymentMethod,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return {
      bookingId: res.data.booking._id,
      queuePosition: res.data.queuePosition ?? 1,
      estimatedWaitMinutes: res.data.estimatedWaitMinutes ?? 0,
    };
  };

  const handleCashPayment = async () => {
    setPaymentError(null);
    setPhase("paying");
    try {
      const { bookingId, queuePosition, estimatedWaitMinutes } = await doCreateBooking();
      setBookingResponse({
        bookingId,
        stylistName: stylist.name,
        date: state.selectedDate!,
        time: state.selectedTime!,
        queuePosition,
        estimatedWaitMinutes,
      });
      setPhase("success");
      addPoints(50);
      incrementAction("bookings");
      connectQueue();
      subscribeToQueue(stylist.id);
    } catch (err: any) {
      setPaymentError(
        err.response?.data?.message || err.message || "Booking failed. Please try again.",
      );
      setPhase("form");
    }
  };

  const parseRawAmount = (): number => {
    const priceStr = state.selectedService?.price || "0";
    const num = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
    return Math.round(num * 100);
  };

  const handlePay = () => {
    if (!state.selectedService || !state.selectedDate || !state.selectedTime) return;
    if (state.paymentMethod === "cash") {
      handleCashPayment();
      return;
    }
    setShowPaymentForm(true);
  };

  const handleProcessPayment = async () => {
    let data = pendingBookingData;
    if (!data) {
      const result = await doCreateBooking();
      data = {
        bookingId: result.bookingId,
        queuePosition: result.queuePosition,
        estimatedWaitMinutes: result.estimatedWaitMinutes,
      };
      setPendingBookingData(data);
    }

    const payResp = await initializePayment(data.bookingId, state.paymentMethod);

    return {
      bookingId: data.bookingId,
      reference: payResp.data.reference,
      accessCode: payResp.data.access_code,
    };
  };

  const handleCreateBooking = async () => {
    let data = pendingBookingData;
    if (!data) {
      const result = await doCreateBooking();
      data = {
        bookingId: result.bookingId,
        queuePosition: result.queuePosition,
        estimatedWaitMinutes: result.estimatedWaitMinutes,
      };
      setPendingBookingData(data);
    }
    return data.bookingId;
  };

  const handlePaymentVerified = (bookingId: string) => {
    setShowPaymentForm(false);
    const cached = pendingBookingData;
    setBookingResponse({
      bookingId,
      stylistName: stylist.name,
      date: state.selectedDate!,
      time: state.selectedTime!,
      queuePosition: cached?.queuePosition ?? 1,
      estimatedWaitMinutes: cached?.estimatedWaitMinutes ?? 0,
    });
    setPhase("success");
    addPoints(50);
    incrementAction("bookings");
    connectQueue();
    subscribeToQueue(stylist.id);
  };

  const handlePaymentFormClose = () => {
    setShowPaymentForm(false);
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

  const handleWaitlistFallback = useCallback(async () => {
    if (!state.selectedService || !state.selectedDate) return;
    setJoiningWaitlistBm(true);
    try {
      const serviceId = (state.selectedService as Record<string, unknown>)._id || (state.selectedService as Record<string, unknown>).id;
      await joinWaitlist({
        stylistId: stylist.id,
        serviceId: (serviceId as string) || "",
        preferredDate: new Date(state.selectedDate).toISOString(),
      });
      setWaitlistJoinedBm(true);
    } catch {
      /* ignore */
    }
    setJoiningWaitlistBm(false);
  }, [state.selectedService, state.selectedDate, stylist.id]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10001] flex items-end lg:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={phase === "form" ? onClose : undefined}
          aria-hidden="true"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Book with ${stylist.name}`}
          className="relative w-full max-w-3xl bg-white dark:bg-surface-dark-secondary rounded-t-3xl lg:rounded-2xl max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl shadow-black/20"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
        >
          <OfflineBanner />

          {phase === "success" ? (
            <>
              <div className="flex justify-center pt-3 pb-1 lg:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700/40 shrink-0">
                <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">Booking Placed</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* ── Hero image carousel ── */}
              <div
                className="relative h-56 lg:h-64 shrink-0 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {currentImage ? (
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={currentImage}
                      alt={stylist.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl">✂️</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                {/* Stylist info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                  <h2 className="text-xl font-bold text-white drop-shadow-sm">{stylist.name}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-white/80">
                    {stylist.rating && (
                      <span className="flex items-center gap-1">
                        <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                        {stylist.rating}
                      </span>
                    )}
                    <span>·</span>
                    <span>{stylist.reviewCount ?? 0} review{(stylist.reviewCount ?? 0) !== 1 ? "s" : ""}</span>
                    {stylist.location && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {getLocationString(stylist.location)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/30 text-white hover:bg-black/50 transition-colors backdrop-blur-sm"
                >
                  <X size={16} />
                </button>

                {/* Navigation arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={goToPrev}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-white/40 transition-colors backdrop-blur-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={goToNext}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-white/40 transition-colors backdrop-blur-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Dot indicators */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <span
                        key={i}
                        className={` rounded-full transition-all duration-300 ${
                          i === currentImageIndex
                            ? "w-5 h-1.5 bg-white"
                            : "w-1.5 h-1.5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile drag handle */}
              <div className="flex justify-center pt-3 pb-1 lg:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
            </>
          )}

          <div className="flex-1 overflow-y-auto scroll-smooth">
            {phase === "success" && bookingResponse ? (
              <SuccessView
                stylist={stylist}
                bookingResponse={bookingResponse}
                selectedService={state.selectedService}
                copied={copied}
                onCopyId={handleCopyId}
                onDone={handleDone}
                onViewBookings={() => { _onSuccess(); onClose(); }}
                formatShortDate={(dateStr: string) =>
                  new Date(dateStr).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }
              />
            ) : (
              <div className="lg:flex lg:min-h-0">
                {/* Desktop sidebar */}
                <div className="hidden lg:block w-72 shrink-0 p-5 border-r border-gray-100 dark:border-gray-700/20 bg-gray-50/30 dark:bg-surface-dark-tertiary/20">
                  <div className="sticky top-0">
                  </div>
                </div>

                {/* Form steps */}
                <div className="flex-1 p-4 lg:p-6 lg:pt-6 space-y-4 overflow-y-auto">
                  {/* Mobile summary strip */}
                  <div className="lg:hidden">
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/30 bg-white dark:bg-surface-dark-secondary p-3.5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 shrink-0 ring-2 ring-white dark:ring-gray-800">
                          {stylist.image ? (
                            <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">✂️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">{stylist.name}</p>
                          <p className="text-xs text-text-muted dark:text-text-dark-muted truncate">
                            {[
                              state.selectedService?.name,
                              state.selectedDate && new Date(state.selectedDate).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }),
                              state.selectedTime &&
                                (() => {
                                  const [h, m] = state.selectedTime!.split(":").map(Number);
                                  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
                                })(),
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Start by selecting a service"}
                          </p>
                        </div>
                        {state.selectedService && (
                          <p className="text-sm font-extrabold text-text-primary dark:text-text-dark-primary shrink-0">{state.selectedService.price}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <ServiceStep
                    services={stylist.services}
                    selectedService={state.selectedService}
                    onSelect={(svc) => { update("selectedService", svc); update("selectedTime", null); }}
                    active={activeSection === "section-service"}
                    completed={serviceComplete}
                  />

                  <DateStep
                    selectedDate={state.selectedDate}
                    onSelect={(date) => { update("selectedDate", date); update("selectedTime", null); }}
                    active={activeSection === "section-date"}
                    completed={dateComplete}
                    disabled={!serviceComplete}
                  />

                  <TimeStep
                    selectedDate={state.selectedDate}
                    selectedTime={state.selectedTime}
                    onSelect={(time) => update("selectedTime", time)}
                    loading={loadingSlots}
                    slots={dateSlots}
                    active={activeSection === "section-time"}
                    completed={timeComplete}
                    disabled={!dateComplete}
                  />

                  {allSlotsUnavailable && !timeComplete && !waitlistJoinedBm && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                        All time slots for this date are booked
                      </p>
                      <button
                        onClick={handleWaitlistFallback}
                        disabled={joiningWaitlistBm}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                      >
                        {joiningWaitlistBm && <Loader2 size={14} className="animate-spin" />}
                        Join Waitlist
                      </button>
                    </div>
                  )}
                  {waitlistJoinedBm && (
                    <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-center">
                      <Check size={20} className="mx-auto mb-1 text-green-600" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">You're on the waitlist!</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">We'll notify you when a spot opens up.</p>
                    </div>
                  )}

                  <PaymentStep
                    paymentMethod={state.paymentMethod}
                    note={state.note}
                    paymentError={paymentError}
                    phase={phase}
                    selectedService={state.selectedService}
                    selectedDate={state.selectedDate}
                    selectedTime={state.selectedTime}
                    onPaymentMethodChange={(m) => update("paymentMethod", m)}
                    onNoteChange={(n) => update("note", n)}
                    onPay={handlePay}
                    active={activeSection === "section-pay"}
                    disabled={false}
                  />
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showPaymentForm && (
              <PaymentFormModal
                method={state.paymentMethod as "card" | "mobile-money"}
                amount={state.selectedService?.price || ""}
                email={user?.email || ""}
                paystackKey={import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string}
                onClose={handlePaymentFormClose}
                onProcessPayment={handleProcessPayment}
                onCreateBooking={handleCreateBooking}
                onPaymentVerified={handlePaymentVerified}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
