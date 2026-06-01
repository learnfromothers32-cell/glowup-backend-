import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

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
