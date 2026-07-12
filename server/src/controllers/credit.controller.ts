import Paystack from 'paystack-sdk';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { CreditPackage } from '../models/CreditPackage';
import { UserCredit } from '../models/UserCredit';
import { appConfig, isProduction } from '../config/app';
import logger from '../utils/logger';

const paystackSecret = appConfig.paystackSecretKey;
const paystack = paystackSecret ? new Paystack(paystackSecret) : null;

export const getCreditPackages = asyncHandler(async (_req: Request, res: Response) => {
  const packages = await CreditPackage.find({ active: true }).sort({ price: 1 });
  return sendSuccess(res, { packages });
});

export const getMyCredits = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  let credit = await UserCredit.findOne({ userId });
  if (!credit) {
    credit = await UserCredit.create({ userId, balance: 5, lifetimeCredits: 5, transactions: [{ type: 'bonus', amount: 5, description: 'Welcome bonus – 5 free credits' }] });
  }
  return sendSuccess(res, { credits: { balance: credit.balance, lifetimeCredits: credit.lifetimeCredits, transactions: credit.transactions.slice(-20).reverse() } });
});

export const purchaseCredits = asyncHandler(async (req: Request, res: Response) => {
  const { packageId, paymentRef } = req.body;
  const userId = req.user?.id;
  const creditPackage = await CreditPackage.findById(packageId);
  if (!creditPackage || !creditPackage.active) throw new ApiError(404, 'Credit package not found');

  if (!paymentRef || typeof paymentRef !== 'string') {
    throw new ApiError(400, 'paymentRef is required');
  }

  if (paystack && isProduction) {
    try {
      const verification = await (paystack.transaction.verify as any)(paymentRef);
      if (verification.data.status !== 'success') {
        throw new ApiError(402, 'Payment not verified');
      }
      const paidAmount = verification.data.amount / 100;
      if (Math.abs(paidAmount - creditPackage.price) > 0.01) {
        throw new ApiError(402, 'Payment amount does not match package price');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error('Paystack verification failed for credit purchase', { error: (err as Error).message });
      throw new ApiError(502, 'Payment verification failed');
    }
  }

  let credit = await UserCredit.findOne({ userId });
  if (!credit) {
    credit = await UserCredit.create({ userId, balance: 0, lifetimeCredits: 0, transactions: [] });
  }
  credit.balance += creditPackage.credits;
  credit.lifetimeCredits += creditPackage.credits;
  credit.transactions.push({ type: 'purchase', amount: creditPackage.credits, description: `Purchased ${creditPackage.name} (${creditPackage.credits} credits)`, reference: paymentRef, createdAt: new Date() });
  await credit.save();
  return sendSuccess(res, { credits: { balance: credit.balance, lifetimeCredits: credit.lifetimeCredits } }, `${creditPackage.credits} credits added`);
});
