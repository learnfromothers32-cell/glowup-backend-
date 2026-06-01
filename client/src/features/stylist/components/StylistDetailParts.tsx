import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  ArrowLeft,
  Clock,
  ChevronRight,
  Award,
  Zap,
  Calendar,
  Maximize2,
  ArrowRight,
  MessageSquare,
  BadgeCheck,
  Users,
  ChevronLeft,
  Scissors,
  Sparkles,
  ImageIcon,
  Phone,
  Camera,
  Shield,
  TrendingUp,
  Globe,
  MoreHorizontal,
  Grid3X3,
  List,
  ExternalLink,
  ThumbsUp,
  Eye,
  Lock,
  RefreshCw,
} from "lucide-react";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";

/* DESIGN TOKENS (copied from original file) */
export const T = {
  navy: "#0B1A33",
  navyMid: "#1A2F54",
  navyLight: "#253D6A",
  navyGhost: "#EDF2FF",
  gold: "#B8862A",
  goldMid: "#D4A047",
  goldLight: "#F9F1E2",
  goldGhost: "#FDF8F0",
  bg: "#F4F7FC",
  canvas: "#FFFFFF",
  raised: "#F8FAFD",
  muted: "#EEF2F8",
  line: "#E9EEF5",
  lineMid: "#DCE3EE",
  ink: "#0A1424",
  inkMid: "#364A6B",
  inkSoft: "#5A6E8A",
  inkFaint: "#8E9FB2",
  white: "#FFFFFF",
  green: "#059669",
  greenLight: "#ECFDF5",
  greenMid: "#10B981",
  red: "#DC2626",
  redLight: "#FEF2F2",
  shadowXs: "0 1px 2px rgba(10,20,40,0.04)",
  shadowSm: "0 2px 8px rgba(10,20,40,0.06)",
  shadowMd: "0 6px 18px rgba(10,20,40,0.07)",
  shadowLg: "0 12px 32px rgba(10,20,40,0.08)",
  shadowXl: "0 24px 48px rgba(10,20,40,0.10)",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

export const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
export const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";

/* TYPES */
export type TabKey =
  | "about"
  | "portfolio"
  | "services"
  | "reviews"
  | "transformations";
export interface Review {
  user: string;
  rating: number;
  comment: string;
  date: string;
}
export interface BeforeAfter {
  before: string;
  after: string;
  caption?: string;
}
export interface ServiceItem {
  name: string;
  price: string;
  duration: string;
  category?: string;
  popular?: boolean;
}

export interface ExtendedStylist extends Stylist {
  portfolioImages?: string[];
  beforeAfter?: BeforeAfter[];
  bio?: string;
  reviews: Review[];
  isVerified?: boolean;
}

/* HELPERS */
export function safeServices(services: Stylist["services"]): ServiceItem[] {
  if (!services) return [];
  return services.map((s) =>
    typeof s === "string"
      ? { name: s, price: "", duration: "" }
      : (s as ServiceItem),
  );
}
export function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* STAR RATING */
export function StarRating({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          style={{
            color: n <= Math.round(rating) ? T.goldMid : T.line,
            fill: n <= Math.round(rating) ? T.goldMid : "none",
          }}
        />
      ))}
    </span>
  );
}

/* PILL BADGE */
export function PillBadge({
  icon: Icon,
  label,
  variant = "muted",
}: {
  icon: React.ElementType;
  label: string;
  variant?: "navy" | "gold" | "green" | "muted";
}) {
  const v: Record<string, { bg: string; color: string }> = {
    navy: { bg: T.navyGhost, color: T.navyMid },
    gold: { bg: T.goldGhost, color: T.gold },
    green: { bg: T.greenLight, color: T.green },
    muted: { bg: T.muted, color: T.inkSoft },
  };
  const s = v[variant];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      <Icon size={11} /> {label}
    </span>
  );
}

/* LIGHTBOX */
export function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
      if (e.key === "ArrowRight")
        setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);
  if (!images?.length) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative max-w-4xl w-full mx-4">
        <img src={images[index]} alt="" className="w-full h-auto rounded-lg" />
      </div>
    </div>
  );
}

