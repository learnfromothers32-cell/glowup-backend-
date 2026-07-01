import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Availability } from '../models/Availability';
import { Booking } from '../models/Booking';
import { IQueueEntry, Queue } from '../models/Queue';
import { Service } from '../models/Service';
import { Stylist } from '../models/Stylist';
import { StylistSettings } from '../models/StylistSettings';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Conversation } from '../models/Conversation';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import logger from '../utils/logger';
import { notifyBookingCreated, notifyBookingStatusChange, notifyNewBookingForStylist, notifyBookingRescheduled } from '../utils/notify';
import { getIO } from '../socket';
import { emitQueueUpdate } from '../utils/queue';

function emitBookingEvent(clientId: string, data: { bookingId: string; status: string; stylistId: string; clientId: string }) {
  try {
    getIO().of('/queue').to(`user:${clientId}`).emit('booking:status-changed', data);
  } catch {
    // socket not initialized
  }
}

/**
 * Get UTC offset (in milliseconds) for a given calendar date and IANA timezone.
 * Uses noon UTC to avoid midnight ambiguity during DST transitions.
 */
function getTimezoneOffsetMs(dateStr: string, timezone: string): number {
  const utcRef = new Date(dateStr + 'T12:00:00Z');
  const localStr = utcRef.toLocaleString('en-US', { timeZone: timezone, hour12: false });
  const localDate = new Date(localStr);
  return localDate.getTime() - utcRef.getTime();
}

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId, serviceId, startTime, notes, paymentMethod, timezone: _timezone } = req.body;
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
  const now = Date.now();
  if (start.getTime() < now - 60000) {
    throw new ApiError(400, 'Start time must be in the future');
  }
  const end = new Date(start.getTime() + service.duration * 60000);

  // ── Slot availability revalidation (mirrors getAvailableSlots) ──
  const slotCheck = await validateSlotInSchedule(stylistId, start, service.duration);
  if (!slotCheck.valid) {
    throw new ApiError(409, slotCheck.reason || 'Requested slot is not available');
  }

  // ── Buffer-aware conflict check ──
  const availability = await Availability.findOne({ stylistId });
  const bufferMinutes = availability?.bufferMinutes ?? 0;

  const conflictCount = await Booking.countDocuments({
    stylistId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: new Date(end.getTime() + bufferMinutes * 60000) },
    endTime: { $gt: new Date(start.getTime() - bufferMinutes * 60000) },
  });

  if (conflictCount > 0) {
    throw new ApiError(409, 'This time slot conflicts with an existing booking');
  }

  // ── Capacity enforcement ──
  const maxClients = availability?.maxClientsPerSlot ?? 1;
  const slotBookingCount = await Booking.countDocuments({
    stylistId,
    startTime: start,
    status: { $ne: 'cancelled' },
  });
  if (slotBookingCount >= maxClients) {
    throw new ApiError(409, 'This time slot is fully booked');
  }

  // Enforce booking lead time
  const settings = await StylistSettings.findOne({ stylistId });
  const leadTimeMinutes = settings?.business?.bookingLeadTime ?? 0;
  if (leadTimeMinutes > 0 && start.getTime() < now + leadTimeMinutes * 60000) {
    throw new ApiError(400, `Bookings must be made at least ${leadTimeMinutes} minutes in advance`);
  }

  // Enforce maximum future booking window
  const maxFutureDays = settings?.business?.maxFutureBookings ?? 60;
  const maxFutureDate = new Date();
  maxFutureDate.setDate(maxFutureDate.getDate() + maxFutureDays);
  if (start > maxFutureDate) {
    throw new ApiError(400, `Bookings cannot be made more than ${maxFutureDays} days in advance`);
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

  logger.info('Audit: booking created', { bookingId: booking._id, stylistId, clientId, startTime: start.toISOString(), serviceId, amount: service.price });

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
    const clientUser = await User.findById(clientId);
    if (clientUser) {
      notifyNewBookingForStylist(stylist.userId as any, clientUser.name, booking._id.toString()).catch(() => {});
    }
  }

  // Atomically add to queue ($pull removes old entry, $push adds new — prevents duplicates)
  let queuePosition = 0;
  let estimatedWaitMinutes = 0;
  try {
    const joinedAt = new Date();
    const stylistOid = new mongoose.Types.ObjectId(stylistId);
    const clientOid = new mongoose.Types.ObjectId(clientId);
    const entry: IQueueEntry = {
      userId: clientOid,
      position: 0,
      joinedAt,
      estimatedServiceMins: 30,
      estimatedWaitMins: 0,
      status: 'waiting',
      bookingId: booking._id,
    };

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Queue.findOneAndUpdate(
          { stylistId: stylistOid },
          {
            $pull: { entries: { userId: clientOid, status: 'waiting' } },
            $push: { entries: entry },
            $setOnInsert: {
              stylistId: stylistOid,
              currentPosition: 0,
              predictedWaitMins: 0,
              avgServiceDuration: 30,
              lastUpdated: new Date(),
            },
          },
          { upsert: true, session }
        );

        const queue = await Queue.findOne({ stylistId: stylistOid }).session(session);
        if (queue) {
          queue.recalculate();
          await queue.save({ session });

          const myEntry = queue.entries.find(
            (e) => e.userId.toString() === clientId && e.status === 'waiting'
          );
          if (myEntry) {
            queuePosition = myEntry.position;
            estimatedWaitMinutes = myEntry.estimatedWaitMins;
          }
        }
      });
    } finally {
      session.endSession();
    }

    const queue = await Queue.findOne({ stylistId: stylistOid });
    if (queue) {
      emitQueueUpdate(stylistId, queue);
    }
  } catch (err) {
    logger.error('Failed to auto-join queue:', err);
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

  const prevStatus = booking.status;
  const allowedSources = Object.entries(validTransitions)
    .filter(([_, next]) => next.includes(status))
    .map(([current]) => current);

  const updated = await Booking.findOneAndUpdate(
    { _id: id, status: { $in: allowedSources } },
    {
      $set: {
        status,
        ...(status === 'confirmed' ? { confirmedAt: new Date() } : {}),
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      }
    },
    { new: true }
  );

  if (!updated) {
    throw new ApiError(400, `Cannot transition from '${prevStatus}' to '${status}'`);
  }

  logger.info('Audit: booking status updated', { bookingId: updated._id, from: prevStatus, to: status, byUserId: userId });
  notifyBookingStatusChange(updated.clientId.toString(), status, updated._id.toString()).catch(() => {});
  emitBookingEvent(updated.clientId.toString(), {
    bookingId: updated._id.toString(),
    status: updated.status,
    stylistId: updated.stylistId.toString(),
    clientId: updated.clientId.toString(),
  });

  return sendSuccess(res, { booking: updated }, `Booking status updated to ${status}`);
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

  const updated = await Booking.findOneAndUpdate(
    { _id: id, status: { $nin: ['completed', 'cancelled'] } },
    { $set: { status: 'cancelled', ...(reason ? { cancellationReason: reason } : {}) } },
    { new: true }
  );
  if (!updated) {
    throw new ApiError(409, 'Booking was modified concurrently');
  }

  logger.info('Audit: booking cancelled', { bookingId: updated._id, byUserId: userId, reason });
  emitBookingEvent(updated.clientId.toString(), {
    bookingId: updated._id.toString(),
    status: updated.status,
    stylistId: updated.stylistId.toString(),
    clientId: updated.clientId.toString(),
  });

  // Remove from queue on cancellation (transactional)
  let queueUpdated: any = null;
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const queue = await Queue.findOneAndUpdate(
          { stylistId: updated.stylistId },
          { $pull: { entries: { userId: updated.clientId, status: 'waiting' } } },
          { new: true, session }
        );
        if (queue) {
          queue.recalculate();
          await queue.save({ session });
          queueUpdated = queue;
        }
      });
    } finally {
      session.endSession();
    }
  } catch (err) {
    logger.error('Failed to remove from queue on cancellation:', err);
  }
  if (queueUpdated) {
    emitQueueUpdate(updated.stylistId.toString(), queueUpdated);
  }

  const targetId = isClient ? updated.stylistId.toString() : updated.clientId.toString();
  notifyBookingStatusChange(targetId, 'cancelled', updated._id.toString()).catch(() => {});

  return sendSuccess(res, { booking: updated }, 'Booking cancelled successfully');
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

  // Re-validate against availability schedule
  const slotCheck = await validateSlotInSchedule(booking.stylistId.toString(), start, service.duration);
  if (!slotCheck.valid) {
    throw new ApiError(409, slotCheck.reason || 'Requested slot is not available');
  }

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

  const updated = await Booking.findOneAndUpdate(
    { _id: id, status: { $in: ['pending', 'confirmed'] } },
    { $set: { startTime: start, endTime: end, status: 'pending' }, $inc: { rescheduleCount: 1 } },
    { new: true }
  );
  if (!updated) {
    throw new ApiError(409, 'Booking was modified concurrently');
  }

  logger.info('Audit: booking rescheduled', { bookingId: updated._id, newStart: start.toISOString(), newEnd: end.toISOString() });
  emitBookingEvent(updated.clientId.toString(), {
    bookingId: updated._id.toString(),
    status: updated.status,
    stylistId: updated.stylistId.toString(),
    clientId: updated.clientId.toString(),
  });

  const stylistReschedule = await Stylist.findById(updated.stylistId);
  if (stylistReschedule) {
    notifyBookingRescheduled(updated.clientId.toString(), stylistReschedule.name, updated._id.toString()).catch(() => {});
  }

  return sendSuccess(res, { booking: updated }, 'Booking rescheduled successfully');
});

