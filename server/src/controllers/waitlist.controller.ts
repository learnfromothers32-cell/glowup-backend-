import { Request, Response } from 'express';
import { WaitlistEntry } from '../models/Waitlist';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { createNotification } from '../utils/notify';
import { User } from '../models/User';

const getPopulate = () => [
  { path: 'clientId', select: 'name email avatar phone' },
  { path: 'stylistId', select: 'name image userId' },
  { path: 'serviceId', select: 'name duration price' },
];

export const createWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const { stylistId, serviceId, preferredDate, preferredTime, notes } = req.body;
  const clientId = req.user?.id;

  if (!stylistId || !serviceId || !preferredDate) {
    throw new ApiError(400, 'Stylist ID, Service ID, and preferred date are required');
  }

  const stylist = await Stylist.findById(stylistId);
  if (!stylist) throw new ApiError(404, 'Stylist not found');

  const entry = await WaitlistEntry.create({
    stylistId,
    clientId,
    serviceId,
    preferredDate: new Date(preferredDate),
    preferredTime: preferredTime || '',
    notes: notes || '',
    status: 'waiting'
  });

  return sendSuccess(res, { entry }, 'Added to waitlist', 201);
});

export const getMyWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { status } = req.query;
  const filter: Record<string, unknown> = { stylistId: stylist.id };
  if (status) filter.status = status;

  const entries = await WaitlistEntry.find(filter)
    .populate('clientId', 'name email avatar phone')
    .populate('serviceId', 'name duration price')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { entries });
});

export const getConsumerWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.id;
  const { status } = req.query;
  const filter: Record<string, unknown> = { clientId };
  if (status) filter.status = status;

  const entries = await WaitlistEntry.find(filter)
    .populate(getPopulate())
    .sort({ createdAt: -1 });

  return sendSuccess(res, { entries });
});

export const bookConsumerEntry = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.id;
  const entry = await WaitlistEntry.findOne({ _id: req.params.id, clientId });
  if (!entry) throw new ApiError(404, 'Waitlist entry not found');
  if (entry.status !== 'notified') throw new ApiError(400, 'Entry must be notified before booking');

  entry.status = 'booked';
  await entry.save();

  return sendSuccess(res, { entry }, 'Entry marked as booked');
});

export const cancelConsumerEntry = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.id;
  const entry = await WaitlistEntry.findOne({ _id: req.params.id, clientId });
  if (!entry) throw new ApiError(404, 'Waitlist entry not found');
  if (entry.status !== 'waiting') throw new ApiError(400, 'Can only cancel waiting entries');

  entry.status = 'cancelled';
  await entry.save();

  return sendSuccess(res, { entry }, 'Entry cancelled');
});

export const notifyWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const entry = await WaitlistEntry.findOne({ _id: req.params.id, stylistId: stylist.id })
    .populate(getPopulate());
  if (!entry) throw new ApiError(404, 'Waitlist entry not found');

  entry.notified = true;
  entry.notifiedAt = new Date();
  entry.status = 'notified';
  await entry.save();

  // Send in-app notification to the client
  try {
    const stylistUser = await User.findById(stylist.userId);
    const stylistName = stylistUser?.name || stylist.name || 'Your stylist';
    const client = entry.clientId as unknown as { _id: string };
    const service = entry.serviceId as unknown as { name?: string };
    const serviceName = service?.name || 'a service';
    await createNotification({
      userId: client._id.toString(),
      type: 'waitlist',
      title: 'Spot Available!',
      message: `${stylistName} has a spot open for ${serviceName}! Book now before it's gone.`,
      link: `/app/stylist/${stylist.id}`,
      metadata: { waitlistEntryId: entry._id.toString(), stylistId: stylist.id.toString() },
    });
  } catch {
    // notification is best-effort
  }

  return sendSuccess(res, { entry }, 'Client notified');
});

export const removeWaitlistEntry = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const entry = await WaitlistEntry.findOneAndDelete({ _id: req.params.id, stylistId: stylist.id });
  if (!entry) throw new ApiError(404, 'Waitlist entry not found');

  return sendSuccess(res, null, 'Entry removed');
});
