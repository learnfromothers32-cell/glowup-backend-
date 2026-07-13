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

function paymentLog(level: 'info' | 'warn' | 'error', msg: string, ctx: Record<string, unknown>) {
  logger[level](msg, ctx);
}

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, paymentMethod, paymentProvider } = req.body;
  const clientId = req.user?.id;
  const providerName: string = paymentProvider || DEFAULT_PROVIDER;
  const startTime = Date.now();

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
    paymentLog('info', 'Dev mode: generated reference', { reference, bookingId, provider: providerName });
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
      paymentLog('info', 'Payment initialized', {
        reference,
        bookingId,
        amount,
        provider: providerName,
        method,
        ms: Date.now() - startTime,
      });
    } catch (error) {
      paymentLog('error', 'Payment initialization failed', {
        bookingId,
        provider: providerName,
        error: (error as Error).message,
        ms: Date.now() - startTime,
      });
      throw new ApiError(503, 'Payment service is temporarily unavailable');
    }
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Transaction.create([{
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
      }], { session });

      booking.paymentId = reference;
      await booking.save({ session });
    });
  } catch (err: any) {
    if (err.code === 11000) {
      throw new ApiError(409, 'Payment already initialized for this reference');
    }
    paymentLog('error', 'Failed to persist payment initialization', {
      reference,
      bookingId,
      error: err.message,
    });
    throw err;
  } finally {
    session.endSession();
  }

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

  if (existing.status !== 'pending') {
    return sendSuccess(res, { status: existing.status, transaction: existing });
  }

  let verification: { status: string; reference: string; amount: number; currency: string };
  try {
    const provider = getProvider(existing.paymentProvider);
    verification = await provider.verifyPayment(reference);
  } catch (error) {
    paymentLog('warn', 'Provider verify call failed, returning current status', {
      reference,
      provider: existing.paymentProvider,
      error: (error as Error).message,
    });
    return sendSuccess(res, { status: existing.status, transaction: existing });
  }

  if (verification.status === 'success') {
    const expectedAmount = existing.amount;
    if (Math.abs(verification.amount - expectedAmount) > 0.01) {
      paymentLog('warn', 'Amount mismatch on verification', {
        reference,
        expected: expectedAmount,
        received: verification.amount,
      });
      throw new ApiError(402, 'Payment amount mismatch');
    }

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
        paymentLog('info', 'Verify: already processed', { reference, status: txn?.status });
        return sendSuccess(res, { status: txn?.status || 'paid', transaction: txn });
      }

      const tx = result.transaction!;
      paymentLog('info', 'Verify: payment confirmed', {
        reference,
        bookingId: tx.bookingId,
        amount: tx.amount,
        provider: existing.paymentProvider,
      });
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
    paymentLog('warn', 'Webhook for unconfigured provider', { provider: providerName });
    return res.status(200).json({ status: 'ok' });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const provider = getProvider(providerName);

  if (!provider.validateWebhookSignature(rawBody, req.headers as Record<string, string>)) {
    paymentLog('warn', 'Webhook invalid signature', { provider: providerName });
    return res.status(401).json({ status: 'invalid signature' });
  }

  const webhookResult = provider.parseWebhookEvent(rawBody);

  if (webhookResult.event === 'unknown') {
    paymentLog('warn', 'Webhook unknown event type', { provider: providerName });
    return res.status(200).json({ status: 'ok' });
  }

  const { reference } = webhookResult;
  if (!reference) {
    paymentLog('warn', 'Webhook missing reference', { provider: providerName });
    return res.status(200).json({ status: 'ok' });
  }

  if (webhookResult.event === 'success') {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const transaction = await Transaction.findOne({ paymentRef: reference, status: 'pending' }).session(session);
        if (!transaction) {
          paymentLog('info', 'Webhook success: already processed', { reference, provider: providerName });
          return;
        }

        if (webhookResult.amount !== undefined) {
          if (Math.abs(webhookResult.amount - transaction.amount) > 0.01) {
            paymentLog('warn', 'Webhook amount mismatch', {
              reference,
              expected: transaction.amount,
              received: webhookResult.amount,
            });
            return;
          }
        }

        transaction.status = 'paid';
        await transaction.save({ session });

        await Booking.findByIdAndUpdate(
          transaction.bookingId,
          { paymentStatus: 'paid' },
          { session },
        );

        paymentLog('info', 'Webhook: payment confirmed', {
          reference,
          provider: providerName,
          bookingId: transaction.bookingId,
          amount: transaction.amount,
        });
      });
    } finally {
      session.endSession();
    }
  }

  if (webhookResult.event === 'failed') {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const transaction = await Transaction.findOne({ paymentRef: reference, status: 'pending' }).session(session);
        if (!transaction) {
          paymentLog('info', 'Webhook failed: already processed', { reference, provider: providerName });
          return;
        }

        transaction.status = 'failed';
        await transaction.save({ session });

        await Booking.findByIdAndUpdate(
          transaction.bookingId,
          { paymentStatus: 'failed' },
          { session },
        );

        paymentLog('warn', 'Webhook: payment failed', {
          reference,
          provider: providerName,
          bookingId: transaction.bookingId,
        });
      });
    } finally {
      session.endSession();
    }
  }

  return res.status(200).json({ status: 'ok' });
});

export const chargeCard = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, token, paymentProvider } = req.body;
  const clientId = req.user?.id;
  const providerName: string = paymentProvider || DEFAULT_PROVIDER;
  const startTime = Date.now();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.clientId.toString() !== clientId) throw new ApiError(403, 'You can only pay for your own bookings');
  if (booking.paymentStatus === 'paid') throw new ApiError(400, 'This booking has already been paid');

  const amount = booking.totalPrice;
  const platformFee = calculatePlatformFee(amount);
  const stylistPayout = calculateStylistPayout(amount, platformFee);

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
    paymentLog('info', 'Dev mode: card charge simulated', { reference: devRef, bookingId });
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
    paymentLog('error', 'Card charge API call failed', {
      bookingId,
      provider: providerName,
      error: (error as Error).message,
      ms: Date.now() - startTime,
    });
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
    paymentLog('info', 'Card charge succeeded', {
      reference: chargeResult.reference,
      bookingId,
      amount,
      provider: providerName,
      ms: Date.now() - startTime,
    });
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

  paymentLog('warn', 'Card charge declined', {
    reference: chargeResult.reference,
    bookingId,
    provider: providerName,
    ms: Date.now() - startTime,
  });

  throw new ApiError(402, 'Payment failed: transaction declined');
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

  const query = stylist
    ? { $or: [{ stylistId: stylist.id }, { clientId: userId }] }
    : { clientId: userId };

  const transactions = await Transaction.find(query)
    .populate('bookingId')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { transactions });
});
