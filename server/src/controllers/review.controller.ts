import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

async function recalculateStylistRating(stylistId: string) {
  const reviews = await Review.find({ stylistId });
  if (reviews.length === 0) {
    await Stylist.findByIdAndUpdate(stylistId, { rating: 0, reviewCount: 0 });
  } else {
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await Stylist.findByIdAndUpdate(stylistId, { rating: avgRating, reviewCount: reviews.length });
  }
}

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, rating, comment, images } = req.body;
  const clientId = req.user?.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.clientId.toString() !== clientId) {
    throw new ApiError(403, 'You can only review your own bookings');
  }

  if (booking.status !== 'completed') {
    throw new ApiError(400, 'You can only review completed bookings');
  }

  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    throw new ApiError(400, 'You have already reviewed this booking');
  }

  const review = await Review.create({
    bookingId,
    clientId,
    stylistId: booking.stylistId,
    rating,
    comment,
    images
  });

  return sendSuccess(res, { review }, 'Review submitted successfully', 201);
});

export const getStylistReviews = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId } = req.params;

  const reviews = await Review.find({ stylistId })
    .populate('clientId', 'name avatar')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { reviews });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  if (review.clientId.toString() !== userId && req.user?.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own reviews');
  }

  await review.deleteOne();
  await recalculateStylistRating(review.stylistId.toString());
  return sendSuccess(res, null, 'Review deleted');
});
