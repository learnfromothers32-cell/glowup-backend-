import { Document, Schema, Types, model } from 'mongoose';

export interface IPosLineItem {
  type: 'service' | 'product' | 'package';
  itemId: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IPosTransaction extends Document {
  stylistId: Types.ObjectId;
  clientId?: Types.ObjectId;
  clientName: string;
  items: IPosLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile-money' | 'gift-card';
  paymentRef: string;
  status: 'completed' | 'refunded' | 'voided';
  notes: string;
  receiptNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const posLineItemSchema = new Schema<IPosLineItem>(
  {
    type: {
      type: String,
      enum: ['service', 'product', 'package'],
      required: true
    },
    itemId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const posTransactionSchema = new Schema<IPosTransaction>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    clientName: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [posLineItemSchema],
      default: []
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile-money', 'gift-card'],
      default: 'cash'
    },
    paymentRef: { type: String, default: '' },
    status: {
      type: String,
      enum: ['completed', 'refunded', 'voided'],
      default: 'completed'
    },
    notes: { type: String, default: '' },
    receiptNumber: { type: String, required: true }
  },
  { timestamps: true }
);

posTransactionSchema.index({ stylistId: 1, createdAt: -1 });

export const PosTransaction = model<IPosTransaction>('PosTransaction', posTransactionSchema);
