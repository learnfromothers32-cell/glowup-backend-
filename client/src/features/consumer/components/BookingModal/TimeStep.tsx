import { Loader2 } from "lucide-react";
import Section from "./Section";

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

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface TimeStepProps {
  selectedDate: string | null;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  loading: boolean;
  unavailableSlots: Record<string, string[]>;
  active: boolean;
  completed: boolean;
  disabled: boolean;
}

export default function TimeStep({
  selectedDate,
  selectedTime,
  onSelect,
  loading,
  unavailableSlots,
  active,
  completed,
  disabled,
}: TimeStepProps) {
  return (
    <Section
      id="section-time"
      number={3}
      title="Choose a Time"
      subtitle={selectedDate ? formatShortDate(selectedDate) : "Select a date first"}
      completed={completed}
      active={active}
      disabled={disabled}
      summary={
        selectedTime
          ? TIME_SLOTS.find((s) => s.time === selectedTime)?.label
          : undefined
      }
    >
      <div className="mt-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-text-muted dark:text-text-dark-muted">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            <span className="text-sm">Checking availability…</span>
          </div>
        ) : (
          <div className="space-y-4">
            {(["morning", "afternoon", "evening"] as const).map((period) => {
              const slots = TIME_SLOTS.filter((s) => s.period === period);
              const periodLabel = period === "morning" ? "Morning" : period === "afternoon" ? "Afternoon" : "Evening";

              return (
                <div key={period}>
                  <p className="text-[11px] font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider mb-2">
                    {periodLabel}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map(({ time, label }) => {
                      const unavailable = unavailableSlots[selectedDate ?? ""]?.includes(time) ?? false;
                      const isSelected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          onClick={() => !unavailable && onSelect(time)}
                          disabled={unavailable}
                          className={`py-2.5 px-2 rounded-xl border text-center text-xs font-medium transition-all duration-200 ${
                            unavailable
                              ? "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              : isSelected
                                ? "border-brand-500 bg-brand-500 text-white shadow-md active:bg-brand-500 active:text-white"
                                : "border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary hover:border-gray-200 dark:hover:border-gray-600"
                          }`}
                        >
                          {label}
                          {unavailable && (
                            <span className="block text-[9px] text-gray-300 dark:text-gray-600 mt-0.5">Booked</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
