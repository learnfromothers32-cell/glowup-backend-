// src/domain/review/review.types.ts

export type Review = {
  id: string;

  // relationships
  stylistId: string;
  clientId: string;

  // content
  rating: number; // 1 - 5
  comment: string;

  // metadata
  createdAt: string;
};