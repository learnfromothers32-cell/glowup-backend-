import { Clock, CheckCircle, X, AlertTriangle, Loader2 } from "lucide-react";

export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  const t = new Date();
  const tm = new Date(t);
  tm.setDate(t.getDate() + 1);
  if (date.toDateString() === t.toDateString()) return "Today";
  if (date.toDateString() === tm.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function fmtTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(`2000-01-01T${d}:00`) : d;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function fmtISO(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function StatusBadge({ status, date }: { status: string; date?: string }) {
  if (status === "cancelled")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
        <X size={8} />
        Cancelled
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stylist-50 text-stylist-600 text-[10px] font-bold">
        <Clock size={8} />
        Pending
      </span>
    );
  if (status === "in-progress")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-bold">
        <Loader2 size={8} className="animate-spin" />
        In Progress
      </span>
    );
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">
        <CheckCircle size={8} />
        Completed
      </span>
    );
  if (date) {
    const isToday = fmtDate(date) === "Today";
    const isPast = new Date(date + "T00:00:00") < new Date();
    if (isToday)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-bold">
          <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          Today
        </span>
      );
    if (isPast)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">
          <CheckCircle size={8} />
          Done
        </span>
      );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">
      <AlertTriangle size={8} />
      {status}
    </span>
  );
}

export function getLocationString(loc: any): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object" && "area" in loc) return loc.area;
  const parts = [loc.city, loc.state, loc.zip].filter(Boolean);
  return parts.join(", ") || loc.address || "";
}

export const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

export function generateDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export function fmtSlot(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
