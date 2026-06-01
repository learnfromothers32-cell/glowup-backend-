// src/pages/consumer/StylistDetail.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useStylistDetail } from "../../hooks/useStylistDetail";
import BookingModal from "../../features/consumer/components/BookingModal";
import { useGamification } from "../../hooks/useGamification";
import {
  Star,
  Check,
  MapPin,
  Heart,
  Share2,
  ArrowLeft,
  Clock,
  CheckCircle,
  X,
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
  Wifi,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════ */
const T = {
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

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type TabKey =
  | "about"
  | "portfolio"
  | "services"
  | "reviews"
  | "transformations";

interface Review {
  user: string;
  rating: number;
  comment: string;
  date: string;
}
interface BeforeAfter {
  before: string;
  after: string;
  caption?: string;
}

interface ExtendedStylist extends Stylist {
  portfolioImages?: string[];
  beforeAfter?: BeforeAfter[];
  bio?: string;
  reviews: Review[];
  isVerified?: boolean;
}
interface ServiceItem {
  name: string;
  price: string;
  duration: string;
  category?: string;
  popular?: boolean;
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function safeServices(services: Stylist["services"]): ServiceItem[] {
  if (!services) return [];
  return services.map((s) =>
    typeof s === "string"
      ? { name: s, price: "", duration: "" }
      : (s as ServiceItem),
  );
}
function parsePrice(p: string) {
  return parseFloat(p.replace(/[^0-9.]/g, "")) || 0;
}
function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
function getLocationString(loc: any): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object" && "area" in loc) return loc.area;
  return String(loc);
}

/* ═══════════════════════════════════════════════════════════
   STAR RATING
═══════════════════════════════════════════════════════════ */
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
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

/* ═══════════════════════════════════════════════════════════
   PILL BADGE
═══════════════════════════════════════════════════════════ */
type BadgeVariant = "navy" | "gold" | "green" | "muted";
function PillBadge({
  icon: Icon,
  label,
  variant = "muted",
}: {
  icon: React.ElementType;
  label: string;
  variant?: BadgeVariant;
}) {
  const v: Record<BadgeVariant, { bg: string; color: string }> = {
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

/* ═══════════════════════════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════════════════════════ */
function Lightbox({
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
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(4, 8, 20, 0.96)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all"
        style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
      >
        <X size={17} />
      </button>
      <div
        className="relative w-full max-w-5xl mx-auto px-4 sm:px-14"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.img
          key={index}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          src={images[index]}
          alt=""
          className="w-full max-h-[80vh] object-contain rounded-2xl"
        />
        {images.length > 1 && (
          <>
            {[
              {
                pos: "left-0",
                fn: () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1)),
                Icon: ChevronLeft,
              },
              {
                pos: "right-0",
                fn: () => setIndex((i) => (i + 1) % images.length),
                Icon: ChevronRight,
              },
            ].map(({ pos, fn, Icon }) => (
              <button
                key={pos}
                onClick={fn}
                className={`absolute ${pos} top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all`}
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <Icon size={17} />
              </button>
            ))}
          </>
        )}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span
          className="text-xs tabular-nums"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {index + 1} / {images.length}
        </span>
        <div className="flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="h-0.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 20 : 5,
                background: i === index ? T.goldMid : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HORIZONTAL SCROLL
═══════════════════════════════════════════════════════════ */
function HScroll({
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

/* ═══════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════ */
function EmptyState({
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

/* ═══════════════════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════════════════ */
function SectionHeader({
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

/* ═══════════════════════════════════════════════════════════
   PORTFOLIO TAB
═══════════════════════════════════════════════════════════ */
function PortfolioTab({
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

/* ═══════════════════════════════════════════════════════════
   SERVICES TAB
═══════════════════════════════════════════════════════════ */
function ServicesTab({
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
                <div className="p-4 flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: T.goldGhost }}
                  >
                    <Scissors size={17} style={{ color: T.goldMid }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: T.ink }}
                      >
                        {svc.name}
                      </span>
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
                  <div className="flex items-center gap-3 shrink-0">
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
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 flex items-center gap-1"
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

/* ═══════════════════════════════════════════════════════════
   REVIEWS TAB
═══════════════════════════════════════════════════════════ */
function ReviewsTab({ stylist }: { stylist: ExtendedStylist }) {
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
                        className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                        style={{ background: T.muted, color: T.inkFaint }}
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

/* ═══════════════════════════════════════════════════════════
   TRANSFORMATIONS TAB
═══════════════════════════════════════════════════════════ */
function TransformationsTab({ items }: { items: BeforeAfter[] }) {
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
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-2xl overflow-hidden shadow-card"
          style={{ background: T.canvas }}
        >
          {/* Before/After slider simplified */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={item.after}
              alt="After"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              {item.caption && (
                <p className="text-white text-xs font-semibold">
                  {item.caption}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════════ */
function Skeleton() {
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

/* ═══════════════════════════════════════════════════════════
   BOOKING CARD
═══════════════════════════════════════════════════════════ */
function BookingCard({
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
        <div className="flex items-start justify-between">
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
          <div className="flex flex-col items-end gap-1.5 mt-0.5">
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: T.greenLight, color: T.green }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: T.greenMid }}
              />{" "}
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
          <Calendar size={15} /> Book an Appointment{" "}
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
        <Wifi size={11} style={{ color: T.inkFaint }} />
        <p className="text-[10px]" style={{ color: T.inkFaint }}>
          Real-time availability · No hidden fees
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONNECT CARD
═══════════════════════════════════════════════════════════ */
function ConnectCard() {
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

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function StylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addPoints, incrementAction } = useGamification();

  const { stylist, loading } = useStylistDetail(id);
  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    service: ServiceItem | null;
  }>({ open: false, service: null });
  const [toast, setToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addPoints(5);
      incrementAction("shares");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  }, [addPoints, incrementAction]);

  const handleBook = useCallback(
    (svc?: ServiceItem) =>
      setBookingModal({ open: true, service: svc || null }),
    [],
  );

  const handleBookingSuccess = useCallback(() => {
    setBookingModal({ open: false, service: null });
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  }, []);

  if (loading) return <Skeleton />;
  if (!stylist)
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-5"
        style={{ background: T.bg }}
      >
        <EmptyState
          icon={Users}
          title="Stylist not found"
          sub="This profile doesn't exist or has been removed."
        />
        <button
          onClick={() => navigate("/app")}
          className="px-7 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all"
          style={{ background: T.navy, color: T.white }}
        >
          Browse Stylists
        </button>
      </div>
    );

  const services = safeServices(stylist.services);
  const prices = services.map((s) => parsePrice(s.price)).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;

  const tabs: {
    key: TabKey;
    label: string;
    icon: React.ElementType;
    count?: number;
  }[] = [
    { key: "about", label: "Overview", icon: Award },
    {
      key: "portfolio",
      label: "Portfolio",
      icon: ImageIcon,
      count: stylist.portfolioImages?.length,
    },
    {
      key: "services",
      label: "Services",
      icon: Scissors,
      count: services.length,
    },
    {
      key: "reviews",
      label: "Reviews",
      icon: Star,
      count: stylist.reviews?.length,
    },
    {
      key: "transformations",
      label: "Transformations",
      icon: Sparkles,
      count: stylist.beforeAfter?.length,
    },
  ];

  const goTo = (key: TabKey) => {
    setActiveTab(key);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: T.bg, fontFamily: FONT_SANS }}
    >
      {/* HERO */}
      <div
        className="relative overflow-hidden"
        style={{ height: "clamp(360px, 58vh, 580px)" }}
      >
        {stylist.image ? (
          <img
            src={stylist.image}
            alt={stylist.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg,${T.navy},${T.navyLight})`,
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom,rgba(11,20,40,.28) 0%,rgba(11,20,40,.12) 38%,rgba(11,20,40,.72) 78%,rgba(11,20,40,.94) 100%)",
          }}
        />

        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all"
            style={{
              background: "rgba(255,255,255,0.11)",
              backdropFilter: "blur(18px)",
              color: T.white,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                background: "rgba(255,255,255,0.11)",
                backdropFilter: "blur(18px)",
                color: T.white,
              }}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="c"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={14} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="s"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Share2 size={14} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={() => {
                setSaved((v) => !v);
                if (!saved) {
                  addPoints(2);
                  incrementAction("bookmarks");
                }
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: saved ? T.red : "rgba(255,255,255,0.11)",
                backdropFilter: "blur(18px)",
                color: T.white,
              }}
            >
              <Heart size={14} fill={saved ? "currentColor" : "none"} />
            </button>
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                background: "rgba(255,255,255,0.11)",
                backdropFilter: "blur(18px)",
                color: T.white,
              }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-7">
          <div className="max-w-7xl mx-auto">
            {stylist.isLive && (
              <div className="mb-2.5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: T.greenMid, color: T.white }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{" "}
                  Live Now
                </span>
              </div>
            )}
            <div className="flex items-center gap-2.5 mb-2.5">
              <h1
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white tracking-tight drop-shadow-xl"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {stylist.name}
              </h1>
              {stylist.isVerified && (
                <BadgeCheck
                  size={24}
                  style={{ color: T.goldMid }}
                  className="shrink-0"
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  content: (
                    <>
                      <MapPin size={10} /> {getLocationString(stylist.location)}
                    </>
                  ),
                  key: "loc",
                },
                {
                  content: (
                    <>
                      <StarRating
                        rating={Math.round(stylist.rating)}
                        size={10}
                      />
                      <span className="font-bold ml-1">{stylist.rating}</span>
                      <span
                        style={{ color: "rgba(255,255,255,0.55)" }}
                        className="ml-1"
                      >
                        ({stylist.reviews.length})
                      </span>
                    </>
                  ),
                  key: "rating",
                },
              ].map(({ content, key }) => (
                <span
                  key={key}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.11)",
                    backdropFilter: "blur(12px)",
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {content}
                </span>
              ))}
              {stylist.isVerified && (
                <span
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium"
                  style={{
                    background: `${T.goldMid}20`,
                    backdropFilter: "blur(12px)",
                    color: T.goldMid,
                  }}
                >
                  <Shield size={10} /> Verified Professional
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY TABS */}
      <div
        className="sticky top-0 z-40"
        style={{
          background: `${T.canvas}F4`,
          backdropFilter: "blur(22px)",
          boxShadow: "0 1px 10px rgba(15,31,61,0.05)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex items-center gap-0.5 overflow-x-auto py-1"
            style={{ scrollbarWidth: "none" }}
          >
            {tabs.map(({ key, label, icon: Icon, count }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => goTo(key)}
                  className="relative flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200"
                  style={{
                    color: active ? T.navy : T.inkFaint,
                    background: active ? T.goldGhost : "transparent",
                  }}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                  {!!count && count > 0 && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: active ? T.goldMid : T.muted,
                        color: active ? T.white : T.inkFaint,
                      }}
                    >
                      {count}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="tabInd"
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: T.goldMid }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 36,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-36"
        ref={contentRef}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_368px] gap-7 items-start">
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
              >
                {activeTab === "about" && (
                  <div className="space-y-7">
                    <div className="flex flex-wrap gap-2">
                      <PillBadge
                        icon={Shield}
                        label="Verified Professional"
                        variant="navy"
                      />
                      <PillBadge
                        icon={Award}
                        label="Top Rated"
                        variant="gold"
                      />
                      <PillBadge
                        icon={Zap}
                        label="Quick Response"
                        variant="muted"
                      />
                      <PillBadge
                        icon={TrendingUp}
                        label="High Demand"
                        variant="green"
                      />
                    </div>
                    {stylist.bio && (
                      <div
                        className="rounded-2xl overflow-hidden shadow-card"
                        style={{ background: T.canvas }}
                      >
                        <div
                          className="px-5 sm:px-6 py-4 flex items-center gap-2.5"
                          style={{ borderBottom: `1px solid ${T.line}` }}
                        >
                          <div
                            className="w-0.5 h-5 rounded-full"
                            style={{ background: T.goldMid }}
                          />
                          <h2
                            className="text-sm font-bold"
                            style={{ color: T.ink, fontFamily: FONT_DISPLAY }}
                          >
                            About
                          </h2>
                        </div>
                        <div className="px-5 sm:px-6 py-5">
                          <p
                            className="text-sm leading-[1.8]"
                            style={{ color: T.inkSoft }}
                          >
                            {stylist.bio}
                          </p>
                        </div>
                      </div>
                    )}
                    {services.length > 0 && (
                      <div>
                        <SectionHeader
                          title="Featured Services"
                          subtitle={`${services.length} services available`}
                          action={
                            <button
                              className="text-xs font-semibold flex items-center gap-1 transition-all hover:gap-1.5"
                              style={{ color: T.goldMid }}
                              onClick={() => goTo("services")}
                            >
                              View all <ArrowRight size={13} />
                            </button>
                          }
                        />
                        <HScroll>
                          {services.slice(0, 6).map((svc, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 14 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="snap-start shrink-0 w-[200px] sm:w-[220px] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                              style={{
                                background: T.canvas,
                                boxShadow: T.shadowSm,
                              }}
                              onClick={() => goTo("services")}
                            >
                              {svc.popular && (
                                <div
                                  className="h-0.5"
                                  style={{
                                    background: `linear-gradient(to right,${T.goldMid},${T.navy})`,
                                  }}
                                />
                              )}
                              <div className="p-4">
                                <div
                                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3.5"
                                  style={{ background: T.goldGhost }}
                                >
                                  <Scissors
                                    size={15}
                                    style={{ color: T.goldMid }}
                                  />
                                </div>
                                <p
                                  className="text-xs font-bold mb-1 truncate"
                                  style={{ color: T.ink }}
                                >
                                  {svc.name}
                                </p>
                                {svc.duration && (
                                  <p
                                    className="text-[11px] flex items-center gap-1 mb-3.5"
                                    style={{ color: T.inkFaint }}
                                  >
                                    <Clock size={9} /> {svc.duration}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-3">
                                  <span
                                    className="text-base font-bold tabular-nums"
                                    style={{
                                      color: T.ink,
                                      fontFamily: FONT_DISPLAY,
                                    }}
                                  >
                                    {svc.price || "—"}
                                  </span>
                                  <span
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                                    style={{
                                      background: T.navy,
                                      color: T.white,
                                    }}
                                  >
                                    Book
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </HScroll>
                      </div>
                    )}
                    {stylist.reviews.length > 0 && (
                      <div>
                        <SectionHeader
                          title="Client Reviews"
                          subtitle={`${stylist.reviews.length} verified reviews`}
                          action={
                            <button
                              className="text-xs font-semibold flex items-center gap-1 transition-all hover:gap-1.5"
                              style={{ color: T.goldMid }}
                              onClick={() => goTo("reviews")}
                            >
                              See all <ArrowRight size={13} />
                            </button>
                          }
                        />
                        <HScroll>
                          {stylist.reviews.slice(0, 5).map((rev, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 14 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="snap-start shrink-0 w-[260px] sm:w-[280px] rounded-2xl p-4"
                              style={{
                                background: T.canvas,
                                boxShadow: T.shadowSm,
                              }}
                            >
                              <div className="flex items-center gap-2.5 mb-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{
                                    background: `linear-gradient(135deg,${T.navy},${T.navyLight})`,
                                    color: T.white,
                                  }}
                                >
                                  {rev.user[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-xs font-bold truncate"
                                    style={{ color: T.ink }}
                                  >
                                    {rev.user}
                                  </p>
                                  <StarRating rating={rev.rating} size={10} />
                                </div>
                                <span
                                  className="text-[9px] shrink-0"
                                  style={{ color: T.inkFaint }}
                                >
                                  {rev.date}
                                </span>
                              </div>
                              <p
                                className="text-xs leading-relaxed line-clamp-3"
                                style={{ color: T.inkSoft }}
                              >
                                {rev.comment}
                              </p>
                            </motion.div>
                          ))}
                        </HScroll>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "portfolio" && (
                  <PortfolioTab
                    images={stylist.portfolioImages || []}
                    onOpen={(i) => setLightbox({ open: true, index: i })}
                  />
                )}
                {activeTab === "services" && (
                  <ServicesTab
                    services={services}
                    onBook={handleBook}
                    stylistId={id!}
                  />
                )}
                {activeTab === "reviews" && <ReviewsTab stylist={stylist} />}
                {activeTab === "transformations" && (
                  <TransformationsTab items={stylist.beforeAfter || []} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="lg:sticky lg:top-[60px] space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
            >
              <BookingCard
                stylist={stylist}
                services={services}
                minPrice={minPrice}
                onBook={handleBook}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <ConnectCard />
            </motion.div>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM BAR */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{
            background: `${T.canvas}F6`,
            backdropFilter: "blur(22px)",
            boxShadow: "0 -4px 20px rgba(15,31,61,0.09)",
          }}
        >
          <div className="flex-1">
            <p
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: T.inkFaint }}
            >
              From
            </p>
            <p
              className="text-xl font-bold tabular-nums leading-tight"
              style={{ color: T.ink, fontFamily: FONT_DISPLAY }}
            >
              {minPrice > 0 ? `GH₵ ${minPrice}` : "Contact"}
            </p>
          </div>
          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
            style={{ background: T.raised, color: T.inkSoft }}
          >
            <Share2 size={17} />
          </button>
          <button
            onClick={() => handleBook()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg,${T.navy},${T.navyLight})`,
              color: T.white,
              boxShadow: "0 4px 16px rgba(15,31,61,0.28)",
            }}
          >
            <Calendar size={14} /> Book Now
          </button>
        </div>
      </div>

      <AnimatePresence>
        {lightbox.open && stylist.portfolioImages && (
          <Lightbox
            key="lb"
            images={stylist.portfolioImages}
            initialIndex={lightbox.index}
            onClose={() => setLightbox({ open: false, index: 0 })}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {bookingModal.open && (
          <BookingModal
            key="bm"
            stylist={stylist}
            preSelectedService={
              bookingModal.service
                ? {
                    name: bookingModal.service.name,
                    price: bookingModal.service.price,
                  }
                : null
            }
            onClose={() => setBookingModal({ open: false, service: null })}
            onSuccess={handleBookingSuccess}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-28 lg:bottom-8 left-1/2 z-[400] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl pointer-events-none"
            style={{ background: T.navy, color: T.white }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: T.greenMid }}
            >
              <Check size={13} color="#fff" />
            </div>
            <div>
              <p className="text-sm font-bold">Booking Confirmed</p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                You'll receive a confirmation shortly
              </p>
            </div>
          </motion.div>
        )}
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-28 lg:bottom-8 left-1/2 z-[400] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl pointer-events-none"
            style={{ background: T.navy, color: T.white }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: T.goldMid }}
            >
              <Check size={12} color="#fff" />
            </div>
            <p className="text-xs font-bold">Link copied to clipboard</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
