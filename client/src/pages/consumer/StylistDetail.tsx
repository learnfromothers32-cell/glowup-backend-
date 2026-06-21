// src/pages/consumer/StylistDetail.tsx
import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useStylistDetail } from "../../hooks/useStylistDetail";
import { useFollow } from "../../context/FollowContext";
import BookingModal from "../../features/consumer/components/BookingModal";
import { useGamification } from "../../hooks/useGamification";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import { createConversation, getMyConversations } from "../../api/conversations";
import { logger } from "../../utils/logger";
import { joinWaitlist } from "../../api/waitlist";
import { getStylistProducts } from "../../api/products";
import { getStylistPackages } from "../../api/packages";
import { purchasePackage } from "../../api/packages";
import { subscribeToTier, getStylistTiers } from "../../api/memberships";
import type { Stylist } from "@/domain/stylist/stylist.types";
import type { BeforeAfter } from "../../features/stylist/components/StylistDetailParts";
import {
  Star,
  Check,
  MapPin,
  Eye,
  Heart,
  Share2,
  ArrowLeft,
  Clock,
  X,
  ChevronRight,
  Award,
  Zap,
  Calendar,
  ArrowRight,
  MessageSquare,
  BadgeCheck,
  Users,
  ChevronLeft,
  Scissors,
  ImageIcon,
  Phone,
  Camera,
  Shield,
  TrendingUp,
  Globe,
  AtSign,
  MoreHorizontal,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Gift,
  Crown,
  ThumbsUp,
  Lock,
  RefreshCw,
  Wifi,
  Music,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Skeleton } from "../../components/ui/Skeleton";
import { FollowButton } from "../../components/ui/FollowButton";
import { API_SERVER_URL } from "../../api/axios";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS (dark-mode aware via context)
═══════════════════════════════════════════════════════════ */
interface Tokens {
  navy: string; navyMid: string; navyLight: string; navyGhost: string;
  gold: string; goldMid: string; goldLight: string; goldGhost: string;
  bg: string; canvas: string; raised: string; muted: string;
  line: string; lineMid: string;
  ink: string; inkMid: string; inkSoft: string; inkFaint: string; white: string;
  green: string; greenLight: string; greenMid: string; red: string; redLight: string;
  shadowXs: string; shadowSm: string; shadowMd: string;
  shadowLg: string; shadowXl: string; shadowCard: string;
}
const lightTokens: Tokens = {
  navy: "#0B1A33", navyMid: "#1A2F54", navyLight: "#253D6A", navyGhost: "#EDF2FF",
  gold: "#B8862A", goldMid: "#D4A047", goldLight: "#F9F1E2", goldGhost: "#FDF8F0",
  bg: "#F4F7FC", canvas: "#FFFFFF", raised: "#F8FAFD", muted: "#EEF2F8",
  line: "#E9EEF5", lineMid: "#DCE3EE",
  ink: "#0A1424", inkMid: "#364A6B", inkSoft: "#5A6E8A", inkFaint: "#8E9FB2", white: "#FFFFFF",
  green: "#059669", greenLight: "#ECFDF5", greenMid: "#10B981", red: "#DC2626", redLight: "#FEF2F2",
  shadowXs: "0 1px 2px rgba(10,20,40,0.04)",
  shadowSm: "0 2px 8px rgba(10,20,40,0.06)",
  shadowMd: "0 6px 18px rgba(10,20,40,0.07)",
  shadowLg: "0 12px 32px rgba(10,20,40,0.08)",
  shadowXl: "0 24px 48px rgba(10,20,40,0.10)",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};
