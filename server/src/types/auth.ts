export type UserRole = 'client' | 'stylist' | 'admin';

export interface AuthUser {
  id: string;
  role: UserRole;
}
