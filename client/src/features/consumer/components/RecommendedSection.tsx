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
  Wifi,
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
                  ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
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
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <SlidersHorizontal size={13} />
        {current?.label}
        <ChevronDown
          size={11}
          className={`text-gray-400 transition-transform duration-200 ${
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
            className="absolute top-full mt-1.5 right-0 z-50 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
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
                        ? "bg-gray-50 text-gray-900 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  {opt.label}
                  {opt.value === value && (
                    <Check size={12} className="text-gray-900" />
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
  const isLive = Boolean((stylist as unknown as Record<string, unknown>).isLive);
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
      className="group flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
          {!imageLoaded && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-xs font-bold text-gray-400">{initials}</span>
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

        {isLive && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <div className="w-3 h-3 rounded-full bg-green-500 border-[1.5px] border-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
            {stylist.name}
          </p>
          {isVerified && <BadgeCheck size={13} className="text-blue-500 shrink-0" />}
          {isLive && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              <Wifi size={8} />
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          {stylist.category && (
            <span className="font-medium text-gray-500">{stylist.category}</span>
          )}
          {/* ✅ Fixed: use the helper correctly */}
          {getLocationString(stylist.location) && (
            <>
              <span className="text-gray-200">·</span>
              <span className="flex items-center gap-0.5">
                <MapPin size={9} />
                {getLocationString(stylist.location)}
              </span>
            </>
          )}
          {distanceNum !== null && (
            <>
              <span className="text-gray-200">·</span>
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
                  className="shrink-0 text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded"
                >
                  {getServiceName(svc)}
                </span>
              ))}
              {stylist.services.length > 2 && (
                <span className="shrink-0 text-[10px] text-gray-300">
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
            <span className="text-xs font-bold text-gray-900 tabular-nums">
              {stylist.rating}
            </span>
            {reviewCount !== undefined && (
              <span className="text-[10px] text-gray-400">({reviewCount})</span>
            )}
          </div>
        )}

        {priceRange && (
          <span className="text-[11px] font-semibold text-gray-500">
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
                  ? "bg-red-50 text-red-500"
                  : "bg-gray-50 text-gray-300 hover:text-gray-500 hover:bg-gray-100"
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-semibold hover:bg-gray-800 shadow-sm transition-all opacity-0 group-hover:opacity-100 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
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

  const isLive = Boolean((stylist as unknown as Record<string, unknown>).isLive);
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
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-xl font-bold text-gray-300">{initials}</span>
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
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold shadow-md">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
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
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
            {stylist.name}
          </p>
          {isVerified && <BadgeCheck size={13} className="text-blue-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2">
          {stylist.category && (
            <span className="font-medium text-gray-500">{stylist.category}</span>
          )}
          {/* ✅ Fixed: use helper */}
          {getLocationString(stylist.location) && (
            <>
              <span className="text-gray-200">·</span>
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
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-900 hover:text-white border border-gray-100 hover:border-gray-900 transition-all duration-200 dark:hover:bg-gray-200 dark:hover:text-gray-900 dark:hover:border-gray-200"
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
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Users size={24} className="text-gray-300" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        No stylists found
      </h3>
      <p className="text-xs text-gray-400 max-w-[260px] mx-auto">
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
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50">
      <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-3.5 rounded-full bg-gray-100 animate-pulse" />
        <div className="w-48 h-2.5 rounded-full bg-gray-50 animate-pulse" />
      </div>
      <div className="shrink-0 space-y-2 flex flex-col items-end">
        <div className="w-12 h-3 rounded-full bg-gray-100 animate-pulse" />
        <div className="w-16 h-2.5 rounded-full bg-gray-50 animate-pulse" />
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
    const isLive = Boolean((stylist as unknown as Record<string, unknown>).isLive);
    return isLive ? `/app/live/${stylist.id}` : `/app/stylist/${stylist.id}`;
  };

  return (
    <section>
      <div className="mb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 tracking-tight whitespace-nowrap">
                Recommended
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 tabular-nums shrink-0">
                {filteredStylists.length}
              </span>

              <Link
                to={category !== "all" ? `/app/browse?category=${category.toLowerCase()}` : "/app/browse"}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm whitespace-nowrap sm:ml-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {category !== "all" ? `View all ${category}` : "Browse all"}
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>



          <div className="flex items-center gap-1 shrink-0">
            <SortDropdown value={sortBy} onChange={setSortBy} />

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="List view"
              >
                <LayoutList size={13} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
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
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : filteredStylists.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <EmptyState category={category} />
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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