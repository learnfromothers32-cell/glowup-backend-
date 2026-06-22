import Section from "./Section";

function generateDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface DateStepProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  active: boolean;
  completed: boolean;
  disabled: boolean;
}

export default function DateStep({ selectedDate, onSelect, active, completed, disabled }: DateStepProps) {
  const dates = generateDates(14);
  const today = dates[0];
  return (
    <Section
      id="section-date"
      number={2}
      title="Pick a Date"
      subtitle="When works for you?"
      completed={completed}
      active={active}
      disabled={disabled}
      summary={selectedDate ? formatShortDate(selectedDate) : undefined}
    >
      <div className="mt-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {dates.map((date) => {
            const d = new Date(date);
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = d.getDate();
            const monthName = d.toLocaleDateString("en-US", { month: "short" });
            const isToday = date === today;
            const isSelected = selectedDate === date;

            return (
              <button
                key={date}
                onClick={() => onSelect(date)}
                className={`flex flex-col items-center py-2.5 px-3 rounded-xl border min-w-[56px] transition-all duration-200 shrink-0 ${
                  isSelected
                    ? "border-brand-500 bg-brand-500 text-white shadow-md"
                    : "border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary hover:border-gray-200 dark:hover:border-gray-600"
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase ${isSelected ? "text-white/70" : "text-text-muted dark:text-text-dark-muted"}`}>
                  {isToday ? "Today" : dayName}
                </span>
                <span className={`text-lg font-bold ${isSelected ? "text-white" : "text-text-primary dark:text-text-dark-primary"}`}>
                  {dayNum}
                </span>
                <span className={`text-[9px] ${isSelected ? "text-white/70" : "text-text-muted dark:text-text-dark-muted"}`}>
                  {monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
