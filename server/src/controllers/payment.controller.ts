import crypto from 'crypto';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Paystack from 'paystack-sdk';
import { Booking } from '../models/Booking';
import { Transaction } from '../models/Transaction';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { isProduction, appConfig } from '../config/app';
import logger from '../utils/logger';

const paystackSecret = appConfig.paystackSecretKey;
const paystack = new Paystack(paystackSecret);

const PLATFORM_FEE_PERCENT = 0.13;

export const initializePayment = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, paymentMethod } = req.body;
  const clientId = req.user?.id;

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
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT * 100);
  const amountInKobo = amount * 100;

  const user = req.user;
  const method: 'card' | 'mobile-money' | 'cash' = paymentMethod || 'card';

  let reference: string;
  let paymentData: any = null;

  if (!paystackSecret) {
    if (isProduction) {
      throw new ApiError(503, 'Payment service is not configured');
    }
    // Dev mode — simulate successful payment initialization
    reference = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } else {
    try {
      paymentData = await (paystack.transaction.initialize as any)({
        email: (user as any).email || 'customer@example.com',
        amount: String(amountInKobo),
        currency: 'GHS',
        callback_url: `${appConfig.clientUrl}/payment/callback`,
        metadata: {
          bookingId: booking.id,
          clientId: booking.clientId.toString(),
          stylistId: booking.stylistId.toString(),
          paymentMethod: method,
          platform_fee: platformFee,
        },
      });
    } catch (error) {
    logger.error('Payment initialization failed', { bookingId, error: (error as Error).message });
    throw new ApiError(503, 'Payment service is temporarily unavailable');
  }
    reference = paymentData.data.reference;
  }

  // Atomic: only create transaction if no duplicate paymentRef exists
  try {
    await Transaction.create({
      bookingId: booking.id,
      clientId: booking.clientId,
      stylistId: booking.stylistId,
      amount,
      platformFee: Math.round(amount * PLATFORM_FEE_PERCENT),
      stylistPayout: Math.round(amount * (1 - PLATFORM_FEE_PERCENT)),
      currency: 'GHS',
      status: 'pending',
      paymentProvider: 'paystack',
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
    authorization_url: paymentData?.data?.authorization_url ?? null,
    access_code: paymentData?.data?.access_code ?? null,
    reference,
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { reference } = req.params;

  let verification: any;
  try {
    verification = await (paystack.transaction.verify as any)(reference);
  } catch (error) {
    const transaction = await Transaction.findOne({ paymentRef: reference });
    if (!transaction) {
      throw new ApiError(404, 'Transaction not found');
    }
    return sendSuccess(res, { status: transaction.status, transaction });
  }

  if (verification.data.status === 'success') {
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
        const existing = await Transaction.findOne({ paymentRef: reference });
        logger.info('Audit: payment verify — already processed', { reference, status: existing?.status });
        return sendSuccess(res, { status: existing?.status || 'paid', transaction: existing });
      }

      const tx = result.transaction!;
      logger.info('Audit: payment verified', { reference, bookingId: tx.bookingId, amount: tx.amount });
      return sendSuccess(res, { status: 'paid', transaction: tx });
    } finally {
      session.endSession();
    }
  }

  return sendSuccess(res, {
    status: verification.data.status || 'failed',
  });
});

export const paystackWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!paystackSecret) {
    logger.warn('Paystack webhook received but PAYSTACK_SECRET_KEY is not configured');
    return res.status(200).json({ status: 'ok' });
  }

  const signature = req.headers['x-paystack-signature'] as string;
  if (!signature) {
    return res.status(401).json({ status: 'unauthorized' });
  }
  const hash = crypto
    .createHmac('sha512', paystackSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (hash !== signature) {
    return res.status(401).json({ status: 'invalid signature' });
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { reference } = event.data;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const transaction = await Transaction.findOneAndUpdate(
          { paymentRef: reference, status: 'pending' },
          { $set: { status: 'paid' } },
          { new: true, session },
        );
        if (transaction) {
          logger.info('Audit: payment webhook processed', { reference, bookingId: transaction.bookingId, amount: transaction.amount });
          await Booking.findByIdAndUpdate(
            transaction.bookingId,
            { paymentStatus: 'paid' },
            { session },
          );
        } else {
          logger.info('Audit: payment webhook skipped (already processed)', { reference });
        }
      });
    } finally {
      session.endSession();
    }
  }

  if (event.event === 'charge.failed') {
    const { reference } = event.data;
    logger.warn('Payment charge failed', { reference });
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
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT);
  const stylistPayout = amount - platformFee;

  if (!paystackSecret) {
    if (isProduction) throw new ApiError(503, 'Payment service is not configured');
    const devRef = `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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
          paymentProvider: 'paystack',
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

  const amountInKobo = amount * 100;
  let chargeResult: any;
  try {
    chargeResult = await (paystack as any).transaction.charge({
      token,
      email: (req.user as any).email || 'customer@example.com',
      amount: String(amountInKobo),
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

  if (chargeResult.data.status === 'success') {
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
          paymentProvider: 'paystack',
          paymentRef: chargeResult.data.reference,
          paymentMethod: 'card',
        }).save({ session });

        await Booking.findByIdAndUpdate(
          booking.id,
          { paymentId: chargeResult.data.reference, paymentStatus: 'paid' },
          { session },
        );
      });
    } finally {
      session.endSession();
    }
    return sendSuccess(res, { status: 'paid', reference: chargeResult.data.reference });
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
    paymentProvider: 'paystack',
    paymentRef: chargeResult.data.reference || 'FAILED',
    paymentMethod: 'card',
  });

  throw new ApiError(
    402,
    `Payment failed: ${chargeResult.data.gateway_response || 'Transaction declined'}`,
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
