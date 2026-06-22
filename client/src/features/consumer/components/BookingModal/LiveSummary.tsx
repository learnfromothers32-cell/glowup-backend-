import { Star, MapPin, Sparkles, Calendar, Clock } from "lucide-react";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";
import type { ServiceObject } from "./BookingModal";

interface BookingState {
  selectedService: ServiceObject | null;
  selectedDate: string | null;
  selectedTime: string | null;
}

const TIME_SLOTS = [
  { time: "09:00", label: "9:00 AM" },
  { time: "10:00", label: "10:00 AM" },
  { time: "11:00", label: "11:00 AM" },
  { time: "12:00", label: "12:00 PM" },
  { time: "13:00", label: "1:00 PM" },
  { time: "14:00", label: "2:00 PM" },
  { time: "15:00", label: "3:00 PM" },
  { time: "16:00", label: "4:00 PM" },
  { time: "17:00", label: "5:00 PM" },
];

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function LiveSummary({
  stylist,
  state,
}: {
  stylist: Stylist;
  state: BookingState;
}) {
  const timeLabel = state.selectedTime
    ? (TIME_SLOTS.find((s) => s.time === state.selectedTime)?.label ?? state.selectedTime)
    : null;

  return (
    <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
            {stylist.image && (
              <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">{stylist.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-text-muted dark:text-text-dark-muted">
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

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${state.selectedService ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-text-dark-muted"}`}>
            <Sparkles size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted dark:text-text-dark-muted mb-0.5">Service</p>
            {state.selectedService ? (
              <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{state.selectedService.name}</p>
            ) : (
              <p className="text-sm text-text-muted dark:text-text-dark-muted">Not selected</p>
            )}
          </div>
          {state.selectedService && (
            <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary shrink-0">{state.selectedService.price}</p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${state.selectedDate ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-text-dark-muted"}`}>
            <Calendar size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted dark:text-text-dark-muted mb-0.5">Date</p>
            {state.selectedDate ? (
              <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{formatShortDate(state.selectedDate)}</p>
            ) : (
              <p className="text-sm text-text-muted dark:text-text-dark-muted">Not selected</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${state.selectedTime ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-text-dark-muted"}`}>
            <Clock size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted dark:text-text-dark-muted mb-0.5">Time</p>
            {state.selectedTime ? (
              <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{timeLabel}</p>
            ) : (
              <p className="text-sm text-text-muted dark:text-text-dark-muted">Not selected</p>
            )}
          </div>
        </div>

        {state.selectedService && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-text-dark-muted">
              <Clock size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted dark:text-text-dark-muted mb-0.5">Duration</p>
              <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{state.selectedService.duration}</p>
            </div>
          </div>
        )}
      </div>

      {state.selectedService && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-surface-dark-tertiary border-t border-gray-100 dark:border-gray-700/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary">Total</span>
            <span className="text-lg font-bold text-text-primary dark:text-text-dark-primary">{state.selectedService.price}</span>
          </div>
        </div>
      )}
    </div>
  );
}
