import { useState, useEffect, useCallback } from "react";
import type { Stylist } from "@/domain/stylist/stylist.types";
import * as favoritesApi from "../api/favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await favoritesApi.getFavorites();
        setFavorites(data || []);
      } catch {
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addFavorite = useCallback(async (stylist: Stylist) => {
    try {
      await favoritesApi.addFavorite(stylist.id);
      setFavorites(prev => prev.some(s => s.id === stylist.id) ? prev : [...prev, stylist]);
    } catch {}
  }, []);

  const removeFavorite = useCallback(async (stylistId: string) => {
    try {
      await favoritesApi.removeFavorite(stylistId);
      setFavorites(prev => prev.filter(s => s.id !== stylistId));
    } catch {}
  }, []);

  const toggleFavorite = useCallback(async (stylist: Stylist) => {
    if (favorites.some(s => s.id === stylist.id)) {
      await removeFavorite(stylist.id);
    } else {
      await addFavorite(stylist);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((stylistId: string) => {
    return favorites.some(s => s.id === stylistId);
  }, [favorites]);

  return { favorites, loading, addFavorite, removeFavorite, toggleFavorite, isFavorite };
}
