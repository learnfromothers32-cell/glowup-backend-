import { Document, Schema, Types, model } from 'mongoose';

export interface BeforeAfterItem {
  before: string;
  after: string;
  caption?: string;
  service?: string;
}

export interface IStylist extends Document {
  id: string;
  userId?: Types.ObjectId;
  name: string;
  bio: string;
  category: string;
  location: {
    area: string;
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  isLive: boolean;
  isVerified: boolean;
  image?: string;
  price?: string;
  priceRange?: string;
  portfolioImages: string[];
  beforeAfter: BeforeAfterItem[];
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const beforeAfterSchema = new Schema<BeforeAfterItem>(
  {
    before: { type: String, required: true },
    after: { type: String, required: true },
    caption: { type: String },
    service: { type: String }
  },
  { _id: false }
);

const stylistSchema = new Schema<IStylist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    location: {
      area: { type: String, required: true, trim: true },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    isLive: {
      type: Boolean,
      default: false,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    image: {
      type: String
    },
    price: {
      type: String
    },
    priceRange: {
      type: String
    },
    portfolioImages: {
      type: [String],
      default: []
    },
    beforeAfter: {
      type: [beforeAfterSchema],
      default: []
    },
    queuePosition: {
      type: Number
    },
    estimatedWaitMinutes: {
      type: Number
    }
  },
  { timestamps: true }
);

stylistSchema.index({ name: 'text', bio: 'text', category: 'text', 'location.area': 'text' });

export const Stylist = model<IStylist>('Stylist', stylistSchema);
