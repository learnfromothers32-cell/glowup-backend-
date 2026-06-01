import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Save } from "lucide-react";

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  inkSoft: "#5A6E8A",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

const defaultSchedule: DaySchedule = { enabled: true, start: "09:00", end: "17:00" };

export default function StylistAvailability() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(
    Object.fromEntries(DAYS.map((d) => [d, { ...defaultSchedule }]))
  );
  const [saved, setSaved] = useState(false);

  const updateDay = (day: string, updates: Partial<DaySchedule>) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
          Availability
        </h1>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: T.navy }}
        >
          <Save size={14} />
          {saved ? "Saved!" : "Save"}
        </motion.button>
      </div>

      <p className="text-xs" style={{ color: T.inkSoft }}>
        Set your weekly working hours. Clients can only book during these times.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100" style={{ boxShadow: T.shadowCard }}>
        {DAYS.map((day, i) => (
          <div
            key={day}
            className={`flex items-center gap-4 px-5 py-4 ${i < DAYS.length - 1 ? "border-b border-gray-50" : ""}`}
          >
            {/* Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={schedule[day].enabled}
                onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>

            {/* Day name */}
            <span className={`text-sm font-medium w-28 ${schedule[day].enabled ? "text-gray-900" : "text-gray-300"}`}>
              {day}
            </span>

            {/* Time inputs */}
            {schedule[day].enabled ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Clock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    value={schedule[day].start}
                    onChange={(e) => updateDay(day, { start: e.target.value })}
                    className="pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <span className="text-xs text-gray-400">to</span>
                <div className="relative">
                  <Clock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    value={schedule[day].end}
                    onChange={(e) => updateDay(day, { end: e.target.value })}
                    className="pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Unavailable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
