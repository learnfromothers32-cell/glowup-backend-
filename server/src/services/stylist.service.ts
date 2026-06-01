import { IService, Service } from '../models/Service';
import { IStylist, Stylist } from '../models/Stylist';

export interface StylistFilters {
  category?: string;
  search?: string;
  isLive?: boolean;
  isVerified?: boolean;
}

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

export const toPublicStylist = (stylist: IStylist, services: IService[] = []) => ({
  id: stylist.id,
  name: stylist.name,
  bio: stylist.bio,
  category: stylist.category,
  location: stylist.location,
  rating: stylist.rating,
  reviewCount: stylist.reviewCount,
  isLive: stylist.isLive,
  isVerified: stylist.isVerified,
  createdAt: stylist.createdAt,
  image: stylist.image,
  services: services.map(toStylistServiceItem),
  price: stylist.price,
  priceRange: stylist.priceRange,
  portfolioImages: stylist.portfolioImages,
  beforeAfter: stylist.beforeAfter,
  queuePosition: stylist.queuePosition,
  estimatedWaitMinutes: stylist.estimatedWaitMinutes
});

export const buildStylistFilter = (filters: StylistFilters) => {
  const query: Record<string, unknown> = {};

  if (filters.category) {
    query.category = new RegExp(`^${filters.category}$`, 'i');
  }

  if (typeof filters.isLive === 'boolean') {
    query.isLive = filters.isLive;
  }

  if (typeof filters.isVerified === 'boolean') {
    query.isVerified = filters.isVerified;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  return query;
};

export const getStylistsWithServices = async (filters: StylistFilters) => {
  const stylists = await Stylist.find(buildStylistFilter(filters)).sort({
    isLive: -1,
    isVerified: -1,
    rating: -1,
    createdAt: -1
  });

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

  return stylists.map((stylist) =>
    toPublicStylist(stylist, servicesByStylist.get(String(stylist._id)) || [])
  );
};
