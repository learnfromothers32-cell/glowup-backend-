import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { User } from '../models/User';
import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { TrendingEngagement } from '../models/TrendingEngagement';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { cloudinary, isCloudinaryConfigured, uploadToCloudinary } from '../config/cloudinary';
import logger from '../utils/logger';
import {
  getStylistsWithServices,
  toPublicService,
  toPublicStylist
} from '../services/stylist.service';
import { getIO } from '../socket';

const parseBoolean = (value: unknown) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export const getMyStylistProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });

  if (!stylist) {
    throw new ApiError(404, 'Stylist profile not found');
  }

  const services = await Service.find({
    stylistId: stylist.id,
    isActive: true
  }).sort({ popular: -1, name: 1 });

  return sendSuccess(res, { stylist: toPublicStylist(stylist, services) });
});

const VALID_SORTS = new Set(['recommended', 'rating', 'price', 'reviews']);

export const getStylists = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

  const sort = typeof req.query.sort === 'string' && VALID_SORTS.has(req.query.sort)
    ? req.query.sort
    : undefined;

  const result = await getStylistsWithServices({
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    isVerified: parseBoolean(req.query.isVerified),
    area: typeof req.query.area === 'string' ? req.query.area : undefined,
  }, page, limit, sort);

  let favs: string[] = [];
  if (req.user?.id) {
    const user = await User.findById(req.user.id).lean();
    favs = (user?.favorites || []).map((f: any) => f.toString());
  }

  const stylists = result.stylists.map((s) => ({
    ...s,
    isFollowing: favs.includes(s.id),
  }));

  res.set('Cache-Control', 'public, max-age=30');
  return sendSuccess(res, {
    stylists,
    pagination: {
      page: result.page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
});

export const getStylistById = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findById(req.params.id);

  if (!stylist) {
    throw new ApiError(404, 'Stylist not found');
  }

  const services = await Service.find({
    stylistId: stylist.id,
    isActive: true
  }).sort({ popular: -1, name: 1 });

  const result = toPublicStylist(stylist, services) as Record<string, unknown>;

  const baItems = (stylist as any).beforeAfter || [];
  const transformationIds: string[] = baItems.map((item: any, i: number) =>
    item._id ? `${stylist.id}_${item._id}` : `${stylist.id}_${i}`
  );

  if (transformationIds.length > 0) {
    const engagements = await TrendingEngagement.find({
      transformationId: { $in: transformationIds }
    }).lean();

    const engagementMap = new Map(
      engagements.map((e: any) => [e.transformationId, e])
    );

    let totalLikes = 0;
    let totalViews = 0;

    const enrichedBA = baItems.map((item: any, i: number) => {
      const tid = transformationIds[i];
      const eng = engagementMap.get(tid);
      const likes = eng?.likes || 0;
      const views = eng?.views || 0;
      totalLikes += likes;
      totalViews += views;
      return {
        ...item.toObject ? item.toObject() : item,
        likes,
        views,
      };
    });

    result.beforeAfter = enrichedBA;
    result.totalLikes = totalLikes;
    result.totalViews = totalViews;
  }

  if (req.user?.id) {
    const user = await User.findById(req.user.id).lean();
    const favs: string[] = (user?.favorites || []).map((f: any) => f.toString());
    result.isFollowing = favs.includes(stylist.id);
  }

  return sendSuccess(res, { stylist: result });
});

export const getStylistServices = asyncHandler(
  async (req: Request, res: Response) => {
    const stylist = await Stylist.findById(req.params.id);

    if (!stylist) {
      throw new ApiError(404, 'Stylist not found');
    }

    const services = await Service.find({
      stylistId: stylist.id,
      isActive: true
    }).sort({ popular: -1, name: 1 });

    return sendSuccess(res, { services: services.map(toPublicService) });
  }
);

