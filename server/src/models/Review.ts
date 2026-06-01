import { Document, Schema, Types, model } from 'mongoose';

export interface IReview extends Document {
  id: string;
  bookingId: Types.ObjectId;
  clientId: Types.ObjectId;
  stylistId: Types.ObjectId;
  rating: number;
  comment?: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true // One review per booking
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    images: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

// Update stylist rating on new review
reviewSchema.post('save', async function() {
  const Stylist = model('Stylist');
  const reviews = await model('Review').find({ stylistId: this.stylistId });
  
  const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
  
  await Stylist.findByIdAndUpdate(this.stylistId, {
    rating: avgRating,
    reviewCount: reviews.length
  });
});

export const Review = model<IReview>('Review', reviewSchema);
