import { Document, Schema, Types, model } from 'mongoose';

export interface ITransaction extends Document {
  id: string;
  bookingId: Types.ObjectId;
  clientId: Types.ObjectId;
  stylistId: Types.ObjectId;
  amount: number;
  platformFee: number;
  stylistPayout: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentProvider: 'paystack' | 'mtn-momo' | 'stripe' | 'mpesa';
  paymentRef: string;
  providerReference?: string;
  providerMetadata?: Record<string, any>;
  paymentMethod: 'card' | 'mobile-money' | 'cash';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    amount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, default: 0 },
    stylistPayout: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'GHS' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentProvider: { type: String, enum: ['paystack', 'mtn-momo', 'stripe', 'mpesa'], default: 'paystack' },
    paymentRef: { type: String, required: true },
    providerReference: { type: String },
    providerMetadata: { type: Schema.Types.Mixed, default: {} },
    paymentMethod: {
      type: String,
      enum: ['card', 'mobile-money', 'cash'],
      default: 'card'
    },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

transactionSchema.index({ paymentRef: 1 }, { unique: true });
transactionSchema.index({ providerReference: 1 }, { sparse: true });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
