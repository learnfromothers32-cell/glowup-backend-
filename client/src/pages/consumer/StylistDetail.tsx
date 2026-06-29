// src/pages/consumer/StylistDetail.tsx — Fresha-style Redesign
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useStylistDetail } from "../../hooks/useStylistDetail";
import { useFollow } from "../../context/FollowContext";
import BookingModal from "../../features/consumer/components/BookingModal";
import { useGamification } from "../../hooks/useGamification";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import {
  createConversation,
  getMyConversations,
} from "../../api/conversations";
import { logger } from "../../utils/logger";
import { joinWaitlist } from "../../api/waitlist";
import { getStylistProducts } from "../../api/products";
import { getStylistPackages, purchasePackage } from "../../api/packages";
import { subscribeToTier, getStylistTiers } from "../../api/memberships";
import type { Stylist } from "@/domain/stylist/stylist.types";
interface BeforeAfter {
  _id?: string;
  before: string;
  after: string;
  caption?: string;
  service?: string;
  mediaType?: "image" | "video";
  likes?: number;
  views?: number;
  createdAt?: string;
}
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
  ChevronLeft,
  Award,
  Zap,
  Calendar,
  ArrowRight,
  MessageSquare,
  BadgeCheck,
  Users,
  Scissors,
  ImageIcon,
  Phone,
  Camera,
  Shield,
  TrendingUp,
  Globe,
  AtSign,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Gift,
  Crown,
  ThumbsUp,
  Wifi,
  Sparkles,
} from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Skeleton } from "../../components/ui/Skeleton";
import { FollowButton } from "../../components/ui/FollowButton";
import { API_SERVER_URL } from "../../api/axios";

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
interface ExtendedStylist extends Omit<Stylist, "bio"> {
  portfolioImages?: string[];
  beforeAfter?: BeforeAfter[];
  bio?: string;
  reviews: Review[];
}
interface ServiceItem {
  _id?: string;
  name: string;
  price: string;
  duration: string;
  category?: string;
  popular?: boolean;
}

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
  n >= 1000
    ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
    : n
      ? String(n)
      : "0";
function getLocationString(loc: any): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object" && "area" in loc) return loc.area;
  return String(loc);
}
const imgSrc = (item: string | { url: string; type?: string }) =>
  typeof item === "string"
    ? item
    : item.url.startsWith("http")
      ? item.url
      : `${API_SERVER_URL}${item.url}`;
