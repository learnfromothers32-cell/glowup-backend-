import { useEffect, useState, useCallback, useRef } from "react";
import {
  Radio,
  Scissors,
  Users,
  Zap,
  Eye,
  MapPin,
  Star,
  ArrowUpRight,
  Play,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = "live" | "booking" | "join";

interface Activity {
  type: ActivityType;
  text: string;
  meta: string;
  avatar: string;
  time: string;
  location?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROTATE_INTERVAL_MS = 3000;

const ACTIVITIES: Activity[] = [
  {
    type: "live",
    text: "Ama Beauty Studio",
    meta: "Volume blow-out session",
    avatar: "AB",
    time: "LIVE NOW",
    location: "East Legon",
  },
  {
    type: "booking",
    text: "Kofi Cuts",
    meta: "Signature fade booked",
    avatar: "KC",
    time: "2 min ago",
    location: "Osu",
  },
  {
    type: "join",
    text: "Efia Braids Studio",
    meta: "Just joined GlowUp",
    avatar: "EB",
    time: "5 min ago",
    location: "East Legon",
  },
  {
    type: "live",
    text: "Glow Spa & Wellness",
    meta: "Hydrating facial treatment",
    avatar: "GS",
    time: "LIVE NOW",
    location: "Cantonments",
  },
  {
    type: "booking",
    text: "Braids by Efia",
    meta: "Knotless box braids booked",
    avatar: "BE",
    time: "1 min ago",
    location: "Airport",
  },
  {
    type: "live",
    text: "Touché Studio",
    meta: "Full color transformation",
    avatar: "TS",
    time: "LIVE NOW",
    location: "Labone",
  },
  {
    type: "booking",
    text: "Kwame's Barbershop",
    meta: "Hot towel shave booked",
    avatar: "KB",
    time: "3 min ago",
    location: "Dansoman",
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_PALETTES = [
  { bg: "#fef1f4", fg: "#f43f5e" },
  { bg: "#fffbeb", fg: "#d4a76a" },
  { bg: "#fff1f2", fg: "#e11d48" },
  { bg: "#ffe4e8", fg: "#be123c" },
  { bg: "#fecdd6", fg: "#9f1239" },
  { bg: "#fda4b3", fg: "#881337" },
  { bg: "#fb7188", fg: "#4c0519" },
];

function getPalette(name: string) {
  return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
}

// ─── Avatar Component (Tailwind) ──────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const palette = getPalette(name);
  const fontSize = Math.round(size * 0.34);
  const radius = Math.round(size * 0.3);
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 font-extrabold tracking-tight"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: palette.bg,
        color: palette.fg,
        fontSize,
        border: "1.5px solid rgba(0,0,0,0.06)",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Stat Card (Tailwind) ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  bg,
  border,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl min-w-[100px] p-3.5"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <Icon size={15} color={color} className="mb-2" />
      <p className="text-2xl font-black leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-xs font-semibold mt-1 opacity-70" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

// ─── Activity Card (Tailwind) ─────────────────────────────────────────────────

function ActivityCard({
  activity,
}: {
  activity: Activity;
}) {
  const cfg = {
    live: {
      color: "#e11d48",
      bg: "#fef1f4",
      border: "#fda4b3",
      icon: Radio,
      label: "LIVE NOW",
      dotColor: "#e11d48",
    },
    booking: {
      color: "#b8860b",
      bg: "#fffbeb",
      border: "#fde68a",
      icon: Scissors,
      label: "BOOKED",
      dotColor: "#b8860b",
    },
    join: {
      color: "#f43f5e",
      bg: "#fef1f4",
      border: "#fecdd6",
      icon: Sparkles,
      label: "NEW",
      dotColor: "#f43f5e",
    },
  }[activity.type];
  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-sm p-3.5 flex items-center gap-3.5"
      style={{ background: "#FFFFFF", border: `1px solid #EAE4D9` }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: cfg.color, borderRadius: "3px 0 0 3px" }}
      />

      <Avatar name={activity.avatar} size={42} />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <p className="text-sm font-extrabold text-gray-900 truncate">
            {activity.text}
          </p>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.color,
            }}
          >
            {activity.type === "live" && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: cfg.dotColor }}
              />
            )}
            {cfg.label}
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">{activity.meta}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {activity.location && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin size={10} />
              {activity.location}
            </span>
          )}
          <span
            className={`text-[11px] font-bold ${activity.type === "live" ? "text-brand-500" : "text-gray-400"}`}
          >
            {activity.time}
          </span>
        </div>
      </div>

      {activity.type === "live" && (
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <Play size={14} color={cfg.color} fill={cfg.color} />
        </button>
      )}
    </div>
  );
}

// ─── Ticker Row (Tailwind + keyframes) ───────────────────────────────────────

