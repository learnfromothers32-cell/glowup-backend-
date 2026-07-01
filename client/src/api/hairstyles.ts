import api from "./axios";

export interface Hairstyle {
  _id: string;
  id: string;
  name: string;
  slug: string;
  category: "men" | "women" | "unisex";
  gender?: "male" | "female";
  previewImage: string;
  templateImage?: string;
  prompt?: string;
  active: boolean;
  createdAt: string;
}

export interface FaceAnalysis {
  faceShape: string;
  confidence: number;
}

export interface GenerationInfo {
  provider: string;
  imageUrl: string;
}

export interface HairstyleResult {
  _id: string;
  id: string;
  userId: string;
  originalImage: string;
  generatedImage?: string;
  hairstyleId: Hairstyle | string;
  favorite: boolean;
  createdAt: string;
}

export interface GenerateResponse {
  result: HairstyleResult;
  generation: GenerationInfo;
  credits?: { balance: number };
}

export const getHairstyles = async (params?: { category?: string; gender?: string }) => {
  const res = await api.get("/hairstyles", { params });
  return res.data.data.hairstyles as Hairstyle[];
};

export const getHairstyleById = async (id: string) => {
  const res = await api.get(`/hairstyles/${id}`);
  return res.data.data.hairstyle as Hairstyle;
};

export const generateHairstyle = async (hairstyleId: string, image: File, hairMask?: string) => {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("hairstyleId", hairstyleId);
  if (hairMask) {
    const maskBlob = await (await fetch(hairMask)).blob();
    formData.append("mask", maskBlob, "mask.png");
  }

  const res = await api.post<{ success: boolean; data: GenerateResponse }>("/hairstyles/generate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 90000,
  });

  return res.data.data;
};

export const getResults = async () => {
  const res = await api.get("/hairstyles/results");
  return res.data.data.results as HairstyleResult[];
};

export const getResultById = async (id: string) => {
  const res = await api.get(`/hairstyles/results/${id}`);
  return res.data.data.result as HairstyleResult;
};

export const deleteResult = async (id: string) => {
  const res = await api.delete(`/hairstyles/results/${id}`);
  return res.data;
};

export const saveFavorite = async (resultId: string) => {
  const res = await api.post("/hairstyles/favorites", { resultId });
  return res.data.data.result as HairstyleResult;
};

export const getFavoriteResults = async () => {
  const res = await api.get("/hairstyles/favorites");
  return res.data.data.results as HairstyleResult[];
};
