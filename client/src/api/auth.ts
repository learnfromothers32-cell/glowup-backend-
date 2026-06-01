import api from './axios';
import type { User, UserRole } from '../types/auth';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    name,
    email,
    password,
    role,
  });
  return data;
};

export const getMe = async (): Promise<{ success: boolean; data: { user: User } }> => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const socialLogin = async (idToken: string, role: UserRole): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/social-login', { idToken, role });
  return data;
};

export const refreshToken = async (): Promise<AuthResponse> => {
  const { data } = await api.get<AuthResponse>('/auth/refresh');
  return data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const updateProfile = async (data: { name?: string; phone?: string; location?: string; avatar?: string }): Promise<{ success: boolean; message: string; data: { user: User } }> => {
  const res = await api.put('/auth/profile', data);
  return res.data;
};
