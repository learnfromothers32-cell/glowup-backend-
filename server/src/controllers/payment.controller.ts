import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Booking } from '../models/Booking';
import { Transaction } from '../models/Transaction';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { isProduction, appConfig } from '../config/app';
import { getProvider, isProviderConfigured } from '../services/payment/factory';
import { CardPaymentProvider } from '../services/payment/types';
import {
  calculatePlatformFee,
  calculateStylistPayout,
  generateDevReference,
} from '../services/payment/utils/platform-fee';
import logger from '../utils/logger';

const DEFAULT_PROVIDER = 'paystack';

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, paymentMethod, paymentProvider } = req.body;
  const clientId = req.user?.id;
  const providerName: string = paymentProvider || DEFAULT_PROVIDER;

  const booking = await Booking.findById(bookingId).populate('serviceId');
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.clientId.toString() !== clientId) {
    throw new ApiError(403, 'You can only pay for your own bookings');
  }

  if (booking.paymentStatus === 'paid') {
    throw new ApiError(400, 'This booking has already been paid');
  }

  const amount = booking.totalPrice;
  const platformFee = calculatePlatformFee(amount);

  const user = req.user;
  const method: 'card' | 'mobile-money' | 'cash' = paymentMethod || 'card';

  let reference: string;
  let authorizationUrl: string | null = null;
  let accessCode: string | null = null;

  if (!isProviderConfigured(providerName)) {
    if (isProduction) {
      throw new ApiError(503, 'Payment service is not configured');
    }
    reference = generateDevReference();
  } else {
    try {
      const provider = getProvider(providerName);
      const result = await provider.initializePayment({
        amount,
        currency: 'GHS',
        email: (user as any).email || 'customer@example.com',
        callbackUrl: `${appConfig.clientUrl}/payment/callback`,
        metadata: {
          bookingId: booking.id,
          clientId: booking.clientId.toString(),
          stylistId: booking.stylistId.toString(),
          paymentMethod: method,
          platform_fee: platformFee,
        },
      });
      reference = result.reference;
      authorizationUrl = result.authorizationUrl;
      accessCode = result.accessCode;
    } catch (error) {
      logger.error('Payment initialization failed', { bookingId, error: (error as Error).message });
      throw new ApiError(503, 'Payment service is temporarily unavailable');
    }
  }

  try {
    await Transaction.create({
      bookingId: booking.id,
      clientId: booking.clientId,
      stylistId: booking.stylistId,
      amount,
      platformFee,
      stylistPayout: calculateStylistPayout(amount, platformFee),
      currency: 'GHS',
      status: 'pending',
      paymentProvider: providerName,
      paymentRef: reference,
      paymentMethod: method,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      throw new ApiError(409, 'Payment already initialized for this reference');
    }
    throw err;
  }

  booking.paymentId = reference;
  await booking.save();

  return sendSuccess(res, {
    authorization_url: authorizationUrl,
    access_code: accessCode,
    reference,
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { reference } = req.params;

  const existing = await Transaction.findOne({ paymentRef: reference });
  if (!existing) {
    throw new ApiError(404, 'Transaction not found');
  }

  let verification: { status: string; reference: string; amount: number; currency: string };
  try {
    const provider = getProvider(existing.paymentProvider);
    verification = await provider.verifyPayment(reference);
  } catch (error) {
    return sendSuccess(res, { status: existing.status, transaction: existing });
  }

  if (verification.status === 'success') {
    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        const transaction = await Transaction.findOneAndUpdate(
          { paymentRef: reference, status: 'pending' },
          { $set: { status: 'paid' } },
          { new: true, session },
        );
        if (!transaction) {
          return { alreadyProcessed: true };
        }

        await Booking.findByIdAndUpdate(
          transaction.bookingId,
          { paymentStatus: 'paid' },
          { session },
        );

        return { transaction };
      });

      if (result.alreadyProcessed) {
        const txn = await Transaction.findOne({ paymentRef: reference });
        logger.info('Audit: payment verify — already processed', { reference, status: txn?.status });
        return sendSuccess(res, { status: txn?.status || 'paid', transaction: txn });
      }

      const tx = result.transaction!;
      logger.info('Audit: payment verified', { reference, bookingId: tx.bookingId, amount: tx.amount });
      return sendSuccess(res, { status: 'paid', transaction: tx });
    } finally {
      session.endSession();
    }
  }

  return sendSuccess(res, {
    status: verification.status || 'failed',
  });
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const providerName: string = req.params.provider || DEFAULT_PROVIDER;

  if (!isProviderConfigured(providerName)) {
    logger.warn(`Webhook received for unconfigured provider: ${providerName}`);
    return res.status(200).json({ status: 'ok' });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const provider = getProvider(providerName);

  if (!provider.validateWebhookSignature(rawBody, req.headers as Record<string, string>)) {
    return res.status(401).json({ status: 'invalid signature' });
  }

  const webhookResult = provider.parseWebhookEvent(rawBody);

  if (webhookResult.event === 'success') {
    const { reference } = webhookResult;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const transaction = await Transaction.findOneAndUpdate(
          { paymentRef: reference, status: 'pending' },
          { $set: { status: 'paid' } },
          { new: true, session },
        );
        if (transaction) {
          logger.info('Audit: payment webhook processed', { reference, provider: providerName, bookingId: transaction.bookingId, amount: transaction.amount });
          await Booking.findByIdAndUpdate(
            transaction.bookingId,
            { paymentStatus: 'paid' },
            { session },
          );
        } else {
          logger.info('Audit: payment webhook skipped (already processed)', { reference, provider: providerName });
        }
      });
    } finally {
      session.endSession();
    }
  }

  if (webhookResult.event === 'failed') {
    const { reference } = webhookResult;
    logger.warn('Payment charge failed', { reference, provider: providerName });
    const transaction = await Transaction.findOneAndUpdate(
      { paymentRef: reference, status: 'pending' },
      { $set: { status: 'failed' } },
    );
    if (transaction) {
      await Booking.findByIdAndUpdate(transaction.bookingId, { paymentStatus: 'failed' });
    }
  }

  return res.status(200).json({ status: 'ok' });
});

