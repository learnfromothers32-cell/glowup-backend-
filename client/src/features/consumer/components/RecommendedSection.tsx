// src/features/consumer/components/RecommendedSection.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  LayoutGrid,
  LayoutList,
  MapPin,
  Star,
  ArrowRight,
  Heart,
  ChevronDown,
  Check,
  Sparkles,
  Users,
  SlidersHorizontal,
  BadgeCheck,
} from "lucide-react";
import type { Stylist } from "@/domain/stylist/stylist.types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "grid" | "list";
type SortOption = "recommended" | "rating" | "distance" | "price" | "reviews";

interface RecommendedSectionProps {
  stylists: Stylist[];
  onBook: (stylist: Stylist) => void;
  onFavorite: (stylist: Stylist) => void;
  isFavorited: (stylistId: string) => boolean;
} 

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Safely extract a displayable location string from a stylist object */
function getLocationString(loc: any): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object" && "area" in loc) return loc.area;
  return String(loc);
}

function getDistanceNum(stylist: Stylist): number | null {
  if (!stylist.distance) return null;
  const str = String(stylist.distance);
  const num = parseFloat(str.split(" ")[0]);
  return isNaN(num) ? null : num;
}

function getServiceName(svc: unknown): string {
  if (typeof svc === "string") return svc;
  if (svc && typeof svc === "object" && "name" in svc) {
    return (svc as { name: string }).name;
  }
  return String(svc);
}

// ─── Category Tabs ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "hair", label: "Hair", icon: null },
  { id: "barber", label: "Barber", icon: null },
  { id: "braids", label: "Braids", icon: null },
  { id: "nails", label: "Nails", icon: null },
  { id: "skin", label: "Skin", icon: null },
  { id: "lashes", label: "Lashes", icon: null },
];

function CategoryTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        const Icon = cat.icon;

        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`
              shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium
              transition-all duration-200
              ${
                isActive
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-white dark:bg-surface-dark text-text-secondary dark:text-text-dark-secondary border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:text-text-primary dark:hover:text-text-dark-primary"
              }
            `}
          >
            {Icon && <Icon size={12} />}
            {cat.label}
          </button>
        );
      })}
    </div> 
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options: { value: SortOption; label: string }[] = [
    { value: "recommended", label: "Recommended" },
    { value: "rating", label: "Top Rated" },
    { value: "distance", label: "Nearest" },
    { value: "price", label: "Price: Low → High" },
    { value: "reviews", label: "Most Reviewed" },
  ];

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
      >
        <SlidersHorizontal size={13} />
        {current?.label}
        <ChevronDown
          size={11}
          className={`text-text-muted dark:text-text-dark-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-1.5 right-0 z-50 w-48 bg-white dark:bg-surface-dark-secondary rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden"
          >
            <div className="py-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors
                    ${
                      opt.value === value
                        ? "bg-brand-50 text-brand-600 font-semibold dark:bg-brand-950/20 dark:text-brand-300"
                        : "text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"
                    }
                  `}
                >
                  {opt.label}
                  {opt.value === value && (
                    <Check size={12} className="text-brand-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Compact List Row ────────────────────────────────────────────────────────
function CompactRow({
  stylist,
  index,
  onBook,
  onNavigate,
  onFavorite,
  isFavorited,
}: {
  stylist: Stylist;
  index: number;
  onBook: () => void;
  onNavigate: () => void;
  onFavorite: (stylist: Stylist) => void;
  isFavorited: (stylistId: string) => boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [liked, setLiked] = useState(() => isFavorited(stylist.id));

  const distanceNum = getDistanceNum(stylist);
  const isVerified = Boolean((stylist as unknown as Record<string, unknown>).isVerified);
  const priceRange = (stylist as unknown as Record<string, unknown>).priceRange as string | undefined;
  const reviewCount = (stylist as unknown as Record<string, unknown>).reviewCount as number | undefined;

  const initials = stylist.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.25 }}
      onClick={onNavigate}
      className="group flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          {!imageLoaded && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-600">{initials}</span>
            </div>
          )}
          {stylist.image && (
            <img
              src={stylist.image}
              alt={stylist.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {stylist.name}
          </p>
          {isVerified && <BadgeCheck size={13} className="text-blue-500 shrink-0" />}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-text-muted dark:text-text-dark-muted">
          {stylist.category && (
            <span className="font-medium text-text-secondary dark:text-text-dark-secondary">{stylist.category}</span>
          )}
          {getLocationString(stylist.location) && (
            <>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="flex items-center gap-0.5">
                <MapPin size={9} />
                {getLocationString(stylist.location)}
              </span>
            </>
          )}
          {distanceNum !== null && (
            <>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="text-blue-500 font-medium">
                {distanceNum < 1
                  ? `${(distanceNum * 1000).toFixed(0)}m`
                  : `${distanceNum.toFixed(1)}km`}
              </span>
            </>
          )}
        </div>

        {/* Services */}
        {stylist.services &&
          Array.isArray(stylist.services) &&
          stylist.services.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
              {stylist.services.slice(0, 2).map((svc, i) => (
                <span
                  key={i}
                  className="shrink-0 text-[10px] text-text-muted dark:text-text-dark-muted bg-gray-50 dark:bg-surface-dark-tertiary px-1.5 py-0.5 rounded"
                >
                  {getServiceName(svc)}
                </span>
              ))}
              {stylist.services.length > 2 && (
                <span className="shrink-0 text-[10px] text-gray-300 dark:text-gray-600">
                  +{stylist.services.length - 2} 
                </span>
              )}
            </div>
          )}
      </div>

      {/* Right side */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {stylist.rating && (
          <div className="flex items-center gap-1">
            <Star size={11} fill="#f59e0b" stroke="#f59e0b" />
            <span className="text-xs font-bold text-text-primary dark:text-text-dark-primary tabular-nums">
              {stylist.rating}
            </span>
            {reviewCount !== undefined && (
              <span className="text-[10px] text-text-muted dark:text-text-dark-muted">({reviewCount})</span>
            )}
          </div>
        )}

        {priceRange && (
          <span className="text-[11px] font-semibold text-text-secondary dark:text-text-dark-secondary">
            {priceRange}
          </span>
        )}

        <div className="flex items-center gap-1.5 mt-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
              onFavorite(stylist);
            }}
            className={`
              w-7 h-7 rounded-lg flex items-center justify-center transition-all
              ${
                liked
                  ? "bg-red-50 dark:bg-red-950/30 text-red-500"
                  : "bg-gray-50 dark:bg-surface-dark-tertiary text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark"
              }
            `}
          >
            <Heart size={12} fill={liked ? "currentColor" : "none"} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[11px] font-semibold hover:bg-brand-600 shadow-sm transition-all opacity-0 group-hover:opacity-100"
          >
            Book
            <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Grid Card ───────────────────────────────────────────────────────────────
function GridCard({
  stylist,
  index,
  onBook,
  onNavigate,
  onFavorite,
  isFavorited,
}: {
  stylist: Stylist;
  index: number;
  onBook: () => void;
  onNavigate: () => void;
  onFavorite: (stylist: Stylist) => void;
  isFavorited: (stylistId: string) => boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [liked, setLiked] = useState(() => isFavorited(stylist.id));

  const isVerified = Boolean((stylist as unknown as Record<string, unknown>).isVerified);
  const priceRange = (stylist as unknown as Record<string, unknown>).priceRange as string | undefined;
  const reviewCount = (stylist as unknown as Record<string, unknown>).reviewCount as number | undefined;

  const initials = stylist.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onNavigate}
      className="group bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden cursor-pointer hover:border-brand-100 dark:hover:border-brand-900/30 hover:shadow-card hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <span className="text-xl font-bold text-gray-300 dark:text-gray-600">{initials}</span>
          </div>
        )}
        {stylist.image && (
          <img
            src={stylist.image}
            alt={stylist.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            } group-hover:scale-105`}
          />
        )}

        {/* Top badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-start justify-between">
          <div className="ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLiked(!liked);
                onFavorite(stylist);
              }}
              className={`
                w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all
                ${
                  liked
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-black/20 text-white hover:bg-black/40"
                }
              `}
            >
              <Heart size={12} fill={liked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Bottom gradient + rating */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1">
          <Star size={10} fill="#fbbf24" stroke="#fbbf24" />
          <span className="text-xs font-bold text-white">{stylist.rating}</span>
          {reviewCount !== undefined && (
            <span className="text-[10px] text-white/70">({reviewCount})</span>
          )}
        </div>
        {priceRange && (
          <span className="absolute bottom-2 right-2.5 text-[10px] font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded">
            {priceRange}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {stylist.name}
          </p>
          {isVerified && <BadgeCheck size={13} className="text-blue-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted dark:text-text-dark-muted mb-2">
          {stylist.category && (
            <span className="font-medium text-text-secondary dark:text-text-dark-secondary">{stylist.category}</span>
          )}
          {getLocationString(stylist.location) && (
            <>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="flex items-center gap-0.5">
                <MapPin size={9} />
                {getLocationString(stylist.location)}
              </span>
            </>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-50 text-brand-600 text-xs font-semibold hover:bg-brand-500 hover:text-white border border-brand-200 hover:border-brand-500 transition-all duration-200 dark:bg-brand-950/20 dark:text-brand-300 dark:border-brand-900/30 dark:hover:bg-brand-600 dark:hover:text-white dark:hover:border-brand-500"
        >
          Book Now
          <ArrowRight size={11} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ category }: { category: string }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center mx-auto mb-4">
        <Users size={24} className="text-gray-300 dark:text-text-dark-muted" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-1">
        No stylists found
      </h3>
      <p className="text-xs text-text-muted dark:text-text-dark-muted max-w-[260px] mx-auto">
        {category === "all"
          ? "Try adjusting your filters or check back later for new recommendations"
          : `No ${category} stylists available right now. Try browsing all categories.`}
      </p>
    </div>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800">
      <div className="w-12 h-12 rounded-xl skeleton-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-3.5 rounded-full skeleton-pulse" />
        <div className="w-48 h-2.5 rounded-full skeleton-pulse opacity-60" />
      </div>
      <div className="shrink-0 space-y-2 flex flex-col items-end">
        <div className="w-12 h-3 rounded-full skeleton-pulse" />
        <div className="w-16 h-2.5 rounded-full skeleton-pulse opacity-60" />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RecommendedSection({
  stylists,
  onBook,
  onFavorite,
  isFavorited,
}: RecommendedSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [category, setCategory] = useState("all");
  const [loading] = useState(false);

  const navigate = useNavigate();

  const filteredStylists = useMemo(() => {
    let result = [...stylists];

    if (category !== "all") {
      result = result.filter((s) =>
        s.category?.toLowerCase().includes(category.toLowerCase()),
      );
    }

    switch (sortBy) {
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "distance": {
        result.sort((a, b) => {
          const da = getDistanceNum(a) ?? 999;
          const db = getDistanceNum(b) ?? 999;
          return da - db;
        });
        break;
      }
      case "price": {
        const parsePrice = (s: Stylist) => {
          const raw = (s.price || "").replace(/[^0-9.]/g, "");
          return parseFloat(raw) || 0;
        };
        result.sort((a, b) => parsePrice(a) - parsePrice(b));
        break;
      }
      case "reviews": {
        const reviews = (s: Stylist) => {
          const r = (s as unknown as Record<string, unknown>).reviewCount;
          return typeof r === "number" ? r : 0;
        };
        result.sort((a, b) => reviews(b) - reviews(a));
        break;
      }
      default:
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [stylists, category, sortBy]);

  const getStylistPath = (stylist: Stylist) => {
    return `/app/stylist/${stylist.id}`;
  };

  return (
    <section>
      <div className="mb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary tracking-tight whitespace-nowrap">
                Recommended
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary text-text-muted dark:text-text-dark-muted tabular-nums shrink-0">
                {filteredStylists.length}
              </span>

              <Link
                to={category !== "all" ? `/app/browse?category=${category.toLowerCase()}` : "/app/browse"}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm whitespace-nowrap sm:ml-2"
              >
                {category !== "all" ? `View all ${category}` : "Browse all"}
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <SortDropdown value={sortBy} onChange={setSortBy} />

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

            <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-surface-dark-tertiary rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-surface-dark shadow-sm text-text-primary dark:text-text-dark-primary"
                    : "text-text-muted dark:text-text-dark-muted hover:text-text-secondary dark:hover:text-text-dark-secondary"
                }`}
                title="List view"
              >
                <LayoutList size={13} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-surface-dark shadow-sm text-text-primary dark:text-text-dark-primary"
                    : "text-text-muted dark:text-text-dark-muted hover:text-text-secondary dark:hover:text-text-dark-secondary"
                }`}
                title="Grid view"
              >
                <LayoutGrid size={13} />
              </button>
            </div>
          </div>
        </div>

        <CategoryTabs active={category} onChange={setCategory} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : filteredStylists.length === 0 ? (
        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40">
          <EmptyState category={category} />
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden">
          {filteredStylists.map((stylist, i) => (
            <CompactRow
              key={stylist.id}
              stylist={stylist}
              index={i}
              onBook={() => onBook(stylist)}
              onNavigate={() => navigate(getStylistPath(stylist))}
              onFavorite={onFavorite}
              isFavorited={isFavorited}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredStylists.map((stylist, i) => (
            <GridCard
              key={stylist.id}
              stylist={stylist}
              index={i}
              onBook={() => onBook(stylist)}
              onNavigate={() => navigate(getStylistPath(stylist))}
              onFavorite={onFavorite}
              isFavorited={isFavorited}
            />
          ))}
        </div>
      )}
    </section>
  );
}