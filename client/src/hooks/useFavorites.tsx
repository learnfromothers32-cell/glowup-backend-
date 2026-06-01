import { useState, useEffect } from "react";
import type { Stylist } from "@/domain/stylist/stylist.types";

const STORAGE_KEY = "glowup_favorites";

function loadInitialFavorites(): Stylist[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Stylist[]>(loadInitialFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (stylist: Stylist) => {
    setFavorites((prev) => {
      if (prev.some((s) => s.id === stylist.id)) return prev;
      return [...prev, stylist];
    });
  };

  const removeFavorite = (stylistId: string) => {
    setFavorites((prev) => prev.filter((s) => s.id !== stylistId));
  };

  const toggleFavorite = (stylist: Stylist) => {
    if (favorites.some((s) => s.id === stylist.id)) {
      removeFavorite(stylist.id);
    } else {
      addFavorite(stylist);
    }
  };

  const isFavorite = (stylistId: string) =>
    favorites.some((s) => s.id === stylistId);

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite };
}