export const saveOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { profile, services, schedule } = req.body;

  const stylistData: Record<string, any> = {
    userId,
    name: user.name,
    bio: profile?.bio?.trim() || 'Experienced stylist',
    category: 'General',
    location: {
      area: profile?.location?.area || profile?.location || '',
      lat: profile?.location?.lat ?? 0,
      lng: profile?.location?.lng ?? 0,
    },
    portfolioImages: [],
    beforeAfter: []
  };

  if (profile?.phone) stylistData.phone = profile.phone;

  const stylist = await Stylist.findOneAndUpdate(
    { userId },
    { $set: stylistData },
    { upsert: true, new: true }
  );

  if (services && Array.isArray(services)) {
    await Service.deleteMany({ stylistId: stylist.id });

    const serviceDocs = services
      .filter((s: any) => s.name?.trim() && s.price?.trim())
      .map((s: any) => ({
        stylistId: stylist.id,
        name: s.name.trim(),
        category: 'General',
        price: parseFloat(s.price) || 0,
        duration: parseInt(s.duration) || 30,
        isActive: true
      }));

    if (serviceDocs.length > 0) {
      await Service.insertMany(serviceDocs);
      const prices = serviceDocs.map((s: any) => s.price).filter((p: number) => p > 0);
      if (prices.length > 0) {
        await Stylist.findByIdAndUpdate(stylist.id, { price: String(Math.min(...prices)) });
      }
    }
  }

  const savedServices = await Service.find({ stylistId: stylist.id, isActive: true });
  return sendSuccess(res, { stylist: toPublicStylist(stylist, savedServices) }, 'Onboarding complete');
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { name, bio, category, location, phone, image, instagram, twitter, tiktok, website } = req.body;

  const stylist = await Stylist.findOne({ userId });
  if (!stylist) {
    throw new ApiError(404, 'Stylist profile not found');
  }

  if (name !== undefined) stylist.name = name;
  if (bio !== undefined) stylist.bio = bio;
  if (category !== undefined) stylist.category = category;
  if (phone !== undefined) stylist.phone = phone;
  if (image !== undefined) stylist.image = image;
  if (instagram !== undefined) stylist.instagram = instagram;
  if (twitter !== undefined) stylist.twitter = twitter;
  if (tiktok !== undefined) stylist.tiktok = tiktok;
  if (website !== undefined) stylist.website = website;
  if (location !== undefined) {
    const oldArea = stylist.location.area;
    const oldLat = stylist.location.lat;
    const oldLng = stylist.location.lng;

    const newLat = location.lat ?? stylist.location.lat;
    const newLng = location.lng ?? stylist.location.lng;

    if (newLat !== undefined && (typeof newLat !== 'number' || newLat < -90 || newLat > 90)) {
      throw new ApiError(400, 'Invalid latitude value');
    }
    if (newLng !== undefined && (typeof newLng !== 'number' || newLng < -180 || newLng > 180)) {
      throw new ApiError(400, 'Invalid longitude value');
    }

    stylist.location = {
      area: location.area || stylist.location.area,
      lat: newLat,
      lng: newLng
    };

    if (oldArea !== location.area || oldLat !== location.lat || oldLng !== location.lng) {
      const payload = {
        stylistId: stylist.id,
        location: stylist.location,
      };
      try {
        getIO().emit('stylist:location-updated', payload);
      } catch { }
    }
  }

  await stylist.save();

  const services = await Service.find({ stylistId: stylist.id, isActive: true });
  return sendSuccess(res, { stylist: toPublicStylist(stylist, services) }, 'Profile updated');
});

export const addMyService = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { name, category, price, duration } = req.body;
  if (!name || price === undefined || !duration) {
    throw new ApiError(400, 'Service name, price, and duration are required');
  }

  const service = await Service.create({
    stylistId: stylist.id,
    name,
    category: category || 'General',
    price,
    duration,
    isActive: true
  });

  return sendSuccess(res, { service: toPublicService(service) }, 'Service added', 201);
});

export const updateMyService = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const service = await Service.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!service) throw new ApiError(404, 'Service not found');

  const { name, category, price, duration, isActive } = req.body;
  if (name !== undefined) service.name = name;
  if (category !== undefined) service.category = category;
  if (price !== undefined) service.price = price;
  if (duration !== undefined) service.duration = duration;
  if (isActive !== undefined) service.isActive = isActive;

  await service.save();
  return sendSuccess(res, { service: toPublicService(service) }, 'Service updated');
});

export const deleteMyService = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const service = await Service.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!service) throw new ApiError(404, 'Service not found');

  await service.deleteOne();
  return sendSuccess(res, null, 'Service deleted');
});

export const uploadPortfolioImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  if (!stylist.bio?.trim()) {
    stylist.bio = 'Professional stylist';
  }

  let url: string;

  if (isCloudinaryConfigured) {
    url = await uploadToCloudinary(req.file.path, 'portfolio', {
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
    });
  } else {
    url = `/uploads/${req.file.filename}`;
  }

  const mediaType = req.body.type === 'video' ? 'video' : 'image';

  stylist.portfolioImages.push({ url, type: mediaType });
  await stylist.save();

  return sendSuccess(res, { portfolioImages: stylist.portfolioImages }, 'Media uploaded');
});

export const uploadProfileImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  let imageUrl: string;

  if (isCloudinaryConfigured) {
    imageUrl = await uploadToCloudinary(req.file.path, 'profiles', {
      transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }]
    });
  } else {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  stylist.image = imageUrl;
  await stylist.save();

  await User.findByIdAndUpdate(userId, { avatar: imageUrl });

  return sendSuccess(res, { imageUrl }, 'Profile image uploaded');
});

export const uploadStylistVideo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  if (!req.file) {
    throw new ApiError(400, 'No video file provided');
  }

  let url: string;

  if (isCloudinaryConfigured) {
    url = await uploadToCloudinary(req.file.path, 'stylist-videos', {
      resource_type: 'video',
      chunk_size: 6000000,
      eager: [{ width: 720, height: 720, crop: 'limit', quality: 'auto' }],
      eager_async: true,
    });
  } else {
    url = `/uploads/${req.file.filename}`;
  }

  stylist.portfolioImages.push({ url, type: 'video' });
  await stylist.save();

  return sendSuccess(res, { portfolioImages: stylist.portfolioImages }, 'Video uploaded');
});

