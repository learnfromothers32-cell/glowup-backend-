import { Document, Schema, Types, model } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

export interface IBooking extends Document {
  id: string;
  clientId: Types.ObjectId;
  stylistId: Types.ObjectId;
  serviceId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  totalPrice: number;
  notes?: string;
  paymentId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
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
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    },
    paymentId: {
      type: String
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Index for checking availability/conflicts
bookingSchema.index({ stylistId: 1, startTime: 1, endTime: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
