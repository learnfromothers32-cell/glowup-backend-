// src/domain/stylist/stylist.types.ts

export type StylistService =
  | string
  | {
      _id?: string;
      name: string;
      price: string;
      duration?: string;
      category?: string;
      popular?: boolean;
    };

export type StylistReview = {
  user: string;
  rating: number;
  comment: string;
  date: string;
};

/* ─────────────────────────────────────────────
   Core Stylist type
───────────────────────────────────────────── */
export interface Stylist {
  id: string;
  name: string;
  bio: string;
  category: string;
  location: {
    area: string;
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  isLive: boolean;
  isVerified: boolean;
  createdAt: string;

  image?: string;
  services?: StylistService[];

  // Optional fields used in filtering / detail
  price?: string;
  distance?: string;
  priceRange?: string;
  portfolioImages?: string[];
  beforeAfter?: Array<{
    before: string;
    after: string;
    caption?: string;
    service?: string;
  }>;
  reviews?: StylistReview[];

  // Quick‑action fields (optional)
  queuePosition?: number;
  estimatedWaitMinutes?: number;
}