/**
 * Compute block start/end in UTC for a stylist's local day.
 * Returns [dayStartUTC, dayEndUTC] covering the full local day, accounting for timezone offset.
 */
function localDayRangeUTC(dateStr: string, timezone: string): [Date, Date] {
  const utcMidnight = new Date(dateStr + 'T00:00:00Z');
  const offsetMs = getTimezoneOffsetMs(dateStr, timezone);
  const localDayStart = new Date(utcMidnight.getTime() - offsetMs);
  const localDayEnd = new Date(localDayStart.getTime() + 24 * 60 * 60000);
  return [localDayStart, localDayEnd];
}

/**
 * Convert a local time string (HH:MM) to a UTC Date for the given calendar date and timezone.
 */
function localTimeToUTC(dateStr: string, timeStr: string, timezone: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const utcMidnight = new Date(dateStr + 'T00:00:00Z');
  const offsetMs = getTimezoneOffsetMs(dateStr, timezone);
  return new Date(utcMidnight.getTime() + (h * 60 + m) * 60000 - offsetMs);
}

/**
 * Convert a time string (HH:MM) to total minutes from midnight.
 */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Validate that a given UTC startTime falls within the stylist's availability schedule
 * (working hours, breaks, day-of-week, date overrides).
 * This mirrors the slot-generation logic in getAvailableSlots.
 */
