// src/domain/stylist/stylist.adapter.ts

import type { Stylist } from "@/domain/stylist/stylist.types";

export function mapToUIStylist(stylist: any): Stylist {
  const location =
    typeof stylist.location === "object" && stylist.location !== null
      ? {
          area: String(stylist.location.area || ""),
          lat: Number(stylist.location.lat || 0),
          lng: Number(stylist.location.lng || 0),
        }
      : { area: String(stylist.location || ""), lat: 0, lng: 0 };

  const reviews = Array.isArray(stylist.reviews)
    ? stylist.reviews.map((review: any) => ({
        user: String(review.user || "Customer"),
        rating: Number(review.rating || 0),
        comment: String(review.comment || ""),
        date: String(
          review.date || review.createdAt || new Date().toISOString(),
        ),
      }))
    : [];

  return {
    id: String(stylist.id || ""),
    name: String(stylist.name || ""),
    bio: String(stylist.bio || ""),
    category: String(stylist.category || ""),
    location,
    rating: Number(stylist.rating || 0),
    reviewCount:
      typeof stylist.reviewCount === "number"
        ? stylist.reviewCount
        : reviews.length,
    isLive: Boolean(stylist.isLive),
    isVerified: Boolean(stylist.isVerified),
    createdAt: String(stylist.createdAt || new Date().toISOString()),

    image: stylist.image,
    services: stylist.services,
    price: stylist.price,
    distance: stylist.distance,
    priceRange: stylist.priceRange,
    portfolioImages: stylist.portfolioImages,
    beforeAfter: stylist.beforeAfter || [],
    reviews,
    queuePosition: stylist.queuePosition,
    estimatedWaitMinutes: stylist.estimatedWaitMinutes,
  };
}