/* HSCROLL */
export function HScroll({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(true);
  const check = () => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setLeft(scrollLeft > 10);
    setRight(scrollLeft < scrollWidth - clientWidth - 10);
  };
  useEffect(() => {
    check();
    ref.current?.addEventListener("scroll", check);
    return () => ref.current?.removeEventListener("scroll", check);
  }, []);
  return (
    <div className="relative group/hs">
      <div
        ref={ref}
        className={`flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory ${className}`}
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>
      {left && (
        <button
          onClick={() =>
            ref.current?.scrollBy({ left: -280, behavior: "smooth" })
          }
          className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/hs:opacity-100 transition-all z-10"
          style={{ background: T.canvas, color: T.ink, boxShadow: T.shadowMd }}
        >
          <ChevronLeft size={15} />
        </button>
      )}
      {right && (
        <button
          onClick={() =>
            ref.current?.scrollBy({ left: 280, behavior: "smooth" })
          }
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/hs:opacity-100 transition-all z-10"
          style={{ background: T.canvas, color: T.ink, boxShadow: T.shadowMd }}
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

/* BEFORE / AFTER SLIDER */
export function BeforeAfterSlider({
  item,
  index,
}: {
  item: BeforeAfter;
  index: number;
}) {
  const [pos, setPos] = useState(50);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const move = useCallback((x: number) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos((Math.max(0, Math.min(x - r.left, r.width)) / r.width) * 100);
  }, []);
  useEffect(() => {
    if (!drag) return;
    const mm = (e: MouseEvent | TouchEvent) =>
      move("touches" in e ? e.touches[0].clientX : e.clientX);
    const up = () => setDrag(false);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", mm);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", mm);
      window.removeEventListener("touchend", up);
    };
  }, [drag, move]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl overflow-hidden shadow-card"
      style={{ background: T.canvas }}
    >
      <div
        ref={ref}
        className="relative aspect-[4/3] overflow-hidden cursor-col-resize select-none"
        onMouseDown={() => setDrag(true)}
        onTouchStart={() => setDrag(true)}
      >
        <img
          src={item.after}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={item.before}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div
          className="absolute top-0 bottom-0 w-px z-10"
          style={{ left: `${pos}%`, background: T.gold }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: T.gold }}
          >
            <ChevronLeft size={12} color="#fff" />
            <ChevronRight size={12} color="#fff" />
          </div>
        </div>
        {[
          {
            label: "Before",
            side: "left-3",
            bg: "rgba(11,20,40,0.65)",
            color: "#fff",
          },
          { label: "After", side: "right-3", bg: T.gold, color: "#fff" },
        ].map(({ label, side, bg, color }) => (
          <div
            key={label}
            className={`absolute top-3 ${side} z-10 px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase`}
            style={{ background: bg, color, backdropFilter: "blur(8px)" }}
          >
            {label}
          </div>
        ))}
      </div>
      {item.caption && (
        <div className="px-5 py-3.5 border-t" style={{ borderColor: T.line }}>
          <p
            className="text-xs text-center font-medium"
            style={{ color: T.inkSoft }}
          >
            {item.caption}
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* EMPTY STATE */
export function EmptyState({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: T.muted }}
      >
        <Icon size={24} style={{ color: T.inkFaint }} />
      </div>
      <p className="text-sm font-semibold mb-1.5" style={{ color: T.ink }}>
        {title}
      </p>
      <p
        className="text-xs max-w-[240px] leading-relaxed"
        style={{ color: T.inkFaint }}
      >
        {sub}
      </p>
    </div>
  );
}

/* SECTION HEADER */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
      className="flex items-end justify-between mb-5"
    >
      <div>
        <h2
          className="text-lg font-bold"
          style={{ color: T.ink, fontFamily: FONT_DISPLAY }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs mt-0.5 font-medium"
            style={{ color: T.inkFaint }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

/* PORTFOLIO TAB */
export function PortfolioTab({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (i: number) => void;
}) {
  const [layout, setLayout] = useState<"masonry" | "grid">("masonry");
  if (!images?.length)
    return (
      <EmptyState
        icon={ImageIcon}
        title="Portfolio coming soon"
        sub="Check back to see this stylist's work"
      />
    );
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-medium" style={{ color: T.inkFaint }}>
          {images.length} photos
        </p>
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: T.muted }}
        >
          {[
            { key: "masonry" as const, icon: Grid3X3 },
            { key: "grid" as const, icon: List },
          ].map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setLayout(key)}
              className="p-1.5 rounded-md transition-all"
              style={{
                background: layout === key ? T.canvas : "transparent",
                color: layout === key ? T.ink : T.inkFaint,
                boxShadow: layout === key ? T.shadowSm : "none",
              }}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      </div>
      {layout === "masonry" ? (
        <div className="columns-2 sm:columns-3 gap-2.5">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onOpen(i)}
              className="group relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer mb-2.5"
              style={{ background: T.muted }}
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ background: "rgba(11,20,40,0.45)" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: T.goldMid }}
                >
                  <Maximize2 size={14} color="#fff" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onOpen(i)}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
              style={{ background: T.muted }}
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ background: "rgba(11,20,40,0.45)" }}
              >
                <Eye size={16} color="#fff" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* SERVICES TAB */
