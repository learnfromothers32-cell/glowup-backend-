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
  isVerified: boolean;
  phone?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  createdAt: string;

  image?: string;
  services?: StylistService[];

  // Optional fields used in filtering / detail
  price?: string;
  distance?: string;
  priceRange?: string;
  portfolioImages?: Array<{ url: string; type: 'image' | 'video' }>;
  beforeAfter?: Array<{
    _id?: string;
    before: string;
    after: string;
    caption?: string;
    service?: string;
    mediaType?: 'image' | 'video';
    likes?: number;
    views?: number;
    createdAt?: string;
  }>;
  reviews?: StylistReview[];

  // Social fields
  followerCount?: number;
  totalLikes?: number;
  totalViews?: number;
  isFollowing?: boolean;

  // Quick‑action fields (optional)
  queuePosition?: number;
  estimatedWaitMinutes?: number;
}
