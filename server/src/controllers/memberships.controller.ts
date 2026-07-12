import Paystack from 'paystack-sdk';
import { Request, Response } from 'express';
import { MembershipTier, MemberSubscription } from '../models/Membership';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { appConfig, isProduction } from '../config/app';
import logger from '../utils/logger';

const paystackSecret = appConfig.paystackSecretKey;
const paystack = paystackSecret ? new Paystack(paystackSecret) : null;

export const getStylistTiers = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findById(req.params.stylistId);
  if (!stylist) throw new ApiError(404, 'Stylist not found');

  const tiers = await MembershipTier.find({ stylistId: stylist.id, isActive: true }).sort({ price: 1 });
  return sendSuccess(res, { tiers });
});

export const getMyTiers = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const tiers = await MembershipTier.find({ stylistId: stylist.id }).sort({ price: 1 });
  return sendSuccess(res, { tiers });
});

export const createTier = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { name, description, price, billingCycle, benefits, discountPercent } = req.body;
  if (!name || price === undefined || !billingCycle) {
    throw new ApiError(400, 'Name, price, and billing cycle are required');
  }

  const tier = await MembershipTier.create({
    stylistId: stylist.id, name, description, price,
    billingCycle, benefits: benefits || [], discountPercent: discountPercent || 0
  });

  return sendSuccess(res, { tier }, 'Membership tier created', 201);
});

export const updateTier = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const tier = await MembershipTier.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!tier) throw new ApiError(404, 'Tier not found');

  const { name, description, price, billingCycle, benefits, discountPercent, isActive } = req.body;
  if (name !== undefined) tier.name = name;
  if (description !== undefined) tier.description = description;
  if (price !== undefined) tier.price = price;
  if (billingCycle !== undefined) tier.billingCycle = billingCycle;
  if (benefits !== undefined) tier.benefits = benefits;
  if (discountPercent !== undefined) tier.discountPercent = discountPercent;
  if (isActive !== undefined) tier.isActive = isActive;

  await tier.save();
  return sendSuccess(res, { tier }, 'Tier updated');
});

export const deleteTier = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const tier = await MembershipTier.findOneAndDelete({ _id: req.params.id, stylistId: stylist.id });
  if (!tier) throw new ApiError(404, 'Tier not found');

  return sendSuccess(res, null, 'Tier deleted');
});

export const subscribeToTier = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.user?.id;
  const { tierId, paymentRef } = req.body;

  if (!tierId) throw new ApiError(400, 'Tier ID is required');
  if (!paymentRef || typeof paymentRef !== 'string') throw new ApiError(400, 'paymentRef is required');

  const tier = await MembershipTier.findById(tierId);
  if (!tier) throw new ApiError(404, 'Membership tier not found');
  if (!tier.isActive) throw new ApiError(400, 'Tier is no longer available');

  const existing = await MemberSubscription.findOne({ tierId, clientId, status: 'active' });
  if (existing) throw new ApiError(400, 'You already have an active subscription to this tier');

  if (paystack && isProduction) {
    try {
      const verification = await (paystack.transaction.verify as any)(paymentRef);
      if (verification.data.status !== 'success') {
        throw new ApiError(402, 'Payment not verified');
      }
      const paidAmount = verification.data.amount / 100;
      if (Math.abs(paidAmount - tier.price) > 0.01) {
        throw new ApiError(402, 'Payment amount does not match tier price');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error('Paystack verification failed for membership subscription', { error: (err as Error).message });
      throw new ApiError(502, 'Payment verification failed');
    }
  }

  const nextBilling = new Date();
  switch (tier.billingCycle) {
    case 'weekly': nextBilling.setDate(nextBilling.getDate() + 7); break;
    case 'monthly': nextBilling.setMonth(nextBilling.getMonth() + 1); break;
    case 'quarterly': nextBilling.setMonth(nextBilling.getMonth() + 3); break;
    case 'yearly': nextBilling.setFullYear(nextBilling.getFullYear() + 1); break;
  }

  const subscription = await MemberSubscription.create({
    tierId: tier._id,
    stylistId: tier.stylistId,
    clientId,
    nextBillingDate: nextBilling,
    status: 'active',
    autoRenew: true,
  });

  return sendSuccess(res, { subscription }, 'Subscribed successfully', 201);
});

export const getMySubscribers = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const subscribers = await MemberSubscription.find({ stylistId: stylist.id })
    .populate('clientId', 'name email avatar')
    .populate('tierId', 'name price billingCycle')
    .sort({ startDate: -1 });

  return sendSuccess(res, { subscribers });
});
