import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Booking } from '../models/Booking';
import { IQueueEntry, Queue } from '../models/Queue';
import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { Client } from '../models/Client';
import { Conversation } from '../models/Conversation';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { notifyBookingCreated, notifyBookingStatusChange } from '../utils/notify';
import { getIO } from '../socket';
import { emitQueueUpdate } from '../utils/queue';

function emitBookingEvent(clientId: string, data: { bookingId: string; status: string; stylistId: string; clientId: string }) {
  try {
    getIO().of('/queue').to(`user:${clientId}`).emit('booking:status-changed', data);
  } catch {
    // socket not initialized
  }
}

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId, serviceId, startTime, notes, paymentMethod } = req.body;
  const clientId = req.user?.id;

  if (!stylistId || !serviceId || !startTime) {
    throw new ApiError(400, 'Stylist ID, Service ID, and Start Time are required');
  }

  if (!mongoose.Types.ObjectId.isValid(stylistId)) {
    throw new ApiError(400, `Invalid stylist ID format: "${stylistId}"`);
  }
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new ApiError(400, `Invalid service ID format: "${serviceId}"`);
  }
  if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
    throw new ApiError(400, 'Invalid user authentication');
  }

  const service = await Service.findOne({ _id: serviceId, stylistId });
  if (!service) {
    throw new ApiError(404, 'Service not found for this stylist');
  }

  const start = new Date(startTime);
  if (isNaN(start.getTime())) {
    throw new ApiError(400, 'Invalid start time format');
  }
  if (start.getTime() < Date.now() - 60000) {
    throw new ApiError(400, 'Start time must be in the future');
  }
  const end = new Date(start.getTime() + service.duration * 60000);

  // Check for conflicts (app-level check for descriptive error messages)
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

  // DB-level atomic duplicate prevention via unique partial index {stylistId, startTime}
  let booking;
  try {
    booking = await Booking.create({
      clientId,
      stylistId,
      serviceId,
      startTime: start,
      endTime: end,
      totalPrice: service.price,
      notes,
      paymentMethod: paymentMethod || undefined,
      rescheduleCount: 0
    });
  } catch (err: any) {
    if (err.code === 11000) {
      throw new ApiError(409, 'This time slot was just booked by another client');
    }
    throw err;
  }

  await Client.findOneAndUpdate(
    { stylistId, userId: clientId },
    {
      $inc: { totalVisits: 1, totalSpent: service.price },
      $set: { lastVisit: new Date() },
      $setOnInsert: { favorite: false, tags: [], notes: '', preferences: { services: [], notes: '' } }
    },
    { upsert: true }
  );

  const existingConv = await Conversation.findOne({ stylistId, clientId });
  if (!existingConv) {
    await Conversation.create({
      stylistId,
      clientId,
      bookingId: booking._id,
      subject: `Booking #${booking._id}`
    });
  }

  const stylist = await Stylist.findById(stylistId);
  if (stylist) {
    notifyBookingCreated(clientId, stylist.name, booking._id.toString()).catch(() => {});
  }

  // Atomically add to queue ($push never overwrites concurrent entries)
  let queuePosition = 0;
  let estimatedWaitMinutes = 0;
  try {
    const entry: IQueueEntry = {
      userId: new mongoose.Types.ObjectId(clientId),
      position: 0,
      joinedAt: new Date(),
      estimatedServiceMins: 30,
      estimatedWaitMins: 0,
      status: 'waiting',
      bookingId: booking._id,
    };

    const updated = await Queue.findOneAndUpdate(
      { stylistId: new mongoose.Types.ObjectId(stylistId) },
      {
        $push: { entries: entry },
        $setOnInsert: {
          stylistId: new mongoose.Types.ObjectId(stylistId),
          currentPosition: 0,
          predictedWaitMins: 0,
          avgServiceDuration: 30,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Deduplicate: if the user was already waiting (race), remove extras
    const waiting = updated.entries.filter((e) => e.status === 'waiting');
    const userEntries = waiting.filter((e) => e.userId.toString() === clientId);
    if (userEntries.length > 1) {
      userEntries.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
      const keep = userEntries[0];
      await Queue.findOneAndUpdate(
        { stylistId: new mongoose.Types.ObjectId(stylistId) },
        { $pull: { entries: { userId: new mongoose.Types.ObjectId(clientId), status: 'waiting', joinedAt: { $ne: keep.joinedAt } } } }
      );
    }

    // Recalculate all waiting positions atomically
    const afterDedup = await Queue.findOne({ stylistId: new mongoose.Types.ObjectId(stylistId) });
    if (afterDedup) {
      const finalWaiting = afterDedup.entries.filter((e) => e.status === 'waiting');
      let cumulativeWait = 0;
      for (const e of afterDedup.entries) {
        if (e.status === 'in-service') cumulativeWait += e.estimatedServiceMins;
      }

      const bulkOps: any[] = [];
      for (let i = 0; i < finalWaiting.length; i++) {
        const pos = i + 1;
        const wait = cumulativeWait;
        cumulativeWait += finalWaiting[i].estimatedServiceMins;
        bulkOps.push({
          updateOne: {
            filter: { stylistId: new mongoose.Types.ObjectId(stylistId), 'entries.userId': finalWaiting[i].userId },
            update: { $set: { 'entries.$.position': pos, 'entries.$.estimatedWaitMins': wait } },
          },
        });
      }

      bulkOps.push({
        updateOne: {
          filter: { stylistId: new mongoose.Types.ObjectId(stylistId) },
          update: { $set: { currentPosition: finalWaiting.length, predictedWaitMins: cumulativeWait, lastUpdated: new Date() } },
        },
      });

      if (bulkOps.length > 0) await Queue.bulkWrite(bulkOps);

      const myEntry = finalWaiting.find((e) => e.userId.toString() === clientId);
      if (myEntry) {
        queuePosition = myEntry.position;
        estimatedWaitMinutes = myEntry.estimatedWaitMins;
      } else {
        queuePosition = finalWaiting.length;
        estimatedWaitMinutes = cumulativeWait;
      }

      const freshQueue = await Queue.findOne({ stylistId: new mongoose.Types.ObjectId(stylistId) });
      if (freshQueue) emitQueueUpdate(stylistId, freshQueue);
    }
  } catch (err) {
    console.error('Failed to auto-join queue:', err);
  }

  return sendSuccess(res, { booking, queuePosition, estimatedWaitMinutes }, 'Booking created successfully', 201);
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const status = req.query.status as string;

  const filter: Record<string, any> = { clientId };
  if (status && ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    filter.status = status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('stylistId', 'name image category')
      .populate('serviceId', 'name duration price')
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(filter)
  ]);

  return sendPaginated(res, { bookings }, total, page, limit);
});

