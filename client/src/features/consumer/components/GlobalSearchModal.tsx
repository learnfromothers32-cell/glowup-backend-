import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, User, Scissors, Sparkles, Flame } from "lucide-react";
import { getStylists } from "../../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";

interface SearchResult {
  type: "stylist" | "service" | "category" | "trending";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link: string;
}

// Categories list (same as in IntentBar)
const CATEGORIES = ["Hair", "Barber", "Braids", "Nails", "Skin", "Lashes"];

export default function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load stylists when modal opens
  useEffect(() => {
    if (isOpen) {
      getStylists().then(setStylists);
      inputRef.current?.focus();
      // Reset search when modal opens
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      const term = query.toLowerCase().trim();
      const newResults: SearchResult[] = [];

      // 1. Search stylists (name, category, location)
      stylists.forEach((stylist) => {
        if (
          stylist.name.toLowerCase().includes(term) ||
          stylist.category.toLowerCase().includes(term) ||
          stylist.location.toLowerCase().includes(term)
        ) {
          newResults.push({
            type: "stylist",
            id: stylist.id,
            title: stylist.name,
            subtitle: `${stylist.category} • ${getLocationString(stylist.location)}`,
            image: stylist.image,
            link: `/app/stylist/${stylist.id}`,
          });
        }
      });

      // 2. Search services (unique)
      const seenServices = new Set<string>();
      stylists.forEach((stylist) => {
        stylist.services.forEach((service) => {
          if (
            service.name.toLowerCase().includes(term) &&
            !seenServices.has(service.name)
          ) {
            seenServices.add(service.name);
            newResults.push({
              type: "service",
              id: service.name,
              title: service.name,
              subtitle: `Starting at ${service.price} • ${service.duration}`,
              link: `/app/search?service=${encodeURIComponent(service.name)}`,
            });
          }
        });
      });

      // 3. Search categories
      CATEGORIES.forEach((cat) => {
        if (cat.toLowerCase().includes(term)) {
          newResults.push({
            type: "category",
            id: cat,
            title: cat,
            subtitle: `Explore ${cat} stylists`,
            link: `/app/${cat.toLowerCase()}`,
          });
        }
      });

      // 4. Search before/after captions
      stylists.forEach((stylist) => {
        stylist.beforeAfter?.forEach((ba, idx) => {
          if (ba.caption?.toLowerCase().includes(term)) {
            newResults.push({
              type: "trending",
              id: `${stylist.id}_${idx}`,
              title: ba.caption || "Transformation",
              subtitle: `By ${stylist.name}`,
              image: ba.after,
              link: `/app/trending`,
            });
          }
        });
      });

      // Limit results per type (optional)
      setResults(newResults.slice(0, 20));
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, stylists]);

  const handleResultClick = (link: string) => {
    onClose();
    navigate(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
        {/* Search header */}
        <div className="flex items-center border-b border-gray-100 p-3">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stylists, services, categories..."
            className="flex-1 px-3 py-2 text-lg outline-none"
          />
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[70vh] overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="text-center py-8 text-gray-400">Searching...</div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No results for "{query}"
            </div>
          )}
          {!loading && query && results.length > 0 && (
            <>
              {/* Group by type */}
              {["stylist", "service", "category", "trending"].map((type) => {
                const filtered = results.filter((r) => r.type === type);
                if (filtered.length === 0) return null;
                const icons = {
                  stylist: User,
                  service: Scissors,
                  category: Sparkles,
                  trending: Flame,
                };
                const Icon = icons[type as keyof typeof icons];
                const labels = {
                  stylist: "Stylists",
                  service: "Services",
                  category: "Categories",
                  trending: "Trending",
                };
                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {labels[type as keyof typeof labels]}
                    </h3>
                    <div className="space-y-2">
                      {filtered.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => handleResultClick(r.link)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition"
                        >
                          {r.image ? (
                            <img
                              src={r.image}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {r.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {r.subtitle}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
