// src/domain/booking/booking.types.ts

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type Booking = {
  id: string;

  // relationships
  userId: string;
  stylistId: string;
  serviceId: string;

  // scheduling
  scheduledAt: string; // ISO datetime

  // financial snapshot (VERY IMPORTANT)
  priceAtBooking: number;

  // state
  status: BookingStatus;

  // metadata
  createdAt: string;
};