const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const SEARCH_DELAY = 400;

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

export async function searchLocation(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: "7",
    addressdetails: "1",
    "accept-language": "en",
  });

  const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
    headers: { "User-Agent": "GlowUpOS/1.0 (beauty-marketplace-app)" },
  });

  if (!res.ok) throw new Error("Search failed");

  const data = await res.json();

  return data.map((item: any) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    area: extractArea(item.address || {}) || item.name || query,
    type: item.type || "unknown",
  }));
}