async function validateSlotInSchedule(
  stylistId: string,
  startTime: Date,
  durationMinutes: number,
): Promise<{ valid: boolean; reason?: string }> {
  const availability = await Availability.findOne({ stylistId });
  if (!availability) {
    return { valid: false, reason: 'Stylist has no availability configured' };
  }

  const timezone = availability.timezone || 'UTC';

  // Stable local date key (yyyy-mm-dd) in the stylist's timezone
  const localDateParts = startTime.toLocaleDateString('en-US', { timeZone: timezone }).split('/');
  const localDateStr = `${localDateParts[2]}-${String(Number(localDateParts[0])).padStart(2, '0')}-${String(Number(localDateParts[1])).padStart(2, '0')}`;

  const dayOfWeek = startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: timezone,
  }).toLowerCase();

  // Convert UTC startTime to minutes since start of local day
  const [dayStartUTC] = localDayRangeUTC(localDateStr, timezone);
  const slotStartMin = (startTime.getTime() - dayStartUTC.getTime()) / 60000;
  const slotEndMin = slotStartMin + durationMinutes;

  // Date overrides
  const override = (availability.dateOverrides || []).find(o => {
    const od = o.date instanceof Date ? o.date : new Date(o.date);
    return od.toISOString().slice(0, 10) === localDateStr;
  });

  let workStartMin: number;
  let workEndMin: number;
  let breaks: { start: string; end: string }[] = [];

  if (override) {
    if (!override.available) {
      return { valid: false, reason: 'Stylist is not available on this date' };
    }
    workStartMin = override.start ? timeToMinutes(override.start) : 0;
    workEndMin = override.end ? timeToMinutes(override.end) : 24 * 60;
  } else {
    const schedule = availability.schedule;
    const daySchedule = schedule instanceof Map
      ? schedule.get(dayOfWeek)
      : (schedule as any)?.[dayOfWeek];

    if (!daySchedule || !daySchedule.enabled) {
      return { valid: false, reason: 'Stylist is not available on this day' };
    }

    workStartMin = timeToMinutes(daySchedule.start);
    workEndMin = timeToMinutes(daySchedule.end);
    breaks = daySchedule.breaks || [];
  }

  // Working hours check
  if (slotStartMin < workStartMin || slotEndMin > workEndMin) {
    return { valid: false, reason: 'Requested time is outside the stylist\'s working hours' };
  }

  // Break check
  const inBreak = breaks.some(b => {
    const bs = timeToMinutes(b.start);
    const be = timeToMinutes(b.end);
    return slotStartMin < be && slotEndMin > bs;
  });
  if (inBreak) {
    return { valid: false, reason: 'Requested time overlaps with a break period' };
  }

  return { valid: true };
}

