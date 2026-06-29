const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

export interface SearchResult {
  displayName: string;
  lat: number;
  lng: number;
  area: string;
  type: string;
}

function extractArea(address: Record<string, string>): string {
  return (
    address.suburb ||
    address.neighbourhood ||
    address.town ||
    address.city ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state ||
    ""
  );
}

// Simple in-memory cache for search results
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Rate limiter: Nominatim requires max 1 req/s
let lastRequestTime = 0;
async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
}

const controllerMap = new Map<string, AbortController>();

export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.trim().length < 2) return [];

  // Cancel previous request for same query
  const existing = controllerMap.get(query);
  if (existing) existing.abort();

  // Check cache
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }

  const controller = new AbortController();
  controllerMap.set(query, controller);

  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: "7",
    addressdetails: "1",
    "accept-language": "en",
  });

  await rateLimit();

  try {
    const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GlowUpOS/1.0 (beauty-marketplace-app)",
        "Referer": typeof window !== "undefined" ? window.location.origin : "",
      },
    });

    if (!res.ok) throw new Error("Search failed");

    const data = await res.json();

    const results = data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      area: extractArea(item.address || {}) || item.name || query,
      type: item.type || "unknown",
    }));

    searchCache.set(query, { results, timestamp: Date.now() });
    return results;
  } catch (err: any) {
    if (err.name === "AbortError") return [];
    throw err;
  } finally {
    if (controllerMap.get(query) === controller) {
      controllerMap.delete(query);
    }
  }
}

export function clearSearchCache() {
  searchCache.clear();
}
