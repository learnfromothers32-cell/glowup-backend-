import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Stylist } from "@/domain/stylist/stylist.types";
import type { PaymentMethod } from "@/domain/booking/booking.types";
import { useCreateBookingMutation } from "@/domain/booking/booking.hooks";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/context/authUtils";
import { initializePayment } from "@/api/payments";
import OfflineBanner from "./OfflineBanner";
import ServiceStep from "./ServiceStep";
import DateStep from "./DateStep";
import TimeStep from "./TimeStep";
import PaymentStep from "./PaymentStep";
import SuccessView from "./SuccessView";
import LiveSummary from "./LiveSummary";
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

interface UnavailableSlots {
  [date: string]: string[];
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
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlots>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<{
    bookingId: string;
    queuePosition: number;
    estimatedWaitMinutes: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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
    if (!state.selectedDate || !state.selectedService) return;
    setLoadingSlots(true);
    const controller = new AbortController();
    fetch(`/api/bookings/stylists/${stylist.id}/available-slots?date=${state.selectedDate}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.slots) {
          const unavailable = res.data.slots
            .filter((s: any) => !s.available)
            .map((s: any) => s.time);
          setUnavailableSlots((prev) => ({ ...prev, [state.selectedDate!]: unavailable }));
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

          <div className="flex justify-center pt-3 pb-1 lg:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700/40 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">
                {phase === "success" ? "Booking Confirmed" : `Book with ${stylist.name}`}
              </h2>
              {phase !== "success" && (
                <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
                  Complete each section below to finish your booking
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
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
                <div className="hidden lg:block w-72 shrink-0 p-5 border-r border-gray-100 dark:border-gray-700/40 bg-gray-50/50 dark:bg-surface-dark-tertiary/50 overflow-y-auto">
                  <LiveSummary stylist={stylist} state={state} />
                </div>

                <div className="flex-1 p-4 lg:p-6 space-y-3 overflow-y-auto">
                  <div className="lg:hidden">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-surface-dark-tertiary p-3">
                      <div className="flex items-center gap-3">
                        {stylist.image && (
                          <img src={stylist.image} alt={stylist.name} className="w-10 h-10 rounded-xl object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">{stylist.name}</p>
                          <p className="text-xs text-text-muted dark:text-text-dark-muted">
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
                          <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary shrink-0">{state.selectedService.price}</p>
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
                    unavailableSlots={unavailableSlots}
                    active={activeSection === "section-time"}
                    completed={timeComplete}
                    disabled={!dateComplete}
                  />

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