export const savePortfolioMedia = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    throw new ApiError(400, 'No files provided');
  }

  const types: string[] = req.body.types ? (Array.isArray(req.body.types) ? req.body.types : JSON.parse(req.body.types)) : [];

  const uploadPromises = files.map(async (file, i) => {
    const mediaType = types[i] === 'video' ? 'video' : 'image';
    let url: string;

    if (isCloudinaryConfigured) {
      if (mediaType === 'video') {
        url = await uploadToCloudinary(file.path, 'stylist-videos', {
          resource_type: 'video',
          chunk_size: 6000000,
        });
      } else {
        url = await uploadToCloudinary(file.path, 'portfolio', {
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
        });
      }
    } else {
      url = `/uploads/${file.filename}`;
    }

    return { url, type: mediaType as 'image' | 'video' };
  });

  const items = await Promise.all(uploadPromises);
  stylist.portfolioImages.push(...items);
  await stylist.save();

  return sendSuccess(res, { portfolioImages: stylist.portfolioImages }, 'Media saved');
});

export const removePortfolioImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { url } = req.body;
  if (!url) throw new ApiError(400, 'URL is required');

  const removed = stylist.portfolioImages.find((item) => item.url === url);
  stylist.portfolioImages = stylist.portfolioImages.filter((item) => item.url !== url);

  const mediaUrl = removed?.url || url;

  // Try to remove from Cloudinary if it's a Cloudinary URL
  if (isCloudinaryConfigured && mediaUrl.includes('cloudinary.com')) {
    const publicId = mediaUrl.split('/').pop()?.split('.')[0];
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch { /* ignore */ }
    }
  } else {
    // Remove file from disk (local fallback)
    const filename = path.basename(mediaUrl);
    const filepath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  await stylist.save();
  return sendSuccess(res, { portfolioImages: stylist.portfolioImages }, 'Media removed');
});

export const addBeforeAfter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const file = req.file;
  if (!file) {
    throw new ApiError(400, 'An image is required');
  }

  const uploadFile = async (f: Express.Multer.File, folder: string): Promise<string> => {
    if (isCloudinaryConfigured) {
      try {
        const isVideo = f.mimetype.startsWith('video/');
        return await uploadToCloudinary(f.path, folder, isVideo ? {
          resource_type: 'video',
          chunk_size: 6000000,
        } : {
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
        });
      } catch (err) {
        logger.warn('Cloudinary upload failed, falling back to local storage', { error: (err as Error).message });
      }
    }
    return `/uploads/${f.filename}`;
  };

  const imageUrl = await uploadFile(file, 'before-after');

  const { caption, service, mediaType: bodyMediaType } = req.body;
  const sanitizedCaption = caption?.toString().trim().slice(0, 300) || undefined;
  const sanitizedService = service?.toString().trim().slice(0, 100) || undefined;
  const mediaType: 'image' | 'video' = bodyMediaType === 'video' || bodyMediaType === 'image'
    ? bodyMediaType
    : file.mimetype.startsWith('video/') ? 'video' : 'image';

  stylist.beforeAfter.push({
    after: imageUrl,
    caption: sanitizedCaption,
    service: sanitizedService,
    mediaType,
    createdAt: new Date(),
  });

  await stylist.save();

  return sendSuccess(res, { beforeAfter: stylist.beforeAfter }, 'Transformation added', 201);
});

export const removeBeforeAfter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const id = req.params.id;
  const item = (stylist.beforeAfter as any).id(id);
  if (!item) {
    throw new ApiError(400, 'Invalid transformation id');
  }

  // Clean up Cloudinary images/videos if configured
  const cleanupUrls = [item.before, item.after].filter(Boolean);
  if (isCloudinaryConfigured) {
    for (const url of cleanupUrls) {
      try {
        const segments = url.split('/');
        const videoIdx = segments.indexOf('video');
        const publicId = segments.slice(segments.indexOf('before-after')).join('/').split('.')[0];
        if (publicId) {
          const options = videoIdx >= 0 && videoIdx < segments.indexOf('upload') ? { resource_type: 'video' as const } : {};
          await cloudinary.uploader.destroy(publicId, options);
        }
      } catch {
        // cleanup failure is non-fatal
      }
    }
  }

  item.deleteOne();
  await stylist.save();

  return sendSuccess(res, { beforeAfter: stylist.beforeAfter }, 'Transformation removed');
});

export const getMyTrendingStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const transformationIds = (stylist.beforeAfter || []).map((item: any, i: number) =>
    item._id ? `${stylist._id}_${item._id}` : `${stylist._id}_${i}`,
  );

  const engagements = await TrendingEngagement.find({
    transformationId: { $in: transformationIds },
  }).lean();

  return sendSuccess(res, { engagements });
});
