import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  LayoutGrid,
  LayoutList,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Check,
  MapPin,
  Star,
  Users,
  ArrowRight,
} from "lucide-react";
import { getStylists } from "../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import StylistCard from "../../features/consumer/components/StylistCard";
import { Skeleton } from "../../components/ui/Skeleton";

type SortOption = "recommended" | "rating" | "distance" | "price" | "reviews";
type ViewMode = "grid" | "list";

const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "hair", label: "Hair" },
  { id: "barber", label: "Barber" },
  { id: "braids", label: "Braids" },
  { id: "nails", label: "Nails" },
  { id: "skin", label: "Skin" },
  { id: "lashes", label: "Lashes" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top Rated" },
  { value: "distance", label: "Nearest" },
  { value: "price", label: "Price: Low → High" },
  { value: "reviews", label: "Most Reviewed" },
];

function parsePrice(p: string | number | undefined | null): number {
  if (p == null) return Infinity;
  if (typeof p === "number") return p;
  return parseFloat(p.replace(/[^0-9.]/g, "")) || Infinity;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListCard({ stylist, index }: { stylist: Stylist; index: number }) {
  const navigate = useNavigate();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ delay: index * 0.03, duration: 0.25, layout: { duration: 0.3 } }}
      onClick={() => navigate(`/app/stylist/${stylist.id}`)}
      className="group flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 hover:border-brand-100 dark:hover:border-brand-900/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
        {stylist.image ? (
          <img
            src={stylist.image}
            alt={stylist.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-300 dark:text-gray-600">
            {stylist.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        {stylist.isLive && (
          <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-1 ring-white dark:ring-gray-900" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate">
            {stylist.name}
          </p>
          {stylist.isVerified && (
            <Star size={11} className="fill-blue-500 text-blue-500 shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-0.5 text-[11px] text-text-secondary dark:text-text-dark-secondary">
            <Star size={9} className="fill-amber-400 text-amber-400" />
            {stylist.rating || "-"}
          </div>
          {stylist.location && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="flex items-center gap-0.5 text-[11px] text-text-muted dark:text-text-dark-muted truncate max-w-[140px]">
                <MapPin size={8} />
                {typeof stylist.location === "string"
                  ? stylist.location
                  : stylist.location.area || ""}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1.5">
          {stylist.priceRange && (
            <span className="text-[11px] font-semibold text-text-primary dark:text-text-dark-primary tabular-nums">
              {stylist.priceRange}
            </span>
          )}
          {stylist.services && stylist.services.length > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-[11px] text-text-muted dark:text-text-dark-muted truncate">
                {stylist.services
                  .slice(0, 2)
                  .map((s) => (typeof s === "string" ? s : s.name))
                  .join(", ")}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/app/stylist/${stylist.id}`);
          }}
          variant="primary"
          size="sm"
        >
          View
        </Button>
      </div>
    </motion.div>
  );
}

export default function BrowseStylists() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allStylists, setAllStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "all";
  const sort = (searchParams.get("sort") as SortOption) || "recommended";
  const view = (searchParams.get("view") as ViewMode) || "grid";

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "all" && key === "category") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  useEffect(() => {
    getStylists()
      .then(setAllStylists)
      .catch(() => setAllStylists([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...allStylists];

    if (category !== "all") {
      result = result.filter(
        (s) => s.category?.toLowerCase() === category.toLowerCase(),
      );
    }

    switch (sort) {
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "distance":
        result.sort(
          (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
        );
        break;
      case "price":
        result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case "reviews":
        result.sort(
          (a, b) => (b.reviewCount || 0) - (a.reviewCount || 0),
        );
        break;
      default:
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [allStylists, category, sort]);

  const categoryName =
    CATEGORIES.find((c) => c.id === category)?.label || category;

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-8" />
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
              />
            ))}
          </div>
          <SkeletonGrid />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary transition-colors mb-5"
          aria-label="Go back"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary">
              {categoryName === "All"
                ? "Browse Stylists"
                : `${categoryName} Stylists`}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary dark:text-text-dark-secondary mt-1">
              {filtered.length} stylist
              {filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setParam("category", cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-white dark:bg-surface-dark text-text-secondary dark:text-text-dark-secondary border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:text-text-primary dark:hover:text-text-dark-primary"
                }`}
              >
                {Icon && <Icon size={12} />}
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <button
              onClick={() => {
                const el = document.getElementById("sort-dropdown");
                el?.classList.toggle("hidden");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-text-dark-secondary dark:hover:text-text-dark-primary transition-colors"
            >
              <SlidersHorizontal size={13} />
              {SORT_OPTIONS.find((o) => o.value === sort)?.label || "Sort"}
              <ChevronDown
                size={11}
                className="text-gray-400 dark:text-text-dark-muted transition-transform duration-200"
              />
            </button>
            <div
              id="sort-dropdown"
              className="hidden absolute top-full mt-1.5 left-0 z-50 w-48 bg-white dark:bg-surface-dark-secondary rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden"
            >
              <div className="py-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setParam("sort", opt.value);
                      document
                        .getElementById("sort-dropdown")
                        ?.classList.add("hidden");
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors ${
                      opt.value === sort
                        ? "bg-gray-50 text-gray-900 font-semibold dark:bg-surface-dark-tertiary dark:text-text-dark-primary"
                        : "text-gray-600 hover:bg-gray-50 dark:text-text-dark-secondary dark:hover:bg-surface-dark-tertiary"
                    }`}
                  >
                    {opt.label}
                    {opt.value === sort && (
                      <Check
                        size={12}
                        className="text-gray-900 dark:text-text-dark-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-surface-dark-secondary rounded-lg">
            <button
              onClick={() => setParam("view", "grid")}
              className={`p-1.5 rounded-md transition-all ${
                view === "grid"
                  ? "bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-text-dark-primary"
                  : "text-gray-400 hover:text-gray-600 dark:text-text-dark-muted dark:hover:text-text-dark-secondary"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setParam("view", "list")}
              className={`p-1.5 rounded-md transition-all ${
                view === "list"
                  ? "bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-text-dark-primary"
                  : "text-gray-400 hover:text-gray-600 dark:text-text-dark-muted dark:hover:text-text-dark-secondary"
              }`}
              aria-label="List view"
            >
              <LayoutList size={14} />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-surface-dark-secondary flex items-center justify-center mx-auto mb-4">
              <Users
                size={24}
                className="text-gray-300 dark:text-text-dark-muted"
              />
            </div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
              No stylists found
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1 max-w-xs mx-auto">
              {category !== "all"
                ? `No stylists available in ${categoryName} right now. Try another category.`
                : "No stylists are available yet. Check back soon."}
            </p>
            <Button
              onClick={() => navigate("/app")}
              variant="primary"
              size="md"
              className="mt-5"
            >
              Back to Home
              <ArrowRight size={12} />
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((stylist, i) => (
                <motion.div
                  key={stylist.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: i * 0.04, duration: 0.3, layout: { duration: 0.3 } }}
                >
                  <StylistCard
                    stylist={stylist}
                    onBook={() => navigate(`/app/stylist/${stylist.id}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((stylist, i) => (
                <ListCard key={stylist.id} stylist={stylist} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
