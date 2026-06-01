import bcrypt from 'bcryptjs';
import { Document, Schema, model } from 'mongoose';
import { UserRole } from '../types/auth';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  points: number;
  actionCounts: {
    bookings: number;
    favorites: number;
    reviews: number;
    likes: number;
    shares: number;
  };
  badges: string[];
  refreshTokenHash?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['client', 'stylist', 'admin'],
      default: 'client'
    },
    avatar: {
      type: String
    },
    phone: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    points: {
      type: Number,
      default: 0
    },
    actionCounts: {
      bookings: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      reviews: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    },
    badges: {
      type: [String],
      default: []
    },
    refreshTokenHash: {
      type: String
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String
    },
    emailVerificationExpires: {
      type: Date
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(
  password: string
) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>('User', userSchema);
