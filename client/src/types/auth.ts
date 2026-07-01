// src/types/auth.ts
export type UserRole = "client" | "stylist" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  createdAt?: string;
}