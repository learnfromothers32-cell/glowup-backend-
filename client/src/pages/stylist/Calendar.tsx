import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getStylistBookings } from "../../api/bookings";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function StylistCalendar() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    getStylistBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays };
  }, [viewDate]);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));

  const bookingsForDate = (dateStr: string) =>
    bookings.filter((b) => {
      const start = new Date(b.startTime).toLocaleDateString();
      return start === dateStr;
    });

  const todayStr = today.toLocaleDateString();
  const selectedBookings = selectedDate ? bookingsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 skeleton-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden">
            <div className="h-14 skeleton-pulse" />
            <div className="h-8 skeleton-pulse" />
            <div className="grid grid-cols-7 gap-1 p-4">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square skeleton-pulse rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 p-6">
            <div className="h-5 w-40 skeleton-pulse rounded mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 skeleton-pulse rounded-xl mb-3" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">
        Calendar
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/40">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary">
              <ChevronLeft size={18} className="text-text-secondary dark:text-text-dark-secondary" />
            </button>
            <h2 className="text-base font-bold text-text-primary dark:text-text-dark-primary">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary">
              <ChevronRight size={18} className="text-text-secondary dark:text-text-dark-secondary" />
            </button>
          </div>

          <div className="grid grid-cols-7 px-4">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-text-muted dark:text-text-dark-muted py-3">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 px-4 pb-4">
            {Array.from({ length: daysInMonth.firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth.totalDays }).map((_, i) => {
              const day = i + 1;
              const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const dateStr = date.toLocaleDateString();
              const dayBookings = bookingsForDate(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl transition min-h-[48px] sm:min-h-[60px] ${
                    isSelected
                      ? "bg-stylist-50 dark:bg-stylist-950/20 border border-stylist-200 dark:border-stylist-800"
                      : isToday
                      ? "bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200 dark:border-gray-600"
                      : "hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"
                  }`}
                >
                  <span className={`text-sm font-medium ${isToday ? "text-stylist-600 dark:text-stylist-400" : "text-text-secondary dark:text-text-dark-secondary"}`}>
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-stylist-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-sm p-6">
          <h3 className="text-sm font-bold text-text-primary dark:text-text-dark-primary mb-4">
            {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-text-muted dark:text-text-dark-muted text-center py-8">No bookings for this day</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b: any) => (
                <motion.div
                  key={b._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/40"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      b.status === "confirmed" ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400" :
                      b.status === "completed" ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" :
                      "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{b.clientId?.name || "Client"} — {b.serviceId?.name || "Service"}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
