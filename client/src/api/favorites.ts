import api from "./axios";

export const getFavorites = async () => {
  const res = await api.get("/favorites");
  return res.data.data.favorites;
};

export const addFavorite = async (stylistId: string) => {
  const res = await api.post("/favorites", { stylistId });
  return res.data.data.favorites;
};

export const removeFavorite = async (stylistId: string) => {
  const res = await api.delete(`/favorites/${stylistId}`);
  return res.data.data.favorites;
};
