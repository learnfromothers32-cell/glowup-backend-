import api from "./axios";

export interface CreateReviewData {
  bookingId: string;
  rating: number;
  comment?: string;
  images?: string[];
}

export const createReview = async (data: CreateReviewData) => {
  const res = await api.post("/reviews", data);
  return res.data;
};

export const getStylistReviews = async (stylistId: string) => {
  const res = await api.get(`/reviews/stylist/${stylistId}`);
  return res.data.data.reviews;
};

export const deleteReview = async (reviewId: string) => {
  const res = await api.delete(`/reviews/${reviewId}`);
  return res.data;
};
