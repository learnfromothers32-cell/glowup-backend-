import { Document, Schema, Types, model } from 'mongoose';

export interface PortfolioItem {
  url: string;
  type: 'image' | 'video';
}

export interface BeforeAfterItem {
  _id?: Types.ObjectId;
  before?: string;
  after: string;
  caption?: string;
  service?: string;
  mediaType?: 'image' | 'video';
  createdAt?: Date;
}

export interface IStylist extends Document {
  id: string;
  userId?: Types.ObjectId;
  name: string;
  bio: string;
  phone?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  category: string;
  location: {
    area: string;
    lat: number;
    lng: number;
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  image?: string;
  price?: string;
  priceRange?: string;
  portfolioImages: PortfolioItem[];
  beforeAfter: BeforeAfterItem[];
  followerCount: number;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const beforeAfterSchema = new Schema<BeforeAfterItem>(
  {
    before: { type: String },
    after: { type: String, required: true },
    caption: { type: String },
    service: { type: String },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
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
    phone: {
      type: String,
      trim: true
    },
    instagram: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    tiktok: {
      type: String,
      trim: true
    },
    website: {
      type: String,
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
    isVerified: {
      type: Boolean,
      default: false
    },
    followerCount: {
      type: Number,
      default: 0
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
      type: [{ url: { type: String, required: true }, type: { type: String, enum: ['image', 'video'], default: 'image' } }],
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
stylistSchema.index({ isVerified: -1, rating: -1, createdAt: -1, _id: 1 });


export const Stylist = model<IStylist>('Stylist', stylistSchema);
