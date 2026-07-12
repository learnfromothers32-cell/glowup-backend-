import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { PosTransaction } from '../models/PosTransaction';
import { Product } from '../models/Product';
import { Stylist } from '../models/Stylist';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';

const generateReceiptNumber = (prefix: string = 'RCP') => {
  const num = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}-${num}`;
};

export const getMyPosTransactions = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { status, paymentMethod } = req.query;
  const filter: any = { stylistId: stylist.id };
  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  const transactions = await PosTransaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(100);

  return sendSuccess(res, { transactions });
});

export const createPosTransaction = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const { clientName, clientId, items, discount, paymentMethod, paymentRef, notes } = req.body;

  if (!items || !items.length) throw new ApiError(400, 'At least one item is required');
  if (!clientName?.trim()) throw new ApiError(400, 'Client name is required');

  let subtotal = 0;
  const processedItems = items.map((item: any) => {
    const total = item.quantity * item.unitPrice;
    subtotal += total;
    return {
      type: item.type || 'product',
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total
    };
  });

  const discountAmount = discount || 0;
  const tax = 0;
  const total = subtotal - discountAmount + tax;

  const session = await mongoose.startSession();
  let transaction: InstanceType<typeof PosTransaction>;
  try {
    await session.withTransaction(async () => {
      for (const item of processedItems) {
        if (item.type === 'product') {
          const updated = await Product.findByIdAndUpdate(
            item.itemId,
            { $inc: { stock: -item.quantity } },
            { new: true, session },
          );
          if (!updated || updated.stock < 0) {
            throw new ApiError(409, `Insufficient stock for ${item.name}`);
          }
        }
      }

      const created = await PosTransaction.create([{
        stylistId: stylist.id, clientName, clientId: clientId || null,
        items: processedItems, subtotal, discount: discountAmount,
        tax, total, paymentMethod: paymentMethod || 'cash',
        paymentRef: paymentRef || '', receiptNumber: generateReceiptNumber(),
        status: 'completed', notes: notes || ''
      }], { session });

      transaction = created[0];
    });

    return sendSuccess(res, { transaction: transaction! }, 'Transaction completed', 201);
  } finally {
    session.endSession();
  }
});

export const voidPosTransaction = asyncHandler(async (req: Request, res: Response) => {
  const stylist = await Stylist.findOne({ userId: req.user?.id });
  if (!stylist) throw new ApiError(404, 'Stylist profile not found');

  const transaction = await PosTransaction.findOne({ _id: req.params.id, stylistId: stylist.id });
  if (!transaction) throw new ApiError(404, 'Transaction not found');

  if (transaction.status !== 'completed') {
    throw new ApiError(400, 'Only completed transactions can be voided');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of transaction.items) {
        if (item.type === 'product') {
          await Product.findByIdAndUpdate(
            item.itemId,
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
      }

      transaction.status = 'voided';
      await transaction.save({ session });
    });

    return sendSuccess(res, { transaction }, 'Transaction voided');
  } finally {
    session.endSession();
  }
});
