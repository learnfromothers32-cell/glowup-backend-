import { Document, Schema, Types, model } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  image: string;
  category: string;
  tags: string[];
  author: string;
  authorId: Types.ObjectId;
  readTime: string;
  published: boolean;
  publishedAt: Date | null;
  featured: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function estimateReadTime(content: string[]): string {
  const wordCount = content.reduce((sum, p) => sum + p.split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

const articleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    content: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Content must have at least one paragraph',
      },
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Hair', 'Barber', 'Skin', 'Nails', 'Lashes'],
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    readTime: {
      type: String,
      default: '1 min read',
    },
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

articleSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = generateSlug(this.title);
  }
  if (this.isModified('content')) {
    this.readTime = estimateReadTime(this.content);
  }
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

articleSchema.index({ published: 1, featured: -1, createdAt: -1 });
articleSchema.index({ published: 1, category: 1, createdAt: -1 });
articleSchema.index({ tags: 1 });

export const Article = model<IArticle>('Article', articleSchema);