const transformImgSrc = (url: string) =>
  url.startsWith("http") ? url : `${API_SERVER_URL}${url}`;

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= Math.round(rating)
              ? "text-amber-400"
              : "text-gray-200 dark:text-gray-700"
          }
          fill={n <= Math.round(rating) ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
        aria-label="Close"
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
          className="w-full max-h-[80vh] object-contain rounded-xl"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setIndex((i) => (i > 0 ? i - 1 : images.length - 1))
              }
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white bg-white/10 backdrop-blur-sm transition hover:bg-white/25"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white bg-white/10 backdrop-blur-sm transition hover:bg-white/25"
            >
              <ChevronRight size={17} />
            </button>
          </>
        )}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="text-xs text-white/40 tabular-nums">
          {index + 1} / {images.length}
        </span>
        <div className="flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-0.5 rounded-full transition-all duration-300 ${i === index ? "w-5 bg-brand-500" : "w-[5px] bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function VideoViewer({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
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
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="w-full h-full sm:max-w-[90vw] sm:max-h-[85vh] md:max-w-3xl object-contain bg-black sm:rounded-xl"
        />
      </div>
    </motion.div>
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
  const [index, setIndex] = useState(initialIndex);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIndex((i) => (i > 0 ? i - 1 : items.length - 1));
      if (e.key === "ArrowRight")
        setIndex((i) => (i < items.length - 1 ? i + 1 : 0));
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
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {item.mediaType === "video" ? (
          <video
            src={transformImgSrc(item.after)}
            controls
            autoPlay
            playsInline
            className="w-full h-full sm:max-w-[90vw] sm:max-h-[85vh] md:max-w-3xl object-contain bg-black sm:rounded-xl"
          />
        ) : (
          <img
            src={transformImgSrc(item.after)}
            alt=""
            className="w-full h-full sm:max-w-[90vw] sm:max-h-[85vh] md:max-w-3xl object-contain bg-black sm:rounded-xl"
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
          <button
            onClick={() => setIndex((i) => i - 1)}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 z-10"
            aria-label="Next"
          >
            <ChevronRight size={17} />
          </button>
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gray-100 dark:bg-gray-800/50">
        <Icon size={22} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">
        {title}
      </p>
      <p className="text-xs max-w-[240px] leading-relaxed text-gray-500 dark:text-gray-400">
        {sub}
      </p>
    </div>
  );
}

function PortfolioCarousel({
  items,
  onView,
}: {
  items: Array<{
    url: string;
    type: "image" | "video";
    caption?: string;
    service?: string;
    likes?: number;
  }>;
  onView: (index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = items.length;

  if (total === 0) return null;

  const item = items[currentIndex];
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < total - 1;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((i) => (i > 0 ? i - 1 : total - 1));
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((i) => (i < total - 1 ? i + 1 : 0));
  };

  return (
    <div className="relative">
      <motion.button
        key={currentIndex}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        onClick={() => onView(currentIndex)}
        className="w-full rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800/50">
          {item.type === "video" ? (
            <>
              <video
                src={imgSrc(item)}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <polygon points="8,5 19,12 8,19" />
                  </svg>
                </div>
              </div>
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-black/50 backdrop-blur-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>{" "}
                  Video
                </span>
              </div>
            </>
          ) : (
            <img
              src={imgSrc(item)}
              alt={item.caption || ""}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {(item.caption || item.service) && (
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              {item.service && (
                <p className="text-sm font-semibold text-white">
                  {item.service}
                </p>
              )}
              {item.caption && (
                <p className="text-xs text-white/70 mt-0.5">{item.caption}</p>
              )}
            </div>
          )}
        </div>
      </motion.button>

      {canGoLeft && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white/90 dark:bg-gray-800/90 shadow-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 z-30 transition-all"
          aria-label="Previous transformation"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {canGoRight && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center bg-white/90 dark:bg-gray-800/90 shadow-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 z-30 transition-all"
          aria-label="Next transformation"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {total > 1 && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[11px] font-semibold text-white tabular-nums z-10">
          {currentIndex + 1} / {total}
        </div>
      )}

      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCurrentIndex(i);
              }}
              className={`rounded-full transition-all duration-300 ${i === currentIndex ? "w-6 h-1.5 bg-brand-500" : "w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600"}`}
              aria-label={`Go to transformation ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioTab({
  images,
  beforeAfter,
  onOpenImage,
  onPlayVideo,
  onViewTransform,
}: {
  images: Array<{ url: string; type: "image" | "video" }>;
  beforeAfter: BeforeAfter[];
  onOpenImage: (i: number) => void;
  onPlayVideo: (url: string) => void;
  onViewTransform: (i: number) => void;
}) {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<"posts" | "transforms">("posts");
  const hasPosts = images?.length > 0;
  const hasTransforms = beforeAfter?.length > 0;
  if (!hasPosts && !hasTransforms)
    return (
      <EmptyState
        icon={ImageIcon}
        title="Portfolio coming soon"
        sub="Check back to see this stylist's work"
      />
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Posts", value: images.length, icon: ImageIcon },
          { label: "Transforms", value: beforeAfter.length, icon: Scissors },
          {
            label: "Views",
            value: formatCount(
              beforeAfter.reduce((s, i) => s + ((i as any).views || 0), 0),
            ),
            icon: Eye,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
          >
            <Icon size={16} className="text-brand-500 mb-1.5" />
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {value}
            </span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700/40">
        {[
          { key: "posts" as const, label: "Posts", count: images.length },
          {
            key: "transforms" as const,
            label: "Transforms",
            count: beforeAfter.length,
          },
        ]
          .filter((t) => (t.key === "posts" ? hasPosts : hasTransforms))
          .map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`relative pb-3 text-sm font-medium transition-colors ${subTab === key ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {label}
              <span className="ml-1.5 text-xs text-gray-400">({count})</span>
              {subTab === key && (
                <motion.div
                  layoutId="portfolioSub"
                  className="absolute bottom-0 inset-x-0 h-0.5 rounded-full bg-brand-500"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
            </button>
          ))}
      </div>
      {subTab === "posts" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {images.map((item, i) => {
            const imgIndex =
              images.filter((x) => x.type === "image").length > 0
                ? images.slice(0, i).filter((x) => x.type === "image").length
                : i;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() =>
                  item.type === "video"
                    ? onPlayVideo(imgSrc(item))
                    : onOpenImage(imgIndex)
                }
                className="group relative aspect-square overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                {item.type === "video" ? (
                  <>
                    <video
                      src={imgSrc(item)}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <polygon points="8,5 19,12 8,19" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute top-1.5 left-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-white bg-black/60 backdrop-blur-sm">
                        Video
                      </span>
                    </div>
                  </>
                ) : (
                  <img
                    src={imgSrc(item)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <>
          <PortfolioCarousel
            items={beforeAfter.map((t) => ({
              url: t.mediaType === "video" ? t.after : t.after,
              type: t.mediaType || "image",
              caption: t.caption,
              service: t.service,
              likes: (t as any).likes,
            }))}
            onView={onViewTransform}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {beforeAfter.map((item, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onViewTransform(i)}
                className="group relative aspect-square overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                {item.mediaType === "video" ? (
                  <>
                    <video
                      src={transformImgSrc(item.after)}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <polygon points="8,5 19,12 8,19" />
                        </svg>
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
                  <span className="text-[10px] font-semibold text-white">
                    {(item as any).views ?? 0}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}
      {subTab === "transforms" && beforeAfter.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => navigate("/app/trending")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 bg-brand-500 text-white"
          >
            <TrendingUp size={14} /> View trending transformations
          </button>
        </div>
      )}
    </div>
  );
}

function ServicesTab({
  services,
  stylistId,
}: {
  services: ServiceItem[];
  stylistId: string;
}) {
  const navigate = useNavigate();
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
    <div className="space-y-4">
      {cats.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${cat === c ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
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
                className="group rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() =>
                  navigate(
                    `/app/stylist/${stylistId}/service/${svc._id || svc.name.toLowerCase().replace(/\s+/g, "-")}`,
                  )
                }
              >
                {svc.popular && (
                  <div className="h-0.5 bg-gradient-to-r from-amber-400 to-brand-500" />
                )}
                <div className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-50 dark:bg-brand-500/10">
                    <Scissors size={17} className="text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {svc.name}
                      </span>
                      {svc.popular && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          Popular
                        </span>
                      )}
                    </div>
                    {svc.duration && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={10} /> {svc.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                      {svc.price || "\u2014"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/app/stylist/${stylistId}/service/${svc._id || svc.name.toLowerCase().replace(/\s+/g, "-")}`,
                        );
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all duration-200 active:scale-[0.97]"
                    >
                      Book
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
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
          <div className="p-6 flex items-center gap-5">
            <div className="text-center shrink-0">
              <p className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                {stylist.rating.toFixed(1)}
              </p>
              <div className="mt-2">
                <StarRating rating={Math.round(stylist.rating)} size={14} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mt-1.5 text-gray-500 dark:text-gray-400">
                {reviews.length} reviews
              </p>
            </div>
            <div className="flex-1 space-y-2">
              {dist.map((d) => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold w-2.5 tabular-nums text-gray-500 dark:text-gray-400">
                    {d.stars}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.pct}%` }}
                      transition={{
                        duration: 0.9,
                        delay: 0.2,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full bg-brand-500"
                    />
                  </div>
                  <span className="text-[11px] w-3.5 tabular-nums text-right text-gray-500 dark:text-gray-400">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4 text-gray-500 dark:text-gray-400">
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
                  <span className="text-xs w-20 shrink-0 text-gray-600 dark:text-gray-400">
                    {label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(score / 5) * 100}%` }}
                      transition={{
                        duration: 0.9,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full bg-brand-500"
                    />
                  </div>
                  <span className="text-xs font-bold w-5 tabular-nums text-gray-900 dark:text-gray-100">
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
              className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5"
            >
              <div className="flex items-start gap-3.5">
                <Avatar name={rev.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {rev.user}
                      </p>
                      <StarRating rating={rev.rating} size={11} />
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {rev.date}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {rev.comment}
                  </p>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors">
                      <ThumbsUp size={11} /> Helpful
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors">
                      <MessageSquare size={11} /> Reply
                    </button>
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

function StylistSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <Skeleton className="h-44 sm:h-52 rounded-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-5">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-5">
            <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40 rounded-lg" />
              <Skeleton className="h-4 w-28 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-6 mb-5">
            <Skeleton className="h-10 w-16 rounded-lg" />
            <Skeleton className="h-10 w-16 rounded-lg" />
            <Skeleton className="h-10 w-16 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_368px] gap-7 items-start">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

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
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden">
            {stylist.image ? (
              <img
                src={stylist.image}
                alt={stylist.name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base font-bold bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                {getInitials(stylist.name)}
              </div>
            )}
          </div>
          {stylist.isLive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-red-500">
              <span className="animate-ping absolute inset-0 rounded-full bg-red-500 opacity-75" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold truncate text-gray-900 dark:text-gray-100">
              {stylist.name}
            </p>
            {stylist.isVerified && (
              <BadgeCheck size={14} className="shrink-0 text-brand-500" />
            )}
          </div>
          <p className="text-xs flex items-center gap-1 mt-0.5 text-gray-500 dark:text-gray-400">
            <MapPin size={10} /> {getLocationString(stylist.location)}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10">
          <Star size={12} fill="currentColor" className="text-amber-500" />
          <span className="text-xs font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {stylist.rating.toFixed(1)}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            ({stylist.reviews.length})
          </span>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-500 dark:text-gray-400">
              Starting from
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-4xl font-bold tabular-nums leading-none text-gray-900 dark:text-gray-100">
                {minPrice > 0 ? `GH\u20B5 ${minPrice}` : "\u2014"}
              </span>
              {minPrice > 0 && (
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  / session
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 mt-0.5">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-50 dark:bg-green-500/10 text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Available Today
            </span>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
              Usually responds in &lt;1hr
            </span>
          </div>
        </div>
      </div>
      <div className="mx-5 mb-5 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700/40">
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
              <SIcon size={13} className="text-brand-500" />
              <p className="text-base font-bold tabular-nums leading-tight text-gray-900 dark:text-gray-100">
                {value}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 space-y-2.5">
        <button
          onClick={() => onBook()}
          className="w-full bg-brand-500 text-white hover:bg-brand-600 relative overflow-hidden flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 active:scale-[0.98] shadow-sm"
        >
          <Calendar size={15} /> Book an Appointment
          <ArrowRight
            size={13}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onMessage}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
          >
            <MessageSquare size={13} /> Message
          </button>
          <button
            onClick={onCall}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
          >
            <Phone size={13} /> Call
          </button>
        </div>
        <button
          onClick={onJoinWaitlist}
          disabled={joiningWaitlist}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${waitlistJoined ? "bg-green-50 dark:bg-green-500/10 text-green-600" : "bg-brand-50 dark:bg-brand-500/10 text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-500/20"}`}
        >
          {joiningWaitlist ? (
            <Loader2 size={13} className="animate-spin" />
          ) : waitlistJoined ? (
            <Check size={13} />
          ) : null}
          {waitlistJoined ? "Joined waitlist!" : "Join Waitlist"}
        </button>
      </div>
      <div className="mx-5 mt-4 mb-5 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-green-50 dark:bg-green-500/10">
            <Shield size={11} className="text-green-600" />
          </div>
          <span className="text-[11px] font-medium leading-snug text-gray-600 dark:text-gray-300">
            Payments are 100% secure & encrypted
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-green-50 dark:bg-green-500/10">
            <ArrowLeft size={11} className="text-green-600" />
          </div>
          <span className="text-[11px] font-medium leading-snug text-gray-600 dark:text-gray-300">
            Free cancellation up to 24h before
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-green-50 dark:bg-green-500/10">
            <BadgeCheck size={11} className="text-green-600" />
          </div>
          <span className="text-[11px] font-medium leading-snug text-gray-600 dark:text-gray-300">
            Identity-verified professional stylist
          </span>
        </div>
      </div>
      <div className="px-5 pb-4 flex items-center justify-center gap-1.5">
        <Wifi size={11} className="text-gray-400" />
        <p className="text-[10px] text-gray-400">
          Real-time availability &middot; No hidden fees
        </p>
      </div>
    </div>
  );
}

function ConnectCard({ stylist }: { stylist?: any }) {
  const socialLinks = [
    stylist?.instagram && {
      icon: Camera,
      label: "Instagram",
      sub: `@${stylist.instagram}`,
      url: `https://instagram.com/${stylist.instagram}`,
    },
    stylist?.twitter && {
      icon: AtSign,
      label: "Twitter / X",
      sub: `@${stylist.twitter}`,
      url: `https://x.com/${stylist.twitter}`,
    },
    stylist?.tiktok && {
      icon: Sparkles,
      label: "TikTok",
      sub: `@${stylist.tiktok}`,
      url: `https://tiktok.com/@${stylist.tiktok}`,
    },
    stylist?.website && {
      icon: Globe,
      label: "Website",
      sub: stylist.website,
      url: stylist.website.startsWith("http")
        ? stylist.website
        : `https://${stylist.website}`,
    },
  ].filter(Boolean) as {
    icon: any;
    label: string;
    sub: string;
    url: string;
  }[];

  if (socialLinks.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="px-4 py-3.5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          Connect
        </h3>
      </div>
      <div className="p-3 space-y-2">
        {socialLinks.map(({ icon: SIcon, label, sub, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 no-underline bg-gray-50 dark:bg-gray-800/50 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-800">
              <SIcon size={15} className="text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {label}
              </p>
              <p className="text-[10px] truncate text-gray-500 dark:text-gray-400">
                {sub}
              </p>
            </div>
            <ExternalLink size={12} className="text-gray-400 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function StylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addPoints, incrementAction } = useGamification();
  const { addToRecentlyViewed } = useRecentlyViewed();

  const { stylist, setStylist, loading } = useStylistDetail(id);
  const followCtx = useFollow();
  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [transformViewer, setTransformViewer] = useState<{
    open: boolean;
    index: number;
  }>({ open: false, index: 0 });
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    service: ServiceItem | null;
  }>({ open: false, service: null });
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
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
    getStylistProducts(stylist.id)
      .then(setProducts)
      .catch(() => {});
    getStylistPackages(stylist.id)
      .then(setPackages)
      .catch(() => {});
    getStylistTiers(stylist.id)
      .then(setTiers)
      .catch(() => {});
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
              followerCount: Math.max(
                0,
                (prev.followerCount ?? 0) + (following ? 1 : -1),
              ),
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
        const existing = convs.find(
          (c: any) => c.stylistId?._id === stylist.id,
        );
        if (existing) {
          navigate("/app/messages", {
            state: { conversationId: existing._id },
          });
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
      setToastMsg("No phone number available for this stylist");
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
        serviceId: "",
        preferredDate: new Date().toISOString(),
      });
      setWaitlistJoined(true);
      setTimeout(() => setWaitlistJoined(false), 3000);
    } catch {
      /* ignore */
    }
    setJoiningWaitlist(false);
  }, [stylist?.id, joiningWaitlist]);

  const handleBuyPackage = useCallback(async (packageId: string) => {
    setBuyingPackage(packageId);
    try {
      await purchasePackage(packageId);
      setToastMsg("Package purchased!");
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (e: any) {
      setToastMsg(e?.response?.data?.message || "Purchase failed");
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    }
    setBuyingPackage(null);
  }, []);

  const handleSubscribe = useCallback(async (tierId: string) => {
    setSubscribingTier(tierId);
    try {
      await subscribeToTier(tierId);
      setToastMsg("Subscribed!");
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (e: any) {
      setToastMsg(e?.response?.data?.message || "Subscription failed");
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-gray-50/50 dark:bg-gray-950">
        <EmptyState
          icon={Users}
          title="Stylist not found"
          sub="This profile doesn't exist or has been removed."
        />
        <button
          onClick={() => navigate("/app")}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-500 text-white hover:bg-brand-600 transition-all"
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
      key: "products",
      label: "Shop",
      icon: ShoppingBag,
      count: products.length,
    },
    { key: "packages", label: "Packages", icon: Gift, count: packages.length },
    {
      key: "memberships",
      label: "Memberships",
      icon: Crown,
      count: tiers.length,
    },
  ];

  const goTo = (key: TabKey) => {
    setActiveTab(key);
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      {/* Cover Image */}
      <div className="relative h-44 sm:h-52 overflow-hidden">
        {stylist.image ? (
          <img
            src={stylist.image}
            alt={stylist.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />

        {/* Back + Share + Save */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all bg-white/20 backdrop-blur-lg text-white hover:bg-white/30"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/20 backdrop-blur-lg text-white hover:bg-white/30"
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
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${saved ? "bg-brand-500" : "bg-white/20 backdrop-blur-lg"} text-white hover:bg-brand-500`}
            >
              <Heart size={14} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* Stylist Profile Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-md">
                {stylist.image ? (
                  <img
                    src={stylist.image}
                    alt={stylist.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                    {getInitials(stylist.name)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stylist.name}
                </h1>
                {stylist.isVerified && (
                  <BadgeCheck size={18} className="text-brand-500 shrink-0" />
                )}
                <FollowButton
                  stylistId={stylist.id}
                  isFollowing={stylist.isFollowing ?? false}
                  onFollowChange={handleFollow ?? (() => {})}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin size={11} /> {getLocationString(stylist.location)}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <StarRating rating={Math.round(stylist.rating)} size={11} />
                  <span className="font-semibold text-gray-900 dark:text-gray-100 ml-0.5">
                    {stylist.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-400">
                    ({stylist.reviews.length})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {stylist.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed max-w-2xl">
              {stylist.bio}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-8 sm:gap-12 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {formatCount(stylist.followerCount ?? 0)}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Followers
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {formatCount(stylist.totalLikes ?? 0)}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Likes
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                {stylist.reviews.length}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Reviews
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleMessage}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
            >
              <MessageSquare size={14} /> Message
            </button>
            <button
              onClick={() => handleBook()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all bg-brand-500 text-white hover:bg-brand-600 shadow-sm"
            >
              <Calendar size={14} /> Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex items-center gap-0 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {tabs.map(({ key, label, icon: Icon, count }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => goTo(key)}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors duration-200 ${active ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                  {!!count && count > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                      {count}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="tabIndicator"
                      className="absolute bottom-0 left-3 sm:left-4 right-3 sm:right-4 h-0.5 rounded-full bg-brand-500"
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

      {/* Content */}
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
                      {[
                        {
                          icon: Shield,
                          label: "Verified Professional",
                          cls: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400",
                        },
                        {
                          icon: Award,
                          label: "Top Rated",
                          cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        },
                        {
                          icon: Zap,
                          label: "Quick Response",
                          cls: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                        },
                        {
                          icon: TrendingUp,
                          label: "High Demand",
                          cls: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
                        },
                      ].map(({ icon: PI, label, cls }) => (
                        <span
                          key={label}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide ${cls}`}
                        >
                          <PI size={11} /> {label}
                        </span>
                      ))}
                    </div>
                    {stylist.bio && (
                      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            About
                          </h2>
                        </div>
                        <div className="px-5 sm:px-6 py-5">
                          <p className="text-sm leading-[1.8] text-gray-600 dark:text-gray-300">
                            {stylist.bio}
                          </p>
                        </div>
                      </div>
                    )}
                    {services.length > 0 && (
                      <div>
                        <div className="flex items-end justify-between gap-2 flex-wrap mb-5">
                          <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Featured Services
                            </h2>
                            <p className="text-xs mt-0.5 font-medium text-gray-500 dark:text-gray-400">
                              {services.length} services available
                            </p>
                          </div>
                          <button
                            onClick={() => goTo("services")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                          >
                            View all <ArrowRight size={13} />
                          </button>
                        </div>
                        <div
                          className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory"
                          style={{ scrollbarWidth: "none" }}
                        >
                          {services.slice(0, 6).map((svc, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: 14 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="snap-start shrink-0 w-[200px] sm:w-[220px] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                              onClick={() =>
                                navigate(
                                  `/app/stylist/${id}/service/${svc._id || svc.name.toLowerCase().replace(/\s+/g, "-")}`,
                                )
                              }
                            >
                              {svc.popular && (
                                <div className="h-0.5 bg-gradient-to-r from-amber-400 to-brand-500" />
                              )}
                              <div className="p-4">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3.5 bg-brand-50 dark:bg-brand-500/10">
                                  <Scissors
                                    size={15}
                                    className="text-brand-500"
                                  />
                                </div>
                                <p className="text-xs font-bold mb-1 truncate text-gray-900 dark:text-gray-100">
                                  {svc.name}
                                </p>
                                {svc.duration && (
                                  <p className="text-[11px] flex items-center gap-1 mb-3.5 text-gray-500 dark:text-gray-400">
                                    <Clock size={9} /> {svc.duration}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">
                                    {svc.price || "\u2014"}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-brand-500 text-white">
                                    Book
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    {stylist.reviews.length > 0 && (
                      <div>
                        <div className="flex items-end justify-between gap-2 flex-wrap mb-5">
                          <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Client Reviews
                            </h2>
                            <p className="text-xs mt-0.5 font-medium text-gray-500 dark:text-gray-400">
                              {stylist.reviews.length} verified reviews
                            </p>
                          </div>
                          <button
                            onClick={() => goTo("reviews")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                          >
                            See all <ArrowRight size={13} />
                          </button>
                        </div>
                        <div
                          className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory"
                          style={{ scrollbarWidth: "none" }}
                        >
                          {stylist.reviews
                            .slice(0, 5)
                            .map((rev: Review, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 14 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="snap-start shrink-0 w-[260px] sm:w-[280px] rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                              >
                                <div className="flex items-center gap-2.5 mb-3">
                                  <Avatar name={rev.user} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate text-gray-900 dark:text-gray-100">
                                      {rev.user}
                                    </p>
                                    <StarRating rating={rev.rating} size={10} />
                                  </div>
                                  <span className="text-[9px] shrink-0 text-gray-500 dark:text-gray-400">
                                    {rev.date}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed line-clamp-3 text-gray-600 dark:text-gray-300">
                                  {rev.comment}
                                </p>
                              </motion.div>
                            ))}
                        </div>
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
                    onViewTransform={(i) =>
                      setTransformViewer({ open: true, index: i })
                    }
                  />
                )}
                {activeTab === "services" && (
                  <ServicesTab services={services} stylistId={id!} />
                )}
                {activeTab === "reviews" && <ReviewsTab stylist={stylist} />}
                {activeTab === "products" && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-500/10">
                        <ShoppingBag size={15} className="text-brand-500" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          Shop
                        </h2>
                        <p className="text-xs mt-0.5 font-medium text-gray-500 dark:text-gray-400">
                          Available products
                        </p>
                      </div>
                    </div>
                    {products.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No products available
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {products.map((p: any) => (
                          <div
                            key={p._id}
                            className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                          >
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {p.name}
                            </p>
                            {p.description && (
                              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                {p.description}
                              </p>
                            )}
                            <p className="text-sm font-bold mt-2 text-brand-600">
                              GH\u20B5 {p.price}
                            </p>
                            <p
                              className={`text-xs ${p.stock > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {p.stock > 0
                                ? `${p.stock} in stock`
                                : "Out of stock"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "packages" && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-500/10">
                        <Gift size={15} className="text-brand-500" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          Packages
                        </h2>
                        <p className="text-xs mt-0.5 font-medium text-gray-500 dark:text-gray-400">
                          Service bundles
                        </p>
                      </div>
                    </div>
                    {packages.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No packages available
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {packages.map((p: any) => (
                          <div
                            key={p._id}
                            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                          >
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                              {p.name}
                            </p>
                            {p.description && (
                              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                {p.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <p className="text-lg font-bold text-brand-600">
                                GH\u20B5 {p.price}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                &middot; {p.totalSessions} sessions
                              </span>
                            </div>
                            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                              Expires in {p.expiryDays} days
                            </p>
                            <button
                              onClick={() => handleBuyPackage(p._id)}
                              disabled={buyingPackage === p._id}
                              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-500 text-white hover:bg-brand-600"
                            >
                              {buyingPackage === p._id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : null}
                              {buyingPackage === p._id
                                ? "Buying..."
                                : "Buy Package"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "memberships" && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-500/10">
                        <Crown size={15} className="text-brand-500" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          Memberships
                        </h2>
                        <p className="text-xs mt-0.5 font-medium text-gray-500 dark:text-gray-400">
                          Subscription plans
                        </p>
                      </div>
                    </div>
                    {tiers.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No membership plans available
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tiers.map((t: any) => (
                          <div
                            key={t._id}
                            className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                          >
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                              {t.name}
                            </p>
                            {t.description && (
                              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                {t.description}
                              </p>
                            )}
                            <p className="text-lg font-bold mt-3 text-brand-600">
                              GH\u20B5 {t.price}/{t.billingCycle}
                            </p>
                            {t.benefits?.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {t.benefits.map((b: string, i: number) => (
                                  <li
                                    key={i}
                                    className="text-xs flex items-center gap-1.5 text-gray-600 dark:text-gray-300"
                                  >
                                    <span className="text-green-600">
                                      &check;
                                    </span>{" "}
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {t.discountPercent > 0 && (
                              <p className="text-xs font-semibold mt-2 text-brand-600">
                                {t.discountPercent}% discount on services
                              </p>
                            )}
                            <button
                              onClick={() => handleSubscribe(t._id)}
                              disabled={subscribingTier === t._id}
                              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-500 text-white hover:bg-brand-600"
                            >
                              {subscribingTier === t._id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : null}
                              {subscribingTier === t._id
                                ? "Subscribing..."
                                : "Subscribe"}
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

          {/* Sidebar */}
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

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-800">
          <div className="flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              From
            </p>
            <p className="text-xl font-bold tabular-nums leading-tight text-gray-900 dark:text-gray-100">
              {minPrice > 0 ? `GH\u20B5 ${minPrice}` : "Contact"}
            </p>
          </div>
          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Share2 size={17} />
          </button>
          <button
            onClick={handleMessage}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <MessageSquare size={17} />
          </button>
          <button
            onClick={() => handleBook()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97] bg-brand-500 text-white shadow-sm"
          >
            <Calendar size={14} /> Book Now
          </button>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {lightbox.open && stylist.portfolioImages && (
          <Lightbox
            key="lb"
            images={stylist.portfolioImages
              .filter((i) => i.type === "image")
              .map((i) => imgSrc(i))}
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
            className="fixed bottom-28 lg:bottom-8 left-1/2 z-[400] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg pointer-events-none bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-green-500">
              <Check size={13} color="#fff" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {toastMsg || "Booking Confirmed"}
              </p>
              <p className="text-[10px] mt-0.5 text-white/55 dark:text-gray-500">
                {toastMsg ? "" : "You'll receive a confirmation shortly"}
              </p>
            </div>
          </motion.div>
        )}
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-28 lg:bottom-8 left-1/2 z-[400] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg pointer-events-none bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-brand-500">
              <Check size={12} color="#fff" />
            </div>
            <p className="text-xs font-bold">Link copied to clipboard</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
