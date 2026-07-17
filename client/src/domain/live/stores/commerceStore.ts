import { create } from "zustand";

export type LiveAvailability = "available" | "busy" | "fully-booked" | "on-break" | "queue-only";

export interface PinnedServiceData {
  serviceId: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

export interface LiveService {
  _id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  popular?: boolean;
}

export interface LiveStylistProfile {
  _id: string;
  name: string;
  image?: string;
  category: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  followerCount: number;
  isFollowing: boolean;
}

export interface CommerceState {
  pinnedService: PinnedServiceData | null;
  availability: LiveAvailability;
  shelfVisible: boolean;
  services: LiveService[];
  stylistProfile: LiveStylistProfile | null;
  setPinnedService: (service: PinnedServiceData | null) => void;
  setAvailability: (availability: LiveAvailability) => void;
  setShelfVisible: (visible: boolean) => void;
  setServices: (services: LiveService[]) => void;
  setStylistProfile: (profile: LiveStylistProfile | null) => void;
  reset: () => void;
}

const initialState = {
  pinnedService: null,
  availability: "available" as LiveAvailability,
  shelfVisible: false,
  services: [],
  stylistProfile: null,
};

export const useCommerceStore = create<CommerceState>((set) => ({
  ...initialState,
  setPinnedService: (pinnedService) => set({ pinnedService }),
  setAvailability: (availability) => set({ availability }),
  setShelfVisible: (shelfVisible) => set({ shelfVisible }),
  setServices: (services) => set({ services }),
  setStylistProfile: (stylistProfile) => set({ stylistProfile }),
  reset: () => set(initialState),
}));
