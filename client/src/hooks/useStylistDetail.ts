import { useEffect, useState } from "react";
import { getStylistById } from "../api/stylists";
import api from "../api/axios";

export function useStylistDetail(id?: string) {
  const [stylist, setStylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let alive = true;

    const fetchDetail = async () => {
      try {
        const found = await getStylistById(id);
        if (!alive) return;

        // Fetch real reviews
        const reviewsRes = await api.get(`/reviews/stylist/${id}`);
        const reviews = reviewsRes.data.data.reviews;

        setStylist({
          ...found,
          reviews: reviews,
        });

        setLoading(false);
      } catch (err) {
        if (alive) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      alive = false;
    };
  }, [id]);

  return { stylist, setStylist, loading };
}