const darkTokens: Tokens = {
  navy: "#1a2a4a", navyMid: "#2a3f64", navyLight: "#3a4d7a", navyGhost: "#1a2540",
  gold: "#D4A76A", goldMid: "#E0B860", goldLight: "#2a2215", goldGhost: "#2a1d14",
  bg: "#09090b", canvas: "#18181b", raised: "#1a1a1e", muted: "#222226",
  line: "#27272a", lineMid: "#3f3f46",
  ink: "#f5f0ea", inkMid: "#d4ccc4", inkSoft: "#a8a098", inkFaint: "#8a7f72", white: "#09090b",
  green: "#22c55e", greenLight: "#0f2a18", greenMid: "#4ade80", red: "#ef4444", redLight: "#2a1114",
  shadowXs: "0 1px 2px rgba(0,0,0,0.3)",
  shadowSm: "0 2px 8px rgba(0,0,0,0.35)",
  shadowMd: "0 6px 18px rgba(0,0,0,0.4)",
  shadowLg: "0 12px 32px rgba(0,0,0,0.45)",
  shadowXl: "0 24px 48px rgba(0,0,0,0.5)",
  shadowCard: "0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.3)",
};

const TokenContext = createContext<Tokens>(lightTokens);
function useT() {
  return useContext(TokenContext);
}

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
  | "products"
  | "packages"
  | "memberships";

interface Review {
  user: string;
  rating: number;
  comment: string;
  date: string;
}
interface ExtendedStylist extends Omit<Stylist, 'bio'> {
  portfolioImages?: string[];
  beforeAfter?: BeforeAfter[];
  bio?: string;
  reviews: Review[];
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
  return services.map((s: NonNullable<Stylist["services"]>[0]) =>
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
const formatCount = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : n ? String(n) : "0";
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
  const T = useT();
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
  const T = useT();
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
  const T = useT();
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
  const T = useT();
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
  const T = useT();
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
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
}) {
  const T = useT();
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
      <div className="flex items-center gap-2">
        {Icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: T.goldGhost }}
          >
            <Icon size={15} style={{ color: T.goldMid }} />
          </div>
        )}
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
      </div>
      {action}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PORTFOLIO TAB
═══════════════════════════════════════════════════════════ */
const imgSrc = (item: string | { url: string; type?: string }) =>
  typeof item === 'string' ? item : (item.url.startsWith('http') ? item.url : `${API_SERVER_URL}${item.url}`);

const transformImgSrc = (url: string) =>
  url.startsWith('http') ? url : `${API_SERVER_URL}${url}`;

/* ─── Video Viewer ─── */
function VideoViewer({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <div
        className="relative flex items-center justify-center w-full h-full sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Close"
        >
          <X size={16} className="sm:size-[18]" />
        </button>
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="w-full h-full sm:max-w-[90vw] sm:max-h-[85vh] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl object-contain bg-black sm:rounded-xl"
        />
      </div>
    </motion.div>
  );
}

function StatItem({ value, label }: { value: number | string; label: string }) {
  const T = useT();
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold" style={{ color: T.ink, fontFamily: FONT_DISPLAY }}>
        {value}
      </span>
      <span className="text-[11px] font-medium" style={{ color: T.inkFaint }}>
        {label}
      </span>
    </div>
  );
}

