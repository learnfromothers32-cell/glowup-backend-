import { useState, useCallback, useEffect } from "react";
import { X, ArrowLeft, AlertCircle, Check, Calendar, Clock, CreditCard } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { getAvailableSlots } from "@/api/bookings";
import { useCreateBookingMutation } from "@/domain/booking/booking.hooks";
import type { LiveService } from "@/domain/live/stores/commerceStore";

interface BookingOverlayProps {
  stylistId: string;
  stylistName: string;
  services: LiveService[];
  preSelectedServiceId?: string;
  onClose: () => void;
  onSuccess: () => void;
  className?: string;
}

type BookingPhase = "select-service" | "select-time" | "confirm" | "success";

export function BookingOverlay({
  stylistId,
  stylistName,
  services,
  preSelectedServiceId,
  onClose,
  onSuccess,
  className,
}: BookingOverlayProps) {
  const [phase, setPhase] = useState<BookingPhase>(
    preSelectedServiceId ? "select-time" : "select-service",
  );
  const [selectedService, setSelectedService] = useState<LiveService | null>(
    () => services.find((s) => s._id === preSelectedServiceId) ?? null,
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useCreateBookingMutation();

  useEffect(() => {
    if (!selectedService || phase !== "select-time") return;
    setLoadingSlots(true);
    setError(null);
    getAvailableSlots({ stylistId, date: selectedDate, serviceId: selectedService._id })
      .then((data) => setSlots(data.slots || []))
      .catch(() => {
        setSlots([]);
        setError("Failed to load available times. Please try again.");
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedService, selectedDate, stylistId, phase]);

  const handleSelectService = useCallback((service: LiveService) => {
    setSelectedService(service);
    setPhase("select-time");
    setError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedService || !selectedSlot) return;
    setError(null);
    try {
      await createBooking.mutateAsync({
        stylistId,
        serviceId: selectedService._id,
        startTime: `${selectedDate}T${selectedSlot}`,
        paymentMethod: "cash",
      });
      setPhase("success");
      onSuccess();
    } catch {
      setError("Booking failed. Please try again.");
    }
  }, [selectedService, selectedSlot, selectedDate, stylistId, createBooking, onSuccess]);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    };
  });

  const phaseLabels: Record<BookingPhase, { step: number; title: string }> = {
    "select-service": { step: 1, title: "Select Service" },
    "select-time": { step: 2, title: "Pick a Time" },
    "confirm": { step: 3, title: "Confirm Booking" },
    "success": { step: 4, title: "Booked!" },
  };

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-end sm:items-center justify-center", className)}
      role="dialog"
      aria-modal="true"
      aria-label={`Book appointment with ${stylistName}`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header with progress */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {phase === "select-time" && (
                <button
                  onClick={() => { setPhase("select-service"); setError(null); }}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Go back"
                >
                  <ArrowLeft size={16} className="text-gray-500" />
                </button>
              )}
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {phaseLabels[phase].title}
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all",
                  step <= phaseLabels[phase].step
                    ? "bg-brand-500"
                    : "bg-gray-100 dark:bg-gray-800"
                )}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs" role="alert">
            <AlertCircle size={14} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30" aria-label="Dismiss">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {phase === "select-service" && (
            <div className="space-y-2" role="listbox" aria-label="Available services">
              {services.map((service) => (
                <button
                  key={service._id}
                  onClick={() => handleSelectService(service)}
                  role="option"
                  aria-selected={selectedService?._id === service._id}
                  className="w-full text-left p-4 rounded-xl border border-gray-100 dark:border-gray-700/40 hover:border-brand-200 dark:hover:border-brand-800/40 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors">
                        {service.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={10} />{service.duration}min</span>
                        {service.category && <span>· {service.category}</span>}
                      </div>
                    </div>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                      GHS {service.price.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
              {services.length === 0 && (
                <div className="text-center py-8">
                  <Calendar size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No services available</p>
                </div>
              )}
            </div>
          )}

          {phase === "select-time" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Date</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide" role="radiogroup" aria-label="Select date">
                  {dates.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      role="radio"
                      aria-checked={selectedDate === d.value}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-w-[60px] text-center",
                        selectedDate === d.value
                          ? "bg-brand-500 text-white shadow-sm"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Available Times</label>
                {loadingSlots ? (
                  <div className="text-center py-8 text-xs text-gray-400" role="status">
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading available times...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select time slot">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => { setSelectedSlot(slot.time); setPhase("confirm"); }}
                        disabled={!slot.available}
                        role="radio"
                        aria-checked={selectedSlot === slot.time}
                        aria-disabled={!slot.available}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-semibold transition-all",
                          !slot.available
                            ? "bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through"
                            : selectedSlot === slot.time
                              ? "bg-brand-500 text-white shadow-sm"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-200",
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
                {slots.length === 0 && !loadingSlots && !error && (
                  <div className="text-center py-6">
                    <Clock size={20} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No available slots for this date</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === "confirm" && selectedService && selectedSlot && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Service</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedService.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Stylist</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stylistName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Date</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Time</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedSlot}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Duration</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedService.duration}min</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-lg font-bold text-brand-600 dark:text-brand-400">GHS {selectedService.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {phase === "success" && (
            <div className="text-center py-8" role="status">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mx-auto mb-4 flex items-center justify-center">
                <Check size={32} className="text-emerald-500" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Booked!</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                Your appointment with <span className="font-semibold text-gray-700 dark:text-gray-300">{stylistName}</span> has been confirmed
              </p>
              <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                <Calendar size={12} /> {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {selectedSlot}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700/40">
          {phase === "confirm" && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={createBooking.isPending}
              onClick={handleConfirm}
            >
              <CreditCard size={16} />
              Confirm Booking — GHS {selectedService?.price.toLocaleString()}
            </Button>
          )}
          {phase === "success" && (
            <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