export const getStylistBookings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const status = req.query.status as string;

  const stylist = await Stylist.findOne({ userId });
  if (!stylist) {
    throw new ApiError(404, 'Stylist profile not found');
  }

  const filter: Record<string, any> = { stylistId: stylist._id };
  if (status && ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    filter.status = status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('clientId', 'name email avatar')
      .populate('serviceId', 'name duration price')
      .sort({ startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(filter)
  ]);

  return sendPaginated(res, { bookings }, total, page, limit);
});

export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid booking ID');
  }

  const booking = await Booking.findById(id)
    .populate('clientId', 'name email avatar phone')
    .populate('stylistId', 'name image category')
    .populate('serviceId', 'name duration price');

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  const isClient = booking.clientId._id.toString() === userId;
  const stylist = await Stylist.findOne({ _id: booking.stylistId, userId });
  const isStylist = !!stylist;

  if (!isClient && !isStylist && req.user?.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to view this booking');
  }

  return sendSuccess(res, { booking });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid booking ID');
  }

  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
  };

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  const allowedNext = validTransitions[booking.status];
  if (!allowedNext || !allowedNext.includes(status)) {
    throw new ApiError(400, `Cannot transition from '${booking.status}' to '${status}'`);
  }

  const stylist = await Stylist.findOne({ _id: booking.stylistId, userId });
  if (!stylist && req.user?.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to update this booking');
  }

  booking.status = status as any;
  if (status === 'confirmed') booking.confirmedAt = new Date();
  if (status === 'completed') booking.completedAt = new Date();
  await booking.save();

  notifyBookingStatusChange(booking.clientId.toString(), status, booking._id.toString()).catch(() => {});
  emitBookingEvent(booking.clientId.toString(), {
    bookingId: booking._id.toString(),
    status: booking.status,
    stylistId: booking.stylistId.toString(),
    clientId: booking.clientId.toString(),
  });

  return sendSuccess(res, { booking }, `Booking status updated to ${status}`);
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid booking ID');
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.status === 'completed' || booking.status === 'cancelled') {
    throw new ApiError(400, 'Cannot cancel a booking that is already completed or cancelled');
  }

  const isClient = booking.clientId.toString() === userId;
  const stylist = await Stylist.findOne({ _id: booking.stylistId, userId });

  if (!isClient && !stylist && req.user?.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to cancel this booking');
  }

  booking.status = 'cancelled';
  if (reason) booking.cancellationReason = reason;
  await booking.save();

  emitBookingEvent(booking.clientId.toString(), {
    bookingId: booking._id.toString(),
    status: booking.status,
    stylistId: booking.stylistId.toString(),
    clientId: booking.clientId.toString(),
  });

  // Remove from queue on cancellation
  try {
    const queue = await Queue.findOne({ stylistId: booking.stylistId });
    if (queue) {
      queue.entries = queue.entries.filter(
        (e) => !(e.userId.toString() === booking.clientId.toString() && e.status === 'waiting')
      );
      queue.recalculate();
      await queue.save();
      emitQueueUpdate(booking.stylistId.toString(), queue);
    }
  } catch {}

  const targetId = isClient ? booking.stylistId.toString() : booking.clientId.toString();
  notifyBookingStatusChange(targetId, 'cancelled', booking._id.toString()).catch(() => {});

  return sendSuccess(res, { booking }, 'Booking cancelled successfully');
});