/* ─── TikTok-Style Portfolio Tab ─── */
function PortfolioTab({
  images,
  beforeAfter,
  onOpenImage,
  onPlayVideo,
  onViewTransform,
}: {
  images: Array<{ url: string; type: 'image' | 'video' }>;
  beforeAfter: BeforeAfter[];
  onOpenImage: (i: number) => void;
  onPlayVideo: (url: string) => void;
  onViewTransform: (i: number) => void;
}) {
  const T = useT();
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<'posts' | 'transforms'>('posts');

  const hasPosts = images?.length > 0;
  const hasTransforms = beforeAfter?.length > 0;

  if (!hasPosts && !hasTransforms) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="Portfolio coming soon"
        sub="Check back to see this stylist's work"
      />
    );
  }

  return (
    <div>
      {/* Stats bar */}
      <div
        className="flex items-center justify-around py-4 px-2 mb-5 rounded-2xl"
        style={{ background: T.canvas, boxShadow: T.shadowSm }}
      >
        <StatItem value={images.length} label="Posts" />
        <StatItem value={beforeAfter.length} label="Transforms" />
        <StatItem value={formatCount(beforeAfter.reduce((s, i) => s + ((i as any).views || 0), 0))} label="Views" />
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center justify-center gap-6 mb-4 border-b" style={{ borderColor: T.line }}>
        {[
          { key: 'posts' as const, label: 'Posts', active: true },
          { key: 'transforms' as const, label: 'Transforms', active: hasTransforms },
        ].filter(t => t.active).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className="relative pb-2.5 text-xs font-semibold tracking-wide transition-colors"
            style={{ color: subTab === key ? T.ink : T.inkFaint }}
          >
            {label}
            <span className="ml-1 text-[10px]" style={{ color: T.inkFaint }}>
              ({key === 'posts' ? images.length : beforeAfter.length})
            </span>
            {subTab === key && (
              <motion.div
                layoutId="portfolioSub"
                className="absolute bottom-0 inset-x-0 h-0.5 rounded-full"
                style={{ background: T.goldMid }}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content grid (TikTok 3-column) */}
      {subTab === 'posts' ? (
        <div className="grid grid-cols-3 gap-1">
          {images.map((item, i) => {
            const imgIndex = images.filter(x => x.type === 'image').length > 0
              ? images.slice(0, i).filter(x => x.type === 'image').length
              : i;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => item.type === 'video' ? onPlayVideo(imgSrc(item)) : onOpenImage(imgIndex)}
                className="group relative aspect-square overflow-hidden cursor-pointer"
                style={{ background: T.muted }}
              >
                {item.type === 'video' ? (
                  <>
                    <video src={imgSrc(item)} className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm shadow-lg ring-1 ring-white/20">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20" /></svg>
                      </div>
                    </div>
                    <div className="absolute top-1.5 left-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-white bg-black/60 backdrop-blur-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                        Video
                      </span>
                    </div>
                  </>
                ) : (
                  <img src={imgSrc(item)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {beforeAfter.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onViewTransform(i)}
              className="group relative aspect-square overflow-hidden cursor-pointer"
              style={{ background: T.muted }}
            >
              {item.mediaType === 'video' ? (
                <>
                  <video
                    src={transformImgSrc(item.after)}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm shadow-lg ring-1 ring-white/20">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20" /></svg>
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={transformImgSrc(item.after)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
                <Eye size={9} className="text-white" />
                <span className="text-[10px] font-semibold text-white">{(item as any).views ?? 0}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
      {subTab === 'transforms' && (
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/app/trending')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: T.goldMid, color: '#fff' }}
          >
            <TrendingUp size={14} />
            View trending transformations
          </button>
        </div>
      )}
    </div>
  );
}

function TransformDetail({
  items,
  initialIndex,
  onClose,
}: {
  items: BeforeAfter[];
  initialIndex: number;
  onClose: () => void;
}) {
  const T = useT();
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex(i => (i > 0 ? i - 1 : items.length - 1));
      if (e.key === "ArrowRight") setIndex(i => (i < items.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [items.length, onClose]);

  const item = items[index];
  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <div
        className="relative flex items-center justify-center w-full h-full sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Close"
        >
          <X size={16} className="sm:size-[18]" />
        </button>

        {item.mediaType === 'video' ? (
          <video
            src={transformImgSrc(item.after)}
            controls
            autoPlay
            playsInline
            className="w-full h-full sm:max-w-[90vw] sm:max-h-[85vh] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl object-contain bg-black sm:rounded-xl"
          />
        ) : (
          <img
            src={transformImgSrc(item.after)}
            alt=""
            className="w-full h-full sm:max-w-[90vw] sm:max-h-[85vh] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl object-contain bg-black sm:rounded-xl"
          />
        )}
      </div>

      {item.caption && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center px-4 pointer-events-none">
          <p className="text-sm font-medium text-white/80">{item.caption}</p>
          {item.service && (
            <p className="text-xs mt-1 text-white/50">{item.service}</p>
          )}
        </div>
      )}

      {items.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={() => setIndex(i => i - 1)}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 z-10"
              aria-label="Previous"
            >
              <ChevronLeft size={17} />
            </button>
          )}
          {index < items.length - 1 && (
            <button
              onClick={() => setIndex(i => i + 1)}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 z-10"
              aria-label="Next"
            >
              <ChevronRight size={17} />
            </button>
          )}
        </>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <span className="text-xs tabular-nums text-white/40">
            {index + 1} / {items.length}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SERVICES TAB
═══════════════════════════════════════════════════════════ */
function ServicesTab({
  services,
  onBook,
}: {
  services: ServiceItem[];
  onBook: (s: ServiceItem) => void;
  stylistId: string;
}) {
  const T = useT();
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
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onBook(svc);
                      }}
                      style={{ background: T.navy, color: T.white }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = T.goldMid)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = T.navy)
                      }
                    >
                      Book <ArrowRight size={10} />
                    </Button>
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
  const T = useT();
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
                   <Avatar name={rev.user} size="sm" />
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

function StylistSkeleton() {
  const T = useT();
  return (
    <div className="min-h-screen" style={{ background: T.bg }}>
      <Skeleton className="h-64 sm:h-[520px] rounded-none" style={{ background: T.muted }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-28 rounded-2xl" style={{ background: T.muted }} />
          ))}
        </div>
        <Skeleton className="h-[520px] rounded-2xl" style={{ background: T.muted }} />
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
  onMessage,
  onCall,
  onJoinWaitlist,
  onFollow,
  joiningWaitlist = false,
  waitlistJoined = false,
}: {
  stylist: ExtendedStylist;
  services: ServiceItem[];
  minPrice: number;
  onBook: (svc?: ServiceItem) => void;
  onMessage?: () => void;
  onCall?: () => void;
  onJoinWaitlist?: () => void;
  onFollow?: (stylistId: string, following: boolean) => void;
  joiningWaitlist?: boolean;
  waitlistJoined?: boolean;
}) {
  const T = useT();
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
          <div className="flex items-center gap-1.5 flex-wrap">
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
            <FollowButton
              stylistId={stylist.id}
              isFollowing={stylist.isFollowing ?? false}
              onFollowChange={onFollow ?? (() => {})}
            />
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
              onClick: onMessage,
              hoverBg: T.navyGhost,
              hoverColor: T.navy,
            },
            {
              icon: Phone,
              label: "Call",
              onClick: onCall,
              hoverBg: T.goldGhost,
              hoverColor: T.gold,
            },
          ].map(({ icon: Icon, label, onClick, hoverBg, hoverColor }) => (
            <button
              key={label}
              onClick={onClick}
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
        <button
          onClick={onJoinWaitlist}
          disabled={joiningWaitlist}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
          style={{
            background: waitlistJoined ? T.greenLight : T.goldGhost,
            color: waitlistJoined ? T.green : T.gold,
          }}
        >
          {joiningWaitlist ? (
            <Loader2 size={13} className="animate-spin" />
          ) : waitlistJoined ? (
            <Check size={13} />
          ) : null}
          {waitlistJoined ? 'Joined waitlist!' : 'Join Waitlist'}
        </button>
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
function ConnectCard({ stylist }: { stylist?: any }) {
  const T = useT();
  const socialLinks = [
    stylist?.instagram && {
      icon: Camera,
      label: "Instagram",
      sub: `@${stylist.instagram}`,
      url: `https://instagram.com/${stylist.instagram}`,
      color: "#E1306C",
      bg: "#FFF0F5",
    },
    stylist?.twitter && {
      icon: AtSign,
      label: "Twitter / X",
      sub: `@${stylist.twitter}`,
      url: `https://x.com/${stylist.twitter}`,
      color: "#1DA1F2",
      bg: "#F0F7FF",
    },
    stylist?.tiktok && {
      icon: Music,
      label: "TikTok",
      sub: `@${stylist.tiktok}`,
      url: `https://tiktok.com/@${stylist.tiktok}`,
      color: "#000000",
      bg: "#F5F5F5",
    },
    stylist?.website && {
      icon: Globe,
      label: "Website",
      sub: stylist.website,
      url: stylist.website.startsWith('http') ? stylist.website : `https://${stylist.website}`,
      color: T.navy,
      bg: T.navyGhost,
    },
  ].filter(Boolean) as { icon: any; label: string; sub: string; url: string; color: string; bg: string }[];

  if (socialLinks.length === 0) return null;

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
        {socialLinks.map(({ icon: SIcon, label, sub, url, color, bg }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 no-underline"
            style={{ background: T.raised, display: 'flex' }}
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
          </a>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function StylistDetail() {
  const { resolved } = useTheme();
  const T = useMemo(() => resolved === "dark" ? darkTokens : lightTokens, [resolved]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addPoints, incrementAction } = useGamification();
  const { addToRecentlyViewed } = useRecentlyViewed();

  const { stylist, setStylist, loading } = useStylistDetail(id);
  const followCtx = useFollow();
  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [transformViewer, setTransformViewer] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    service: ServiceItem | null;
  }>({ open: false, service: null });
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [buyingPackage, setBuyingPackage] = useState<string | null>(null);
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stylist?.id) return;
    getStylistProducts(stylist.id).then(setProducts).catch(() => {});
    getStylistPackages(stylist.id).then(setPackages).catch(() => {});
    getStylistTiers(stylist.id).then(setTiers).catch(() => {});
  }, [stylist?.id]);

  useEffect(() => {
    if (!stylist) return;
    addToRecentlyViewed(stylist);
  }, [stylist, addToRecentlyViewed]);

  useEffect(() => {
    if (!stylist?.id) return;
    setSaved(followCtx.isFollowing(stylist.id));
  }, [stylist?.id, followCtx]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addPoints(5);
      incrementAction("shares");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      logger.error(e);
    }
  }, [addPoints, incrementAction]);

  const handleFollow = useCallback(
    async (stylistId: string, following: boolean) => {
      setStylist((prev: any) =>
        prev && prev.id === stylistId
          ? {
              ...prev,
              isFollowing: following,
              followerCount: Math.max(0, (prev.followerCount ?? 0) + (following ? 1 : -1)),
            }
          : prev,
      );
      if (following) {
        await followCtx.follow(stylistId);
      } else {
        await followCtx.unfollow(stylistId);
      }
    },
    [followCtx, setStylist],
  );

  const handleBook = useCallback(
    (svc?: ServiceItem) =>
      setBookingModal({ open: true, service: svc || null }),
    [],
  );

  const handleMessage = useCallback(async () => {
    if (!stylist?.id) return;
    try {
      const conv = await createConversation({ stylistId: stylist.id });
      navigate("/app/messages", { state: { conversationId: conv._id } });
    } catch {
      try {
        const convs = await getMyConversations();
        const existing = convs.find((c: any) => c.stylistId?._id === stylist.id);
        if (existing) {
          navigate("/app/messages", { state: { conversationId: existing._id } });
        } else {
          navigate("/app/messages");
        }
      } catch {
        navigate("/app/messages");
      }
    }
  }, [stylist?.id, navigate]);

  const handleCall = useCallback(() => {
    if (!stylist?.phone) {
      setToastMsg('No phone number available for this stylist');
      setToast(true);
      setTimeout(() => setToast(false), 3000);
      return;
    }
    window.open(`tel:${stylist.phone}`);
  }, [stylist?.phone]);

  const handleJoinWaitlist = useCallback(async () => {
    if (!stylist?.id || joiningWaitlist) return;
    setJoiningWaitlist(true);
    try {
      await joinWaitlist({
        stylistId: stylist.id,
        serviceId: '',
        preferredDate: new Date().toISOString(),
      });
      setWaitlistJoined(true);
      setTimeout(() => setWaitlistJoined(false), 3000);
    } catch { /* ignore */ }
    setJoiningWaitlist(false);
  }, [stylist?.id, joiningWaitlist]);

  const handleBuyPackage = useCallback(async (packageId: string) => {
    setBuyingPackage(packageId);
    try {
      await purchasePackage(packageId);
      setToastMsg('Package purchased!');
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (e: any) {
      setToastMsg(e?.response?.data?.message || 'Purchase failed');
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    }
    setBuyingPackage(null);
  }, []);

  const handleSubscribe = useCallback(async (tierId: string) => {
    setSubscribingTier(tierId);
    try {
      await subscribeToTier(tierId);
      setToastMsg('Subscribed!');
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (e: any) {
      setToastMsg(e?.response?.data?.message || 'Subscription failed');
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    }
    setSubscribingTier(null);
  }, []);

  const handleBookingSuccess = useCallback(() => {
    setBookingModal({ open: false, service: null });
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  }, []);

  if (loading) return <StylistSkeleton />;
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
        <Button onClick={() => navigate("/app")} style={{ background: T.navy, color: T.white }}>
          Browse Stylists
        </Button>
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
    { key: "products", label: "Shop", icon: ShoppingBag, count: products.length },
    { key: "packages", label: "Packages", icon: Gift, count: packages.length },
    { key: "memberships", label: "Memberships", icon: Crown, count: tiers.length },
  ];

  const goTo = (key: TabKey) => {
    setActiveTab(key);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <TokenContext.Provider value={T}>
    <div
      className="min-h-screen"
      style={{ background: T.bg, fontFamily: FONT_SANS }}
    >
      {/* HERO */}
      <div
        className="relative overflow-hidden"
        style={{ height: "clamp(360px, 58vh, 580px)" }}
      >
        {/* Mobile image (full bleed) */}
        {stylist.image ? (
          <img
            src={stylist.image}
            alt={stylist.name}
            className="lg:hidden absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="lg:hidden absolute inset-0"
            style={{
              background: `linear-gradient(135deg,${T.navy},${T.navyLight})`,
            }}
          />
        )}
        <div
          className="lg:hidden absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom,rgba(11,20,40,.28) 0%,rgba(11,20,40,.12) 38%,rgba(11,20,40,.72) 78%,rgba(11,20,40,.94) 100%)",
          }}
        />

        {/* Desktop hero background */}
        <div
          className="hidden lg:flex absolute inset-0 flex-col items-center justify-center px-6"
          style={{
            background: `linear-gradient(135deg,${T.navy},${T.navyLight})`,
          }}
        >
          {stylist.image && (
            <>
              <img
                src={stylist.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center opacity-10 blur-3xl"
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg,${T.navy}80,${T.navyLight}80)` }} />
            </>
          )}
          <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-2xl mx-auto">
            {stylist.image ? (
              <div className="w-32 h-32 rounded-full ring-4 ring-white/20 overflow-hidden shadow-2xl">
                <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover object-center" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full ring-4 ring-white/20 flex items-center justify-center text-4xl font-bold" style={{ background: `linear-gradient(135deg,${T.navyLight},${T.navy})`, color: T.white }}>
                {getInitials(stylist.name)}
              </div>
            )}
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: FONT_DISPLAY }}>{stylist.name}</h1>
                {stylist.isVerified && <BadgeCheck size={22} style={{ color: T.goldMid }} />}
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{getLocationString(stylist.location)}</p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{formatCount(stylist.followerCount ?? 0)}</p>
                <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{formatCount(stylist.totalLikes ?? 0)}</p>
                <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Likes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{stylist.reviews.length}</p>
                <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Reviews</p>
              </div>
            </div>
            {stylist.bio && (
              <p className="text-sm leading-relaxed max-w-lg mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>{stylist.bio}</p>
            )}
          </div>
        </div>

        {/* Shared top bar */}
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
              onClick={async () => {
                if (!stylist?.id) return;
                const next = !saved;
                setSaved(next);
                if (next) {
                  addPoints(2);
                  incrementAction("bookmarks");
                  await followCtx.follow(stylist.id);
                } else {
                  await followCtx.unfollow(stylist.id);
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

        {/* Mobile bottom content */}
        <div className="lg:hidden absolute bottom-0 inset-x-0 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-7">
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
                className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-xl"
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
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.11)",
                  backdropFilter: "blur(12px)",
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                <MapPin size={10} /> {getLocationString(stylist.location)}
              </span>
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.11)",
                  backdropFilter: "blur(12px)",
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                <StarRating rating={Math.round(stylist.rating)} size={10} />
                <span className="font-bold ml-1">{stylist.rating}</span>
                <span style={{ color: "rgba(255,255,255,0.55)" }} className="ml-1">
                  ({stylist.reviews.length})
                </span>
              </span>
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.11)",
                  backdropFilter: "blur(12px)",
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                <Users size={10} /> {formatCount(stylist.followerCount ?? 0)} followers
              </span>
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.11)",
                  backdropFilter: "blur(12px)",
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                <Heart size={10} /> {formatCount(stylist.totalLikes ?? 0)} likes
              </span>
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
            {stylist.bio && (
              <p
                className="mt-3 text-xs sm:text-sm leading-relaxed max-w-xl"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {stylist.bio}
              </p>
            )}
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
                            <Button variant="ghost" size="sm" onClick={() => goTo("services")}>
                              View all <ArrowRight size={13} />
                            </Button>
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
                                  <span className="inline-block">
                                    <Button size="sm" className="!text-[10px] !px-2.5 !py-1 !h-auto !min-h-0" style={{ background: T.navy, color: T.white }}>
                                      Book
                                    </Button>
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
                            <Button variant="ghost" size="sm" onClick={() => goTo("reviews")}>
                              See all <ArrowRight size={13} />
                            </Button>
                          }
                        />
                        <HScroll>
                          {stylist.reviews.slice(0, 5).map((rev: Review, i: number) => (
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
                                 <Avatar name={rev.user} size="sm" />
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
                    beforeAfter={stylist.beforeAfter || []}
                    onOpenImage={(i) => setLightbox({ open: true, index: i })}
                    onPlayVideo={(url) => setActiveVideoUrl(url)}
                    onViewTransform={(i) => setTransformViewer({ open: true, index: i })}
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
                {activeTab === "products" && (
                  <div>
                    <SectionHeader icon={ShoppingBag} title="Shop" subtitle="Available products" />
                    {products.length === 0 ? (
                      <p className="text-sm" style={{ color: T.inkFaint }}>No products available</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {products.map((p: any) => (
                          <div key={p._id} className="p-4 rounded-xl" style={{ background: T.canvas, border: `1px solid ${T.line}` }}>
                            <p className="text-sm font-semibold" style={{ color: T.ink }}>{p.name}</p>
                            {p.description && <p className="text-xs mt-1" style={{ color: T.inkFaint }}>{p.description}</p>}
                            <p className="text-sm font-bold mt-2" style={{ color: T.navy }}>GH₵ {p.price}</p>
                            <p className="text-xs" style={{ color: p.stock > 0 ? T.green : T.red }}>{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "packages" && (
                  <div>
                    <SectionHeader icon={Gift} title="Packages" subtitle="Service bundles" />
                    {packages.length === 0 ? (
                      <p className="text-sm" style={{ color: T.inkFaint }}>No packages available</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {packages.map((p: any) => (
                          <div key={p._id} className="p-5 rounded-xl" style={{ background: T.canvas, border: `1px solid ${T.line}` }}>
                            <p className="text-base font-semibold" style={{ color: T.ink }}>{p.name}</p>
                            {p.description && <p className="text-xs mt-1" style={{ color: T.inkFaint }}>{p.description}</p>}
                            <div className="flex items-center gap-2 mt-3">
                              <p className="text-lg font-bold" style={{ color: T.navy }}>GH₵ {p.price}</p>
                              <span className="text-xs" style={{ color: T.inkFaint }}>• {p.totalSessions} sessions</span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: T.inkFaint }}>Expires in {p.expiryDays} days</p>
                            <button
                              onClick={() => handleBuyPackage(p._id)}
                              disabled={buyingPackage === p._id}
                              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                              style={{ background: T.navy, color: T.white }}
                            >
                              {buyingPackage === p._id ? <Loader2 size={13} className="animate-spin" /> : null}
                              {buyingPackage === p._id ? 'Buying...' : 'Buy Package'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "memberships" && (
                  <div>
                    <SectionHeader icon={Crown} title="Memberships" subtitle="Subscription plans" />
                    {tiers.length === 0 ? (
                      <p className="text-sm" style={{ color: T.inkFaint }}>No membership plans available</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tiers.map((t: any) => (
                          <div key={t._id} className="p-5 rounded-xl" style={{ background: T.canvas, border: `1px solid ${T.line}` }}>
                            <p className="text-base font-semibold" style={{ color: T.ink }}>{t.name}</p>
                            {t.description && <p className="text-xs mt-1" style={{ color: T.inkFaint }}>{t.description}</p>}
                            <p className="text-lg font-bold mt-3" style={{ color: T.navy }}>GH₵ {t.price}/{t.billingCycle}</p>
                            {t.benefits?.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {t.benefits.map((b: string, i: number) => (
                                  <li key={i} className="text-xs flex items-center gap-1.5" style={{ color: T.inkSoft }}>
                                    <span style={{ color: T.green }}>✓</span> {b}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {t.discountPercent > 0 && (
                              <p className="text-xs font-semibold mt-2" style={{ color: T.gold }}>{t.discountPercent}% discount on services</p>
                            )}
                            <button
                              onClick={() => handleSubscribe(t._id)}
                              disabled={subscribingTier === t._id}
                              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
                              style={{ background: T.gold, color: T.white }}
                            >
                              {subscribingTier === t._id ? <Loader2 size={13} className="animate-spin" /> : null}
                              {subscribingTier === t._id ? 'Subscribing...' : 'Subscribe'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                onMessage={handleMessage}
                onCall={handleCall}
                onJoinWaitlist={handleJoinWaitlist}
                onFollow={handleFollow}
                joiningWaitlist={joiningWaitlist}
                waitlistJoined={waitlistJoined}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <ConnectCard stylist={stylist} />
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
            onClick={handleMessage}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
            style={{ background: T.raised, color: T.inkSoft }}
          >
            <MessageSquare size={17} />
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
            images={stylist.portfolioImages.filter(i => i.type === 'image').map(i => imgSrc(i))}
            initialIndex={lightbox.index}
            onClose={() => setLightbox({ open: false, index: 0 })}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeVideoUrl && (
          <VideoViewer
            src={activeVideoUrl}
            onClose={() => setActiveVideoUrl(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {transformViewer.open && stylist.beforeAfter?.length && (
          <TransformDetail
            key="tv"
            items={stylist.beforeAfter}
            initialIndex={transformViewer.index}
            onClose={() => setTransformViewer({ open: false, index: 0 })}
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
              <p className="text-sm font-bold">{toastMsg || 'Booking Confirmed'}</p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {toastMsg ? '' : "You'll receive a confirmation shortly"}
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
    </TokenContext.Provider>
  );
}
