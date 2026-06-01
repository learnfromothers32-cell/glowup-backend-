import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getStylistBookings } from "../../api/bookings";

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  inkSoft: "#5A6E8A",
  canvas: "#FFFFFF",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
        Calendar
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <h2 className="text-base font-bold" style={{ color: T.navy }}>
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 px-4">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-3">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
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
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition min-h-[60px] ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200"
                      : isToday
                      ? "bg-gray-50 border border-gray-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No bookings for this day</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b: any) => (
                <motion.div
                  key={b._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      b.status === "confirmed" ? "bg-green-50 text-green-600" :
                      b.status === "completed" ? "bg-blue-50 text-blue-600" :
                      "bg-amber-50 text-amber-600"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{b.clientId?.name || "Client"} — {b.serviceId?.name || "Service"}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