export const rescheduleBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startTime } = req.body;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid booking ID');
  }

  if (!startTime) {
    throw new ApiError(400, 'New start time is required');
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.clientId.toString() !== userId) {
    throw new ApiError(403, 'You do not have permission to reschedule this booking');
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ApiError(400, 'Cannot reschedule a booking that is already in progress, completed, or cancelled');
  }

  const service = await Service.findById(booking.serviceId);
  if (!service) {
    throw new ApiError(404, 'Associated service not found');
  }

  const start = new Date(startTime);
  if (isNaN(start.getTime())) {
    throw new ApiError(400, 'Invalid start time format');
  }
  if (start.getTime() < Date.now() - 60000) {
    throw new ApiError(400, 'New start time must be in the future');
  }
  const end = new Date(start.getTime() + service.duration * 60000);

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
  booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;
  await booking.save();

  emitBookingEvent(booking.clientId.toString(), {
    bookingId: booking._id.toString(),
    status: booking.status,
    stylistId: booking.stylistId.toString(),
    clientId: booking.clientId.toString(),
  });

  return sendSuccess(res, { booking }, 'Booking rescheduled successfully');
});

export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId } = req.params;
  const { date } = req.query;

  if (!mongoose.Types.ObjectId.isValid(stylistId)) {
    throw new ApiError(400, 'Invalid stylist ID');
  }

  const stylist = await Stylist.findById(stylistId);
  if (!stylist) {
    throw new ApiError(404, 'Stylist not found');
  }

  const targetDate = date ? new Date(date as string) : new Date();
  if (isNaN(targetDate.getTime())) {
    throw new ApiError(400, 'Invalid date parameter');
  }

  const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Get existing bookings for this stylist on this day
  const existingBookings = await Booking.find({
    stylistId,
    status: { $ne: 'cancelled' },
    startTime: { $gte: dayStart, $lte: dayEnd }
  }).select('startTime endTime');

  // Try to get stylist's available hours from schedule
  let availableHours: { start: string; end: string }[] = [];
  const schedule = (stylist as any).schedule;
  if (schedule && schedule[dayOfWeek]) {
    availableHours = schedule[dayOfWeek];
  }

  if (availableHours.length === 0) {
    // Default business hours if no schedule set
    availableHours = [{ start: '09:00', end: '17:00' }];
  }

  // Generate 30-min slots
  const slots: { time: string; available: boolean }[] = [];
  for (const range of availableHours) {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    let slotStart = new Date(targetDate);
    slotStart.setHours(startH, startM, 0, 0);
    const slotEnd = new Date(targetDate);
    slotEnd.setHours(endH, endM, 0, 0);

    while (slotStart < slotEnd) {
      const slotEndTime = new Date(slotStart.getTime() + 30 * 60000);
      const isBooked = existingBookings.some(b => {
        const bs = b.startTime.getTime();
        const be = b.endTime.getTime();
        const ss = slotStart.getTime();
        const se = slotEndTime.getTime();
        return (ss < be && se > bs);
      });

      slots.push({
        time: slotStart.toTimeString().slice(0, 5),
        available: !isBooked
      });
      slotStart = slotEndTime;
    }
  }

  // Fetch services for pricing/duration to show in slot picker
  const services = await Service.find({ stylistId }).select('name duration price');

  return sendSuccess(res, { slots, services, date: targetDate.toISOString() });
});