export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId } = req.params;
  const { date, serviceId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(stylistId)) {
    throw new ApiError(400, 'Invalid stylist ID');
  }

  const stylist = await Stylist.findById(stylistId).select('_id');
  if (!stylist) {
    throw new ApiError(404, 'Stylist not found');
  }

  const dateStr = date as string | undefined;
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(targetDate.getTime())) {
    throw new ApiError(400, 'Invalid date parameter');
  }

  // Use a stable string key for date comparison
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  // ── 1. Load Availability ──
  let availability = await Availability.findOne({ stylistId });
  if (!availability) {
    availability = new Availability({ stylistId });
  }

  const timezone = availability.timezone || 'UTC';

  // ── 2. Load StylistSettings for business rules ──
  const settings = await StylistSettings.findOne({ stylistId });
  const leadTimeMinutes = settings?.business?.bookingLeadTime ?? 0;
  const maxFutureDays = settings?.business?.maxFutureBookings ?? 60;

  // ── 3. Enforce maximum future booking window ──
  const maxFutureDate = new Date();
  maxFutureDate.setDate(maxFutureDate.getDate() + maxFutureDays);
  maxFutureDate.setHours(23, 59, 59, 999);
  if (targetDate > maxFutureDate) {
    const services = await Service.find({ stylistId }).select('name duration price');
    return sendSuccess(res, { slots: [], services, date: targetDate.toISOString() });
  }

  // ── 4. Determine day-of-week in stylist's timezone ──
  const dayOfWeek = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: timezone,
  }).toLowerCase();

  // ── 5. Compute stylist's local day range in UTC (for booking queries) ──
  const [localDayStartUTC, localDayEndUTC] = localDayRangeUTC(targetDateStr, timezone);

  // ── 6. Load service for duration ──
  let serviceDuration = 30;
  if (serviceId && mongoose.Types.ObjectId.isValid(serviceId as string)) {
    const svc = await Service.findOne({ _id: serviceId, stylistId }).select('duration');
    if (svc) serviceDuration = svc.duration;
  }

  // ── 7. Check date overrides ──
  let workStartMin: number;
  let workEndMin: number;
  let breaks: { start: string; end: string }[] = [];

  const override = (availability.dateOverrides || []).find(o => {
    const od = o.date instanceof Date ? o.date : new Date(o.date);
    return od.toISOString().slice(0, 10) === targetDateStr;
  });

  if (override) {
    if (!override.available) {
      const services = await Service.find({ stylistId }).select('name duration price');
      return sendSuccess(res, { slots: [], services, date: targetDate.toISOString() });
    }
    workStartMin = override.start ? timeToMinutes(override.start) : 0;
    workEndMin = override.end ? timeToMinutes(override.end) : 24 * 60 - 1;
  } else {
    // ── 8. Use weekly schedule ──
    const schedule = availability.schedule;
    const daySchedule = schedule instanceof Map
      ? schedule.get(dayOfWeek)
      : (schedule as any)?.[dayOfWeek];

    if (!daySchedule || !daySchedule.enabled) {
      const services = await Service.find({ stylistId }).select('name duration price');
      return sendSuccess(res, { slots: [], services, date: targetDate.toISOString() });
    }

    workStartMin = timeToMinutes(daySchedule.start);
    workEndMin = timeToMinutes(daySchedule.end);
    breaks = daySchedule.breaks || [];
  }

  // ── 9. Compute blocked intervals from breaks ──
  const breakIntervals = breaks.map(b => ({
    start: timeToMinutes(b.start),
    end: timeToMinutes(b.end),
  }));

  // ── 10. Compute blocked intervals from existing bookings (including buffer) ──
  const bufferMinutes = availability.bufferMinutes || 0;

  const existingBookings = await Booking.find({
    stylistId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: localDayEndUTC },
    endTime: { $gt: localDayStartUTC },
  }).select('startTime endTime');

  const blockedByBooking = existingBookings.map(b => {
    const bs = b.startTime.getTime();
    const be = b.endTime.getTime();
    // Convert to minutes since start of local day
    const dayStartMs = localDayStartUTC.getTime();
    const blockStart = Math.max(0, (bs - bufferMinutes * 60000 - dayStartMs) / 60000);
    const blockEnd = Math.min(24 * 60, (be + bufferMinutes * 60000 - dayStartMs) / 60000);
    return { start: blockStart, end: blockEnd };
  });

  const now = Date.now();

  // ── 11. Generate slots at 30-minute increments ──
  const slots: { time: string; available: boolean }[] = [];
  const increment = 30;

  for (let slotStartMin = workStartMin; slotStartMin + serviceDuration <= workEndMin; slotStartMin += increment) {
    const slotEndMin = slotStartMin + serviceDuration;

    // Check against break intervals
    const inBreak = breakIntervals.some(br => slotStartMin < br.end && slotEndMin > br.start);
    if (inBreak) continue;

    // Check against existing bookings (with buffer)
    const conflicts = blockedByBooking.some(bl => slotStartMin < bl.end && slotEndMin > bl.start);
    if (conflicts) continue;

    // Compute UTC time for this slot to check lead time and past
    const slotDate = localTimeToUTC(
      targetDateStr,
      `${Math.floor(slotStartMin / 60).toString().padStart(2, '0')}:${(slotStartMin % 60).toString().padStart(2, '0')}`,
      timezone,
    );
    const slotStartMs = slotDate.getTime();

    // Slot must be in the future (with 1-minute grace)
    if (slotStartMs < now - 60000) continue;

    // Enforce lead time
    if (leadTimeMinutes > 0 && slotStartMs < now + leadTimeMinutes * 60000) continue;

    slots.push({
      time: `${Math.floor(slotStartMin / 60).toString().padStart(2, '0')}:${(slotStartMin % 60).toString().padStart(2, '0')}`,
      available: true,
    });
  }

  // ── 12. Fetch services for the slot picker ──
  const services = await Service.find({ stylistId }).select('name duration price');

  return sendSuccess(res, { slots, services, date: targetDate.toISOString() });
});