function TickerRow() {
  const items = [
    { icon: Eye, text: "24 people watching now" },
    { icon: Scissors, text: "156 bookings today" },
    { icon: Star, text: "4.8 avg rating" },
    { icon: Users, text: "89 stylists online" },
    { icon: Eye, text: "3 live sessions" },
    { icon: Zap, text: "8 new bookings this hour" },
  ];
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden rounded-xl py-2"
      style={{
        border: `1px solid #EAE4D9`,
        background: "#FFFFFF",
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="flex gap-12 animate-scroll whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <item.icon size={12} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feed Stack ───────────────────────────────────────────────────────────────

function FeedStack({
  activities,
  activeIndex,
}: {
  activities: Activity[];
  activeIndex: number;
}) {
  const prevIdx = (activeIndex - 1 + activities.length) % activities.length;
  const nextIdx = (activeIndex + 1) % activities.length;

  const stack = [
    { activity: activities[prevIdx], opacity: 0.3, scale: 0.97, blur: 1 },
    { activity: activities[activeIndex], opacity: 1, scale: 1, blur: 0 },
    { activity: activities[nextIdx], opacity: 0.3, scale: 0.97, blur: 1 },
  ];

  return (
    <div className="flex flex-col gap-2.5 relative">
      {stack.map(({ activity, opacity, scale, blur }, idx) => (
        <div
          key={`${activeIndex}-${idx}`}
          style={{
            opacity,
            transform: `scale(${scale})`,
            filter: `blur(${blur}px)`,
            transition:
              "opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease",
          }}
        >
          <ActivityCard activity={activity} />
        </div>
      ))}
    </div>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function FeedDots({
  total,
  active,
  onChange,
}: {
  total: number;
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="h-2 rounded-full transition-all duration-300 cursor-pointer border-0 p-0"
          style={{
            width: i === active ? 24 : 8,
            background: i === active ? "#18150F" : "#D9D0C0",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiveSection() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % ACTIVITIES.length);
  }, []);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(advance, ROTATE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, advance]);

  const liveCount = ACTIVITIES.filter((a) => a.type === "live").length;
  const bookingCount = ACTIVITIES.filter((a) => a.type === "booking").length;

  return (
    <section
      className="py-16 px-4 sm:px-8 overflow-hidden dark:bg-surface-dark"
      style={{ background: "#F7F4EF" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Live on GlowUp
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight tracking-tight max-w-md mt-2">
            See what's happening right now
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-md mt-3">
            Stylists are going live, clients are booking, and transformations
            are happening in real time.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mb-7">
          <StatCard
            icon={Radio}
            value={`${liveCount}`}
            label="Live now"
            color="#e11d48"
            bg="#fef1f4"
            border="#fda4b3"
          />
          <StatCard
            icon={Scissors}
            value={`${bookingCount}`}
            label="Just booked"
            color="#b8860b"
            bg="#fffbeb"
            border="#fde68a"
          />
          <StatCard
            icon={Users}
            value="89"
            label="Online stylists"
            color="#f43f5e"
            bg="#fef1f4"
            border="#fecdd6"
          />
          <StatCard
            icon={Eye}
            value="24"
            label="Watching now"
            color="#d4a76a"
            bg="#fffbeb"
            border="#fde68a"
          />
        </div>

        {/* Ticker */}
        <div className="mb-7">
          <TickerRow />
        </div>

        {/* Feed + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Feed stack */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
            <FeedStack activities={ACTIVITIES} activeIndex={activeIndex} />
            <FeedDots
              total={ACTIVITIES.length}
              active={activeIndex}
              onChange={setActiveIndex}
            />
          </div>

          {/* Sidebar – featured live event */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
            <div className="h-1 bg-gradient-to-r from-brand-500 to-gold-500" />
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-600 text-[10px] font-extrabold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                  Live now
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                  <Eye size={11} /> 12 watching
                </span>
              </div>

              <div className="flex gap-3 mb-4">
                <Avatar name="Ama Beauty" size={48} />
                <div>
                  <p className="text-base font-extrabold text-gray-900">
                    Ama Beauty Studio
                  </p>
                  <p className="text-sm text-gray-600">
                    Volume blow-out session
                  </p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin size={10} /> East Legon
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-4 p-2.5 rounded-xl bg-gold-50 border border-gold-200">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={13}
                    className="text-gold-500 fill-gold-500"
                  />
                ))}
                <span className="text-sm font-extrabold text-gold-700 ml-1">
                  4.9
                </span>
                <span className="text-xs text-gray-400">(128 reviews)</span>
              </div>

              <button
                onClick={() => navigate("/signup")}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-100 dark:bg-white dark:text-gray-900"
              >
                <Play size={15} fill="white" /> Watch live session
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="w-full mt-2 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-white transition"
              >
                Browse all live sessions <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
