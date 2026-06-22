import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  MapPin,
  ArrowUpDown,
  Zap,
  ChevronDown,
  Check,
  FilterX,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";

// ─── Types ──────────────────────────────────────────────────────────────────
export type Filters = {
  search: string;
  priceMax: number;
  distanceMax: number;
  ratingMin: number;
  liveOnly: boolean;
  sortBy: "rating" | "distance" | "priceAsc" | "priceDesc";
};

interface FilterBarProps {
  onFilterChange: (filters: Filters) => void;
  initialFilters?: Partial<Filters>;
  resultCount?: number;   // 👈 new prop
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS: Filters = {
  search: "",
  priceMax: 500,
  distanceMax: 0,
  ratingMin: 0,
  liveOnly: false,
  sortBy: "rating",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function activeFilterCount(filters: Filters): number {
  return [
    filters.search,
    filters.priceMax < DEFAULT_FILTERS.priceMax,
    filters.distanceMax > 0,
    filters.ratingMin > 0,
    filters.liveOnly,
    filters.sortBy !== DEFAULT_FILTERS.sortBy,
  ].filter(Boolean).length;
}

function isDefault(filters: Filters): boolean {
  return JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
}

// ─── Toggle Switch (unchanged) ───────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0"
    >
      <div
        className={`relative w-10 h-[22px] rounded-full transition-all duration-200 flex-shrink-0 shadow-sm ${
          checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-white dark:bg-surface-dark-secondary shadow transition-all duration-200 ease-out ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </div>
      <span
        className={`text-[13px] font-semibold transition-colors ${
          checked ? "text-text-primary dark:text-text-dark-primary" : "text-text-secondary dark:text-text-dark-secondary"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Chip (unchanged) ────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ease-out select-none
        ${
          selected
            ? "bg-brand-50 text-brand-500 border border-brand-200 dark:bg-brand-950/30 dark:text-brand-400 dark:border-brand-800 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]"
            : "bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"
        }
      `}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {label}
      {selected && <Check size={10} />}
    </button>
  );
}

// ─── Price Slider (unchanged) ────────────────────────────────────────────────
function PriceSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - 0) / (500 - 0)) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
          Max price
        </span>
        <span className="text-[13px] font-bold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">
          ₵{value === 500 ? "500+" : value}
        </span>
      </div>

      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-sm bg-gray-300 dark:bg-gray-600" />
        <div
          className="absolute left-0 h-1 rounded-sm bg-gradient-to-r from-amber-500 to-amber-400/80 dark:from-amber-600 dark:to-amber-500/80 transition-width duration-75"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer m-0"
        />
        <div
          className="absolute w-[18px] h-[18px] rounded-full bg-white dark:bg-surface-dark-secondary border-2 border-amber-500 dark:border-amber-400 shadow-md pointer-events-none transition-all duration-75"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        {[0, 125, 250, 375, "500+"].map((v) => (
          <span key={v} className="text-[9px] font-medium text-text-muted dark:text-text-dark-muted">
            {v === 0 ? "₵0" : `₵${v}`}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Select Pill (unchanged) ─────────────────────────────────────────────────
function SelectPill<T extends string | number>({
  value,
  options,
  onChange,
  icon,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary text-[13px] font-medium whitespace-nowrap shadow-sm hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-all duration-150"
      >
        {icon}
        {current?.label}
        <ChevronDown size={12} className="text-text-muted dark:text-text-dark-muted ml-auto" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-lg dark:shadow-black/40 overflow-hidden min-w-[170px] border border-gray-100 dark:border-gray-700/40">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-left transition-colors duration-100
                ${
                  opt.value === value
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-950/30 dark:text-brand-400 font-bold"
                    : "bg-transparent text-text-primary dark:text-text-dark-primary font-medium"
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
      )}
    </div>
  );
}

// ─── Active Filter Tags (unchanged) ──────────────────────────────────────────
function ActiveTags({
  filters,
  onRemove,
}: {
  filters: Filters;
  onRemove: (key: keyof Filters) => void;
}) {
  const tags = [
    filters.priceMax < 500 && { key: "priceMax" as keyof Filters, label: `Max ₵${filters.priceMax}` },
    filters.distanceMax > 0 && { key: "distanceMax" as keyof Filters, label: `≤ ${filters.distanceMax}km` },
    filters.ratingMin > 0 && { key: "ratingMin" as keyof Filters, label: `${filters.ratingMin}+ ★` },
    filters.liveOnly && { key: "liveOnly" as keyof Filters, label: "Live now" },
    filters.sortBy !== "rating" && { key: "sortBy" as keyof Filters, label: ({
      distance: "Nearest",
      priceAsc: "Price ↑",
      priceDesc: "Price ↓",
      rating: "",
    })[filters.sortBy] },
  ].filter(Boolean) as { key: keyof Filters; label: string }[];

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {tags.map(({ key, label }) => (
        <div
          key={key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-500 dark:bg-brand-950/30 dark:text-brand-400 text-xs font-medium shadow-sm"
        >
          {label}
          <button
            onClick={() => onRemove(key)}
            className="flex items-center justify-center w-4 h-4 rounded-full bg-black/5 dark:bg-white/10 border-none cursor-pointer text-brand-500 dark:text-brand-400 p-0 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
          >
            <X size={9} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FilterBar({
  onFilterChange,
  initialFilters,
  resultCount,       // 👈 accept the new prop
}: FilterBarProps) {
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const updateFilters = useCallback(
    (updates: Partial<Filters>) => {
      const next = { ...filters, ...updates };
      setFilters(next);
      onFilterChange(next);
    },
    [filters, onFilterChange]
  );

  const clearFilters = () => {
    const next = DEFAULT_FILTERS;
    setFilters(next);
    onFilterChange(next);
    setShowAdvanced(false);
  };

  const removeFilter = (key: keyof Filters) => {
    const resets: Partial<Filters> = {
      priceMax: DEFAULT_FILTERS.priceMax,
      distanceMax: DEFAULT_FILTERS.distanceMax,
      ratingMin: DEFAULT_FILTERS.ratingMin,
      liveOnly: DEFAULT_FILTERS.liveOnly,
      sortBy: DEFAULT_FILTERS.sortBy,
      search: DEFAULT_FILTERS.search,
    };
    updateFilters({ [key]: resets[key] });
  };

  const distanceOptions = [
    { value: 0, label: "Any distance" },
    { value: 1, label: "Within 1 km" },
    { value: 3, label: "Within 3 km" },
    { value: 5, label: "Within 5 km" },
    { value: 10, label: "Within 10 km" },
  ];

  const ratingOptions = [
    { value: 0, label: "Any rating" },
    { value: 4, label: "4.0+" },
    { value: 4.5, label: "4.5+" },
    { value: 4.8, label: "4.8+" },
  ];

  const sortOptions = [
    { value: "rating" as const, label: "Top rated" },
    { value: "distance" as const, label: "Nearest" },
    { value: "priceAsc" as const, label: "Price: low to high" },
    { value: "priceDesc" as const, label: "Price: high to low" },
  ];

  // 👇 determine when to show the empty state
  const showEmptyState = resultCount !== undefined && resultCount === 0 && !isDefault(filters);

  return (
    <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/40">
      {/* Search & Filters Row */}
      <div className="flex gap-2 items-center p-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              searchFocused ? "text-brand-500" : "text-text-muted dark:text-text-dark-muted"
            }`}
          />
          <input
            type="text"
            placeholder="Filter by name, service, or area…"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`w-full py-2.5 pl-[42px] pr-10 rounded-full text-sm text-text-primary dark:text-text-dark-primary outline-none transition-all duration-150 bg-gray-50 dark:bg-surface-dark-tertiary border ${
              searchFocused ? "border-brand-500" : "border-transparent"
            }`}
          />
          {filters.search && (
            <button
              onClick={() => updateFilters({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer flex items-center justify-center p-0 text-text-muted dark:text-text-dark-muted hover:text-text-secondary dark:hover:text-text-dark-secondary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-150 shadow-sm
            ${
              showAdvanced
                ? "bg-brand-50 text-brand-500 border border-brand-200 dark:bg-brand-950/30 dark:text-brand-400 dark:border-brand-800"
                : "bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"
            }
          `}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount(filters) > 0 && (
            <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount(filters)}
            </span>
          )}
        </button>

        {!isDefault(filters) && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark-secondary text-text-muted dark:text-text-dark-muted hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors"
            title="Clear all filters"
          >
            <FilterX size={16} />
          </button>
        )}
      </div>

      {/* Quick Filters Row */}
      <div className="flex gap-1.5 px-3 pb-3 overflow-x-auto scrollbar-hide">
        <Chip
          label="Live now"
          selected={filters.liveOnly}
          onClick={() => updateFilters({ liveOnly: !filters.liveOnly })}
          icon={<Zap size={10} />}
        />
        {ratingOptions.slice(1).map((opt) => (
          <Chip
            key={opt.value}
            label={`${opt.label}`}
            selected={filters.ratingMin === opt.value}
            onClick={() =>
              updateFilters({
                ratingMin: filters.ratingMin === opt.value ? 0 : opt.value,
              })
            }
            icon={
              <Star
                size={10}
                fill={filters.ratingMin === opt.value ? "currentColor" : "none"}
              />
            }
          />
        ))}
        {distanceOptions.slice(1).map((opt) => (
          <Chip
            key={opt.value}
            label={`≤ ${opt.value}km`}
            selected={filters.distanceMax === opt.value}
            onClick={() =>
              updateFilters({
                distanceMax: filters.distanceMax === opt.value ? 0 : opt.value,
              })
            }
            icon={<MapPin size={10} />}
          />
        ))}
      </div>

      {/* ── Empty State Banner ──────────────────────────────────────── */}
      {showEmptyState && (
        <div className="px-4 pb-4">
          <div className="flex flex-col items-center text-center py-6 bg-gray-50/50 dark:bg-surface-dark-tertiary/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
            <MapPin size={24} className="text-text-muted dark:text-text-dark-muted mb-2" />
            <p className="text-sm font-semibold text-text-secondary dark:text-text-dark-secondary">
              No stylists match your filter in this area
            </p>
            <p className="text-xs text-text-muted dark:text-text-dark-muted mt-1 max-w-xs">
              Try adjusting your search terms, or move the map to a different location.
            </p>
          </div>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="px-4 pb-5 space-y-6">
          <PriceSlider
            value={filters.priceMax}
            onChange={(v) => updateFilters({ priceMax: v })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted block">
                Distance
              </label>
              <SelectPill
                value={filters.distanceMax}
                options={distanceOptions}
                onChange={(v) => updateFilters({ distanceMax: v as number })}
                icon={<MapPin size={12} />}
              />
            </div>
            <div>
              <label className="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted block">
                Rating
              </label>
              <SelectPill
                value={filters.ratingMin}
                options={ratingOptions}
                onChange={(v) => updateFilters({ ratingMin: v as number })}
                icon={<Star size={12} />}
              />
            </div>
            <div>
              <label className="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted block">
                Sort by
              </label>
              <SelectPill
                value={filters.sortBy}
                options={sortOptions}
                onChange={(v) => updateFilters({ sortBy: v as Filters["sortBy"] })}
                icon={<ArrowUpDown size={12} />}
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="m-0 text-[13px] font-bold text-text-primary dark:text-text-dark-primary">
                  Live availability only
                </p>
                <p className="mt-0.5 text-xs text-text-muted dark:text-text-dark-muted">
                  Show stylists currently accepting walk-ins
                </p>
              </div>
              <Toggle
                checked={filters.liveOnly}
                onChange={(v) => updateFilters({ liveOnly: v })}
                label=""
              />
            </div>
          </div>

          {!isDefault(filters) && (
            <Button
              variant="ghost-gray"
              onClick={clearFilters}
              className="w-full"
            >
              Reset all filters
            </Button>
          )}
        </div>
      )}

      {/* Active Filter Tags */}
      {!isDefault(filters) && !showAdvanced && (
        <div className="px-4 pb-4">
          <ActiveTags filters={filters} onRemove={removeFilter} />
        </div>
      )}
    </div>
  );
}