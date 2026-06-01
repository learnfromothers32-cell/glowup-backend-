// src/services/searchService.ts
import { getStylists } from "../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";

// Global cache (fetch once)
let stylistsCache: Stylist[] | null = null;
let loadingPromise: Promise<Stylist[]> | null = null;

// Load stylists once and cache them
async function loadStylists(): Promise<Stylist[]> {
  if (stylistsCache) return stylistsCache;
  if (loadingPromise) return loadingPromise;
  loadingPromise = getStylists().then((data) => {
    stylistsCache = data;
    loadingPromise = null;
    return data;
  });
  return loadingPromise;
}

// Interface that will be used by the modal – can be swapped later
export interface SearchResult {
  type: "stylist" | "service" | "category" | "trending";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link: string;
}

// Client‑side search (current implementation)
export async function searchLocal(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const term = query.toLowerCase().trim();
  const stylists = await loadStylists();
  const results: SearchResult[] = [];

  // ... (same filtering logic as before, but using cached stylists)
  // I'll keep it short – you already have the filtering code.

  return results;
}

// Future: backend search (same return type)
export async function searchRemote(query: string): Promise<SearchResult[]> {
  // Example: const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  // return res.json();
  // For now, fallback to local search
  return searchLocal(query);
}

// Export the active search function – switch here when backend is ready
export const search = searchLocal;
