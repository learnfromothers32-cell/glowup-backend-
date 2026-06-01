// src/domain/service/service.types.ts

export type Service = {
  id: string;

  // relationship
  stylistId: string;

  // core info
  name: string;
  category: string;

  // pricing + time (critical for bookings)
  price: number;
  duration: number; // in minutes

  // state
  isActive: boolean;

  // metadata
  createdAt: string;
};