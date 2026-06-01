import api from './axios';
import type { Stylist } from "@/domain/stylist/stylist.types";
import { mapToUIStylist } from "@/domain/stylist/stylist.adapter";

export interface StylistsResponse {
  success: boolean;
  data: {
    stylists: any[];
  };
}

export interface StylistDetailResponse {
  success: boolean;
  data: {
    stylist: any;
  };
}

export const getStylists = async (params?: any): Promise<Stylist[]> => {
  const { data } = await api.get<StylistsResponse>('/stylists', { params });
  return data.data.stylists.map(mapToUIStylist);
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
  profile: { phone: string; location: string; bio: string };
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
