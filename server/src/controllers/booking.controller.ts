import { Request, Response } from 'express';
import { Booking } from '../models/Booking';
import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId, serviceId, startTime, notes } = req.body;
  const clientId = req.user?.id;

  if (!stylistId || !serviceId || !startTime) {
    throw new ApiError(400, 'Stylist ID, Service ID, and Start Time are required');
  }

  // Verify service exists and belongs to stylist
  const service = await Service.findOne({ _id: serviceId, stylistId });
  if (!service) {
    throw new ApiError(404, 'Service not found for this stylist');
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + service.duration * 60000);

  // Check for conflicts
  const conflict = await Booking.findOne({
    stylistId,
    status: { $ne: 'cancelled' },
    $or: [
      { startTime: { $lt: end, $gte: start } },
      { endTime: { $gt: start, $lte: end } },
      { startTime: { $lte: start }, endTime: { $gte: end } }
    ]
  });

  if (conflict) {
    throw new ApiError(409, 'This time slot is already booked');
  }

  const booking = await Booking.create({
    clientId,
    stylistId,
    serviceId,
    startTime: start,
    endTime: end,
    totalPrice: service.price,
    notes
  });

  return sendSuccess(res, { booking }, 'Booking created successfully', 201);
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.id;

  const bookings = await Booking.find({ clientId })
    .populate('stylistId', 'name image category')
    .populate('serviceId', 'name duration price')
    .sort({ startTime: -1 });

  return sendSuccess(res, { bookings });
});

export const getStylistBookings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  // First find the stylist profile for this user
  const stylist = await Stylist.findOne({ userId });
  if (!stylist) {
    throw new ApiError(404, 'Stylist profile not found');
  }

  const bookings = await Booking.find({ stylistId: stylist._id })
    .populate('clientId', 'name email avatar')
    .populate('serviceId', 'name duration price')
    .sort({ startTime: 1 });

  return sendSuccess(res, { bookings });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;

  if (!['confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Check if user is the stylist for this booking
  const stylist = await Stylist.findOne({ _id: booking.stylistId, userId });
  if (!stylist && req.user?.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to update this booking');
  }

  booking.status = status;
  await booking.save();

  return sendSuccess(res, { booking }, `Booking status updated to ${status}`);
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Client can cancel their own, Stylist can cancel their own
  const isClient = booking.clientId.toString() === userId;
  const stylist = await Stylist.findOne({ _id: booking.stylistId, userId });
  
  if (!isClient && !stylist && req.user?.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to cancel this booking');
  }

  booking.status = 'cancelled';
  await booking.save();

  return sendSuccess(res, { booking }, 'Booking cancelled successfully');
});

export const rescheduleBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startTime } = req.body;
  const userId = req.user?.id;

  if (!startTime) {
    throw new ApiError(400, 'New start time is required');
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Only the client who owns the booking can reschedule
  if (booking.clientId.toString() !== userId) {
    throw new ApiError(403, 'You do not have permission to reschedule this booking');
  }

  // Only pending or confirmed bookings can be rescheduled
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ApiError(400, 'Cannot reschedule a booking that is already in progress, completed, or cancelled');
  }

  // Get the service to recalculate endTime
  const service = await Service.findById(booking.serviceId);
  if (!service) {
    throw new ApiError(404, 'Associated service not found');
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + service.duration * 60000);

  // Check for conflicts (exclude current booking)
  const conflict = await Booking.findOne({
    _id: { $ne: id },
    stylistId: booking.stylistId,
    status: { $ne: 'cancelled' },
    $or: [
      { startTime: { $lt: end, $gte: start } },
      { endTime: { $gt: start, $lte: end } },
      { startTime: { $lte: start }, endTime: { $gte: end } }
    ]
  });

  if (conflict) {
    throw new ApiError(409, 'This time slot is already booked');
  }

  booking.startTime = start;
  booking.endTime = end;
  booking.status = 'pending';
  await booking.save();

  return sendSuccess(res, { booking }, 'Booking rescheduled successfully');
});
