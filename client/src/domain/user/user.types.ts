// src/domain/user/user.types.ts

export type UserRole = "client" | "stylist";

export type User = {
  id: string;

  name: string;
  email: string;

  role: UserRole;

  avatar?: string;

  createdAt: string;
};