import { Request, Response } from 'express';
import { User } from '../models/User';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id).populate({
    path: 'favorites',
    model: 'Stylist',
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sendSuccess(res, { favorites: (user as any).favorites || [] });
});

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId } = req.body;

  const stylist = await Stylist.findById(stylistId);
  if (!stylist) {
    throw new ApiError(404, 'Stylist not found');
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const favs = (user as any).favorites || [];
  if (favs.some((id: any) => id.toString() === stylistId)) {
    return sendSuccess(res, { favorites: favs }, 'Already in favorites');
  }

  (user as any).favorites = [...favs, stylist._id];
  await user.save();

  return sendSuccess(res, { favorites: (user as any).favorites }, 'Added to favorites');
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId } = req.params;

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  (user as any).favorites = ((user as any).favorites || []).filter(
    (id: any) => id.toString() !== stylistId
  );
  await user.save();

  return sendSuccess(res, { favorites: (user as any).favorites }, 'Removed from favorites');
});
