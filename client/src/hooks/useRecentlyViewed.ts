import { useState } from "react";
import type { Stylist } from "@/domain/stylist/stylist.types";

const STORAGE_KEY = "glowup_recent_stylists";
const MAX_RECENT = 5;

// Helper to load from localStorage (runs only once during initial render)
function loadInitialRecentlyViewed(): Stylist[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse recent stylists", e);
    return [];
  }
}

export function useRecentlyViewed() {
  // Lazy initializer – runs only once
  const [recent, setRecent] = useState<Stylist[]>(loadInitialRecentlyViewed);

  const addToRecentlyViewed = (stylist: Stylist) => {
    setRecent((prev) => {
      // Remove if already exists
      const filtered = prev.filter((s) => s.id !== stylist.id);
      // Add to front, keep only MAX_RECENT
      const updated = [stylist, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { recent, addToRecentlyViewed };
}
