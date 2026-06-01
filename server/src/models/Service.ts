import { Document, Schema, Types, model } from 'mongoose';

export interface IService extends Document {
  id: string;
  stylistId: Types.ObjectId;
  name: string;
  category: string;
  price: number;
  duration: number;
  isActive: boolean;
  popular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    stylistId: {
      type: Schema.Types.ObjectId,
      ref: 'Stylist',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    isActive: {
      type: Boolean,
      default: true
    },
    popular: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Service = model<IService>('Service', serviceSchema);
