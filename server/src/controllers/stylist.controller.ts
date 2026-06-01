import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { User } from '../models/User';
import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import {
  getStylistsWithServices,
  toPublicService,
  toPublicStylist
} from '../services/stylist.service';

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

export const getStylists = asyncHandler(async (req: Request, res: Response) => {
  const stylists = await getStylistsWithServices({
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    isLive: parseBoolean(req.query.isLive),
    isVerified: parseBoolean(req.query.isVerified)
  });

  return sendSuccess(res, { stylists });
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

  return sendSuccess(res, { stylist: toPublicStylist(stylist, services) });
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
    bio: profile?.bio || '',
    category: 'General',
    location: {
      area: profile?.location || '',
      lat: 0,
      lng: 0
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
    }
  }

  const savedServices = await Service.find({ stylistId: stylist.id, isActive: true });
  return sendSuccess(res, { stylist: toPublicStylist(stylist, savedServices) }, 'Onboarding complete');
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { name, bio, category, location, phone, image } = req.body;

  const stylist = await Stylist.findOne({ userId });
  if (!stylist) {
    throw new ApiError(404, 'Stylist profile not found');
  }

  if (name !== undefined) stylist.name = name;
  if (bio !== undefined) stylist.bio = bio;
  if (category !== undefined) stylist.category = category;
  if (phone !== undefined) (stylist as any).phone = phone;
  if (image !== undefined) stylist.image = image;
  if (location !== undefined) {
    stylist.location = {
      area: location.area || stylist.location.area,
      lat: location.lat ?? stylist.location.lat,
      lng: location.lng ?? stylist.location.lng
    };
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

  let imageUrl: string;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'portfolio',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
      });
      imageUrl = result.secure_url;
      try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr);
      imageUrl = `/uploads/${req.file.filename}`;
    }
  } else {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  stylist.portfolioImages.push(imageUrl);
  await stylist.save();

  return sendSuccess(res, { imageUrl, portfolioImages: stylist.portfolioImages }, 'Image uploaded');
});

export const removePortfolioImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { imageUrl } = req.body;
  if (!imageUrl) throw new ApiError(400, 'Image URL is required');

  stylist.portfolioImages = stylist.portfolioImages.filter((img: string) => img !== imageUrl);

  // Try to remove from Cloudinary if it's a Cloudinary URL
  if (isCloudinaryConfigured && imageUrl.includes('cloudinary.com')) {
    const publicId = imageUrl.split('/').pop()?.split('.')[0];
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(`portfolio/${publicId}`);
      } catch { /* ignore */ }
    }
  } else {
    // Remove file from disk (local fallback)
    const filename = path.basename(imageUrl);
    const filepath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  await stylist.save();
  return sendSuccess(res, { portfolioImages: stylist.portfolioImages }, 'Image removed');
});