export const chargeCard = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, token } = req.body;
  const clientId = req.user?.id;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.clientId.toString() !== clientId) throw new ApiError(403, 'You can only pay for your own bookings');
  if (booking.paymentStatus === 'paid') throw new ApiError(400, 'This booking has already been paid');

  const amount = booking.totalPrice;
  const platformFee = calculatePlatformFee(amount);
  const stylistPayout = calculateStylistPayout(amount, platformFee);

  const providerName = DEFAULT_PROVIDER;

  if (!isProviderConfigured(providerName)) {
    if (isProduction) throw new ApiError(503, 'Payment service is not configured');
    const devRef = generateDevReference();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await new Transaction({
          bookingId: booking.id,
          clientId: booking.clientId,
          stylistId: booking.stylistId,
          amount,
          platformFee,
          stylistPayout,
          currency: 'GHS',
          status: 'paid',
          paymentProvider: providerName,
          paymentRef: devRef,
          paymentMethod: 'card',
        }).save({ session });

        await Booking.findByIdAndUpdate(
          booking.id,
          { paymentId: devRef, paymentStatus: 'paid' },
          { session },
        );
      });
    } finally {
      session.endSession();
    }
    return sendSuccess(res, { status: 'paid', reference: devRef });
  }

  const provider = getProvider(providerName);
  if (!('chargeCard' in provider)) {
    throw new ApiError(501, 'Card charges are not supported by this payment provider');
  }
  const cardProvider = provider as CardPaymentProvider;

  let chargeResult: { status: string; reference: string; gatewayResponse?: string };
  try {
    chargeResult = await cardProvider.chargeCard({
      token,
      email: (req.user as any).email || 'customer@example.com',
      amount,
      currency: 'GHS',
      metadata: {
        bookingId: booking.id,
        clientId: booking.clientId.toString(),
        stylistId: booking.stylistId.toString(),
      },
    });
  } catch (error) {
    logger.error('Card charge failed', { error: (error as Error).message });
    throw new ApiError(503, 'Payment processing failed. Please try again.');
  }

  if (chargeResult.status === 'success') {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await new Transaction({
          bookingId: booking.id,
          clientId: booking.clientId,
          stylistId: booking.stylistId,
          amount,
          platformFee,
          stylistPayout,
          currency: 'GHS',
          status: 'paid',
          paymentProvider: providerName,
          paymentRef: chargeResult.reference,
          paymentMethod: 'card',
        }).save({ session });

        await Booking.findByIdAndUpdate(
          booking.id,
          { paymentId: chargeResult.reference, paymentStatus: 'paid' },
          { session },
        );
      });
    } finally {
      session.endSession();
    }
    return sendSuccess(res, { status: 'paid', reference: chargeResult.reference });
  }

  await Transaction.create({
    bookingId: booking.id,
    clientId: booking.clientId,
    stylistId: booking.stylistId,
    amount,
    platformFee,
    stylistPayout,
    currency: 'GHS',
    status: 'failed',
    paymentProvider: providerName,
    paymentRef: chargeResult.reference || 'FAILED',
    paymentMethod: 'card',
  });

  throw new ApiError(
    402,
    `Payment failed: ${chargeResult.gatewayResponse || 'Transaction declined'}`,
  );
});

export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const transaction = await Transaction.findOne({ bookingId })
    .sort({ createdAt: -1 });

  if (!transaction) {
    return sendSuccess(res, { status: 'no_payment', transaction: null });
  }

  return sendSuccess(res, {
    status: transaction.status,
    transaction: {
      id: transaction.id,
      amount: transaction.amount,
      platformFee: transaction.platformFee,
      stylistPayout: transaction.stylistPayout,
      currency: transaction.currency,
      status: transaction.status,
      paymentRef: transaction.paymentRef,
      paymentMethod: transaction.paymentMethod,
      createdAt: transaction.createdAt,
    },
  });
});

export const getMyTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const stylist = await Stylist.findOne({ userId });

  let transactions;
  if (stylist) {
    transactions = await Transaction.find({ stylistId: stylist.id })
      .populate('bookingId')
      .sort({ createdAt: -1 });
  } else {
    transactions = await Transaction.find({ clientId: userId })
      .populate('bookingId')
      .sort({ createdAt: -1 });
  }

  return sendSuccess(res, { transactions });
});