export function ServicesTab({
  services,
  onBook,
  stylistId,
}: {
  services: ServiceItem[];
  onBook: (s: ServiceItem) => void;
  stylistId: string;
}) {
  const cats = [...new Set(services.map((s) => s.category || "General"))];
  const [cat, setCat] = useState(cats[0] || "General");
  if (!services.length)
    return (
      <EmptyState
        icon={Scissors}
        title="No services listed"
        sub="Contact the stylist for pricing"
      />
    );
  return (
    <div>
      {cats.length > 1 && (
        <div
          className="flex gap-2 mb-5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: cat === c ? T.navy : T.muted,
                color: cat === c ? T.white : T.inkSoft,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {services
          .filter((s) => (s.category || "General") === cat)
          .map((svc, i) => (
            <motion.div
              key={`${cat}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
                style={{ background: T.canvas, boxShadow: T.shadowSm }}
              >
                {svc.popular && (
                  <div
                    className="absolute top-0 inset-x-0 h-0.5"
                    style={{
                      background: `linear-gradient(to right, ${T.goldMid}, ${T.navy})`,
                    }}
                  />
                )}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: T.goldGhost }}
                    >
                      <Scissors size={17} style={{ color: T.goldMid }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link
                          to={`/app/stylist/${stylistId}/service/${encodeURIComponent(svc.name)}`}
                          className="text-sm font-semibold transition-colors"
                          style={{ color: T.ink }}
                        >
                          {svc.name}
                        </Link>
                        {svc.popular && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                            style={{ background: T.goldLight, color: T.gold }}
                          >
                            Popular
                          </span>
                        )}
                      </div>
                      {svc.duration && (
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: T.inkFaint }}
                        >
                          <Clock size={10} /> {svc.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 mt-1 sm:mt-0">
                    <span
                      className="text-lg font-bold tabular-nums"
                      style={{ color: T.ink, fontFamily: FONT_DISPLAY }}
                    >
                      {svc.price || "—"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onBook(svc);
                      }}
                      className="px-3 py-2 text-[11px] sm:px-4 sm:py-2 sm:text-xs font-bold rounded-lg transition-all duration-200 active:scale-95 flex items-center gap-1"
                      style={{ background: T.navy, color: T.white }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = T.goldMid)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = T.navy)
                      }
                    >
                      Book <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

/* REVIEWS TAB */
export function ReviewsTab({ stylist }: { stylist: ExtendedStylist }) {
  const reviews = stylist.reviews || [];
  const dist = [5, 4, 3, 2, 1].map((n) => {
    const count = reviews.filter((r) => Math.floor(r.rating) === n).length;
    return {
      stars: n,
      count,
      pct: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    };
  });
  return (
    <div>
      <div
        className="rounded-2xl overflow-hidden mb-6 shadow-card"
        style={{ background: T.canvas }}
      >
        <div
          className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x"
          style={{ borderColor: T.line }}
        >
          <div className="p-5 sm:p-7 flex items-center gap-4 sm:gap-6">
            <div className="text-center shrink-0">
              <p
                className="text-6xl font-bold leading-none"
                style={{ color: T.ink, fontFamily: FONT_DISPLAY }}
              >
                {stylist.rating.toFixed(1)}
              </p>
              <div className="mt-2">
                <StarRating rating={Math.round(stylist.rating)} size={15} />
              </div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mt-1.5"
                style={{ color: T.inkFaint }}
              >
                {reviews.length} reviews
              </p>
            </div>
            <div className="flex-1 space-y-2">
              {dist.map((d) => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-bold w-2.5 tabular-nums"
                    style={{ color: T.inkFaint }}
                  >
                    {d.stars}
                  </span>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: T.muted }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.pct}%` }}
                      transition={{
                        duration: 0.9,
                        delay: 0.2,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full"
                      style={{ background: T.goldMid }}
                    />
                  </div>
                  <span
                    className="text-[11px] w-3.5 tabular-nums text-right"
                    style={{ color: T.inkFaint }}
                  >
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 sm:p-7">
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{ color: T.inkFaint }}
            >
              Category Scores
            </p>
            <div className="space-y-3.5">
              {[
                { label: "Cleanliness", score: 4.9 },
                { label: "Punctuality", score: 4.8 },
                { label: "Skill Level", score: 5.0 },
                { label: "Value", score: 4.7 },
              ].map(({ label, score }) => (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className="text-xs w-20 shrink-0"
                    style={{ color: T.inkSoft }}
                  >
                    {label}
                  </span>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: T.muted }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(score / 5) * 100}%` }}
                      transition={{
                        duration: 0.9,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full"
                      style={{ background: T.navyMid }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold w-5 tabular-nums"
                    style={{ color: T.ink }}
                  >
                    {score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((rev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl shadow-card"
              style={{ background: T.canvas }}
            >
              <div className="p-5">
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${T.navy}, ${T.navyLight})`,
                      color: T.white,
                    }}
                  >
                    {rev.user[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p
                          className="text-sm font-bold"
                          style={{ color: T.ink }}
                        >
                          {rev.user}
                        </p>
                        <StarRating rating={rev.rating} size={11} />
                      </div>
                      <span
                        className="text-[10px] shrink-0"
                        style={{ color: T.inkFaint }}
                      >
                        {rev.date}
                      </span>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: T.inkSoft }}
                    >
                      {rev.comment}
                    </p>
                    <div
                      className="flex items-center gap-4 mt-3.5 pt-3.5"
                      style={{ borderTop: `1px solid ${T.line}` }}
                    >
                      {[
                        {
                          icon: ThumbsUp,
                          label: "Helpful",
                          hoverColor: T.goldMid,
                        },
                        {
                          icon: MessageSquare,
                          label: "Reply",
                          hoverColor: T.navy,
                        },
                      ].map(({ icon: Icon, label, hoverColor }) => (
                        <button
                          key={label}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                          style={{ color: T.inkFaint }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = hoverColor)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = T.inkFaint)
                          }
                        >
                          <Icon size={11} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No reviews yet"
          sub="Be the first to share your experience"
        />
      )}
    </div>
  );
}

/* TRANSFORMATIONS TAB */
export function TransformationsTab({ items }: { items: BeforeAfter[] }) {
  if (!items?.length)
    return (
      <EmptyState
        icon={Sparkles}
        title="No transformations yet"
        sub="Check back for incredible makeovers"
      />
    );
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((item, i) => (
        <BeforeAfterSlider key={i} item={item} index={i} />
      ))}
    </div>
  );
}

/* SKELETON */
export function Skeleton() {
  return (
    <div className="min-h-screen" style={{ background: T.bg }}>
      <div
        className="h-64 sm:h-[520px] animate-pulse"
        style={{ background: T.muted }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl animate-pulse"
              style={{ background: T.muted }}
            />
          ))}
        </div>
        <div
          className="h-[520px] rounded-2xl animate-pulse"
          style={{ background: T.muted }}
        />
      </div>
    </div>
  );
}

