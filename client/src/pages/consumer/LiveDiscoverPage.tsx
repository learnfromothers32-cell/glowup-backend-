import { useState, useRef, useCallback, useEffect } from "react";
import { Search, Radio, TrendingUp, Clock, Flame, ArrowRight, Sparkles } from "lucide-react";
import { useLiveSessions, useFeaturedSessions } from "../../domain/live/live.hooks";
import { DiscoverCard } from "../../features/live/components/DiscoverCard";
import { DiscoverSkeleton } from "../../features/live/components/LiveSkeleton";
import { LiveBadge } from "../../features/live/components/LiveBadge";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";

const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "Hair Tutorial", label: "Hair Tutorial", icon: null },
  { id: "Styling Tips", label: "Styling Tips", icon: null },
  { id: "Live Q&A", label: "Live Q&A", icon: null },
  { id: "Product Review", label: "Product Review", icon: null },
  { id: "Behind the Scenes", label: "BTS", icon: null },
];

const SORT_OPTIONS = [
  { id: "trending" as const, label: "Trending", icon: TrendingUp },
  { id: "popular" as const, label: "Popular", icon: Flame },
  { id: "newest" as const, label: "Newest", icon: Clock },
];

export default function LiveDiscoverPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"trending" | "newest" | "popular">("trending");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categoryFilter = activeCategory === "all" ? undefined : activeCategory;

  const { data: sessionsData, isLoading, error } = useLiveSessions({
    category: categoryFilter,
    sort: sortBy,
    limit: 24,
  });

  const { data: featuredData, isLoading: featuredLoading } = useFeaturedSessions(6);

  const sessions = sessionsData?.sessions ?? [];
  const featured = featuredData?.sessions ?? [];

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (typeof s.stylistId === "object" && s.stylistId.name?.toLowerCase().includes(q)) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  const liveSessions = filteredSessions.filter((s) => s.status === "live");
  const scheduledSessions = filteredSessions.filter((s) => s.status === "scheduled");

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero section */}
      <div className="relative bg-gradient-to-br from-brand-600 via-purple-600 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Radio size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold">Live Now</h1>
              <p className="text-sm text-white/70 mt-0.5">
                Watch, learn, and book with your favorite stylists
              </p>
            </div>
          </div>

          {/* Live counter */}
          {liveSessions.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mt-4">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              {liveSessions.length} stylist{liveSessions.length !== 1 ? "s" : ""} live now
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stylists, services, or topics..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide mb-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                  activeCategory === cat.id
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
                )}
              >
                {Icon && <Icon size={12} />}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sort + View count */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                    sortBy === opt.id
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700",
                  )}
                >
                  <Icon size={10} />
                  {opt.label}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-gray-400">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Featured section */}
        {featured.length > 0 && !searchQuery && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles size={18} className="text-brand-500" />
                Featured
              </h2>
              <LiveBadge size="sm" />
            </div>
            {featuredLoading ? (
              <DiscoverSkeleton />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                {featured.map((session) => (
                  <DiscoverCard key={session._id} session={session} variant="featured" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Live Now section */}
        {liveSessions.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Live Now
              </h2>
              <span className="text-xs text-gray-400">{liveSessions.length} live</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {liveSessions.map((session) => (
                <DiscoverCard key={session._id} session={session} />
              ))}
            </div>
          </section>
        )}

        {/* Scheduled section */}
        {scheduledSessions.length > 0 && !searchQuery && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                Upcoming
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {scheduledSessions.map((session) => (
                <DiscoverCard key={session._id} session={session} />
              ))}
            </div>
          </section>
        )}

        {/* All Sessions */}
        <section className="mb-12">
          {!searchQuery && (liveSessions.length > 0 || scheduledSessions.length > 0) && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">
                {activeCategory === "all" ? "All Sessions" : activeCategory}
              </h2>
            </div>
          )}
          {isLoading ? (
            <DiscoverSkeleton />
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mx-auto mb-4 flex items-center justify-center">
                <Radio size={24} className="text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Failed to load sessions
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Please check your connection and try again
              </p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                <Radio size={32} className="text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                No live sessions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? "No sessions match your search. Try different keywords."
                  : "Check back soon — stylists go live every day!"}
              </p>
              {searchQuery && (
                <Button variant="secondary" size="sm" className="mt-4" onClick={handleClearSearch}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSessions.map((session) => (
                <DiscoverCard key={session._id} session={session} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
