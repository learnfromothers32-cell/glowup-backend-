import { IService, Service } from '../models/Service';
import { IStylist, Stylist } from '../models/Stylist';

export interface StylistFilters {
  category?: string;
  search?: string;
  isVerified?: boolean;
  area?: string;
}

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  recommended: { isVerified: -1, rating: -1, createdAt: -1, _id: 1 },
  rating: { rating: -1, isVerified: -1, createdAt: -1, _id: 1 },
  price: { price: 1, isVerified: -1, rating: -1, createdAt: -1, _id: 1 },
  reviews: { reviewCount: -1, isVerified: -1, createdAt: -1, _id: 1 },
};

const formatPrice = (price: number) => `$${price}`;
const formatDuration = (duration: number) => `${duration} min`;

export const toPublicService = (service: IService) => ({
  id: service.id,
  stylistId: String(service.stylistId),
  name: service.name,
  category: service.category,
  price: service.price,
  duration: service.duration,
  isActive: service.isActive,
  popular: service.popular,
  createdAt: service.createdAt,
  // Fields the current stylist UI can already render.
  priceLabel: formatPrice(service.price),
  durationLabel: formatDuration(service.duration)
});

export const toStylistServiceItem = (service: IService) => ({
  _id: service.id,
  id: service.id,
  name: service.name,
  price: formatPrice(service.price),
  duration: formatDuration(service.duration),
  category: service.category,
  popular: service.popular
});

const normalizePortfolioImages = (images: unknown[]): Array<{ url: string; type: 'image' | 'video' }> =>
  (images || []).map((item: any) =>
    typeof item === 'string' ? { url: item, type: 'image' as const } : item
  );

export const toPublicStylist = (stylist: IStylist, services: IService[] = []) => ({
  id: stylist.id,
  name: stylist.name,
  bio: stylist.bio,
  phone: stylist.phone,
  instagram: stylist.instagram,
  twitter: stylist.twitter,
  tiktok: stylist.tiktok,
  website: stylist.website,
  category: stylist.category,
  location: stylist.location,
  rating: stylist.rating,
  reviewCount: stylist.reviewCount,
  isVerified: stylist.isVerified,
  createdAt: stylist.createdAt,
  image: stylist.image,
  services: services.map(toStylistServiceItem),
  price: stylist.price,
  priceRange: stylist.priceRange,
  followerCount: stylist.followerCount || 0,
  portfolioImages: normalizePortfolioImages(stylist.portfolioImages as unknown[]),
  beforeAfter: stylist.beforeAfter,
  queuePosition: stylist.queuePosition,
  estimatedWaitMinutes: stylist.estimatedWaitMinutes,
  distance: (stylist as any).distance,
  favoriteCount: 0
});

export const buildStylistFilter = (filters: StylistFilters) => {
  const query: Record<string, unknown> = {};

  if (filters.category) {
    query.category = new RegExp(`^${filters.category}$`, 'i');
  }

  if (typeof filters.isVerified === 'boolean') {
    query.isVerified = filters.isVerified;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.area) {
    query['location.area'] = filters.area;
  }

  return query;
};

export const getStylistsWithServices = async (filters: StylistFilters, page = 1, limit = 50, sort?: string) => {
  const query = buildStylistFilter(filters);

  const total = await Stylist.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  const sortOrder = SORT_MAP[sort ?? 'recommended'] ?? SORT_MAP.recommended;

  const stylists = await Stylist.find(query).sort(sortOrder).skip(skip).limit(limit);

  const stylistIds = stylists.map((stylist) => stylist._id);
  const services = await Service.find({
    stylistId: { $in: stylistIds },
    isActive: true
  }).sort({ popular: -1, name: 1 });

  const servicesByStylist = new Map<string, IService[]>();

  services.forEach((service) => {
    const key = String(service.stylistId);
    servicesByStylist.set(key, [...(servicesByStylist.get(key) || []), service]);
  });

  return {
    stylists: stylists.map((stylist) =>
      toPublicStylist(stylist, servicesByStylist.get(String(stylist._id)) || [])
    ),
    total,
    page,
    totalPages
  };
};
