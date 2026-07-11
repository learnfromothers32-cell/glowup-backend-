import api from './axios';
import type { Stylist } from "@/domain/stylist/stylist.types";
import { mapToUIStylist } from "@/domain/stylist/stylist.adapter";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StylistsResponse {
  success: boolean;
  data: {
    stylists: any[];
    pagination?: PaginationMeta;
  };
}

export interface StylistDetailResponse {
  success: boolean;
  data: {
    stylist: any;
  };
}

export const getStylists = async (params?: any): Promise<{ stylists: Stylist[]; pagination: PaginationMeta | null }> => {
  const { data } = await api.get<StylistsResponse>('/stylists', { params });
  return {
    stylists: data.data.stylists.map(mapToUIStylist),
    pagination: data.data.pagination ?? null,
  };
};

export const getStylistById = async (id: string): Promise<Stylist> => {
  const { data } = await api.get<StylistDetailResponse>(`/stylists/${id}`);
  return mapToUIStylist(data.data.stylist);
};

export const getStylistServices = async (id: string): Promise<any[]> => {
  const { data } = await api.get(`/stylists/${id}/services`);
  return data.data.services;
};

export const getMyStylistProfile = async (): Promise<Stylist> => {
  const { data } = await api.get<StylistDetailResponse>('/stylists/me');
  return mapToUIStylist(data.data.stylist);
};

export const saveOnboarding = async (payload: {
  profile: { phone: string; location: { area: string; lat: number; lng: number } | string; bio: string };
  services: { name: string; duration: string; price: string }[];
  schedule: Record<string, { enabled: boolean; start: string; end: string }>;
}): Promise<any> => {
  const { data } = await api.post('/stylists/onboarding', payload);
  return data.data.stylist;
};

export const updateMyProfile = async (payload: {
  name?: string;
  bio?: string;
  category?: string;
  location?: { area: string; lat?: number; lng?: number };
  phone?: string;
  image?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
}): Promise<Stylist> => {
  const { data } = await api.put<StylistDetailResponse>('/stylists/me', payload);
  return mapToUIStylist(data.data.stylist);
};

export const addMyService = async (payload: {
  name: string;
  category?: string;
  price: number;
  duration: number;
}): Promise<any> => {
  const { data } = await api.post('/stylists/services', payload);
  return data.data.service;
};

export const updateMyService = async (
  id: string,
  payload: {
    name?: string;
    category?: string;
    price?: number;
    duration?: number;
    isActive?: boolean;
  }
): Promise<any> => {
  const { data } = await api.put(`/stylists/services/${id}`, payload);
  return data.data.service;
};

export const deleteMyService = async (id: string): Promise<void> => {
  await api.delete(`/stylists/services/${id}`);
};

export const uploadPortfolioImage = async (formData: FormData): Promise<any> => {
  const { data } = await api.post('/stylists/portfolio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const savePortfolioMedia = async (formData: FormData, signal?: AbortSignal): Promise<any> => {
  const { data } = await api.post('/stylists/portfolio/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
  });
  return data.data;
};

export const uploadProfileImage = async (formData: FormData): Promise<any> => {
  const { data } = await api.post('/stylists/me/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const removePortfolioImage = async (url: string): Promise<void> => {
  await api.delete('/stylists/portfolio', { data: { url } });
};

export const addBeforeAfter = async (formData: FormData): Promise<any> => {
  const { data } = await api.post('/stylists/before-after', formData);
  return data.data;
};

export const addTransformation = async (formData: FormData): Promise<any> => {
  const { data } = await api.post('/stylists/before-after', formData);
  return data.data;
};

export const removeBeforeAfter = async (id: string): Promise<any> => {
  const { data } = await api.delete(`/stylists/before-after/${id}`);
  return data.data;
};

export const getMyTrendingStats = async (): Promise<any[]> => {
  const { data } = await api.get('/stylists/me/trending');
  return data.data.engagements || [];
};