/* BOOKING CARD */
export function BookingCard({
  stylist,
  services,
  minPrice,
  onBook,
}: {
  stylist: ExtendedStylist;
  services: ServiceItem[];
  minPrice: number;
  onBook: (svc?: ServiceItem) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: T.canvas, boxShadow: T.shadowLg }}
    >
      <div
        className="px-5 pt-5 pb-4 flex items-center gap-3"
        style={{ borderBottom: `1px solid ${T.line}` }}
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner">
            {stylist.image ? (
              <img
                src={stylist.image}
                alt={stylist.name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-base font-bold"
                style={{
                  background: `linear-gradient(135deg,${T.navy},${T.navyLight})`,
                  color: T.white,
                }}
              >
                {getInitials(stylist.name)}
              </div>
            )}
          </div>
          {stylist.isLive && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white animate-pulse"
              style={{ background: T.greenMid }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold truncate" style={{ color: T.ink }}>
              {stylist.name}
            </p>
            {stylist.isVerified && (
              <BadgeCheck
                size={14}
                style={{ color: T.goldMid }}
                className="shrink-0"
              />
            )}
          </div>
          <p
            className="text-xs flex items-center gap-1 mt-0.5"
            style={{ color: T.inkFaint }}
          >
            <MapPin size={10} /> {getLocationString(stylist.location)}
          </p>
        </div>

        <div
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: T.goldGhost }}
        >
          <Star size={12} fill={T.goldMid} style={{ color: T.goldMid }} />
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: T.ink }}
          >
            {stylist.rating.toFixed(1)}
          </span>
          <span className="text-[10px]" style={{ color: T.inkFaint }}>
            ({stylist.reviews.length})
          </span>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: T.inkFaint }}
            >
              Starting from
            </p>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl sm:text-4xl font-bold tabular-nums leading-none"
                style={{ color: T.ink, fontFamily: FONT_DISPLAY }}
              >
                {minPrice > 0 ? `GH₵ ${minPrice}` : "—"}
              </span>
              {minPrice > 0 && (
                <span
                  className="text-xs font-medium"
                  style={{ color: T.inkFaint }}
                >
                  / session
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 mt-0.5">
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: T.greenLight, color: T.green }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: T.greenMid }}
              />
              Available Today
            </span>
            <span
              className="text-[10px] font-medium"
              style={{ color: T.inkFaint }}
            >
              Usually responds in &lt;1hr
            </span>
          </div>
        </div>
      </div>

      <div
        className="mx-5 mb-5 rounded-xl overflow-hidden"
        style={{ background: T.raised, boxShadow: T.shadowXs }}
      >
        <div
          className="grid grid-cols-3 divide-x"
          style={{ borderColor: T.line }}
        >
          {[
            { icon: Star, value: stylist.rating.toFixed(1), label: "Rating" },
            {
              icon: MessageSquare,
              value: `${stylist.reviews.length}+`,
              label: "Reviews",
            },
            { icon: Scissors, value: `${services.length}`, label: "Services" },
          ].map(({ icon: SIcon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center py-3.5 gap-0.5"
            >
              <SIcon size={13} style={{ color: T.goldMid }} />
              <p
                className="text-base font-bold tabular-nums leading-tight"
                style={{ color: T.ink, fontFamily: FONT_DISPLAY }}
              >
                {value}
              </p>
              <p
                className="text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: T.inkFaint }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-2.5">
        <button
          onClick={() => onBook()}
          className="w-full group relative overflow-hidden flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            color: T.white,
            boxShadow: `0 4px 20px rgba(15,31,61,0.28)`,
          }}
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.07) 50%, transparent 65%)",
            }}
          />
          <Calendar size={15} />
          Book an Appointment
          <ArrowRight
            size={13}
            className="ml-0.5 transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </button>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              icon: MessageSquare,
              label: "Message",
              hoverBg: T.navyGhost,
              hoverColor: T.navy,
            },
            {
              icon: Phone,
              label: "Call",
              hoverBg: T.goldGhost,
              hoverColor: T.gold,
            },
          ].map(({ icon: Icon, label, hoverBg, hoverColor }) => (
            <button
              key={label}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: T.raised, color: T.inkSoft }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = hoverBg;
                (e.currentTarget as HTMLElement).style.color = hoverColor;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = T.raised;
                (e.currentTarget as HTMLElement).style.color = T.inkSoft;
              }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mx-5 mt-4 mb-5 rounded-xl overflow-hidden"
        style={{ background: T.raised, boxShadow: T.shadowXs }}
      >
        {[
          { icon: Lock, label: "Payments are 100% secure & encrypted" },
          { icon: RefreshCw, label: "Free cancellation up to 24h before" },
          { icon: BadgeCheck, label: "Identity-verified professional stylist" },
        ].map(({ icon: TIcon, label }, idx, arr) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              borderBottom:
                idx < arr.length - 1 ? `1px solid ${T.line}` : "none",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: T.greenLight }}
            >
              <TIcon size={11} style={{ color: T.green }} />
            </div>
            <span
              className="text-[11px] font-medium leading-snug"
              style={{ color: T.inkSoft }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 flex items-center justify-center gap-1.5">
        <Eye size={11} style={{ color: T.inkFaint }} />
        <p className="text-[10px]" style={{ color: T.inkFaint }}>
          Real-time availability · No hidden fees
        </p>
      </div>
    </div>
  );
}

/* CONNECT CARD */
export function ConnectCard() {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-md"
      style={{ background: T.canvas }}
    >
      <div
        className="px-4 py-3.5 flex items-center gap-2"
        style={{ borderBottom: `1px solid ${T.line}` }}
      >
        <div
          className="w-0.5 h-4 rounded-full"
          style={{ background: T.goldMid }}
        />
        <h3 className="text-xs font-bold" style={{ color: T.ink }}>
          Find on Social
        </h3>
      </div>
      <div className="p-3 space-y-2">
        {[
          {
            icon: Camera,
            label: "Instagram",
            sub: "@stylist.handle",
            color: "#E1306C",
            bg: "#FFF0F5",
          },
          {
            icon: Globe,
            label: "Website",
            sub: "www.mystylist.com",
            color: T.navy,
            bg: T.navyGhost,
          },
        ].map(({ icon: SIcon, label, sub, color, bg }) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200"
            style={{ background: T.raised }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = bg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = T.raised;
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: bg }}
            >
              <SIcon size={15} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: T.ink }}>
                {label}
              </p>
              <p className="text-[10px] truncate" style={{ color: T.inkFaint }}>
                {sub}
              </p>
            </div>
            <ExternalLink size={12} style={{ color: T.inkFaint }} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default {};
