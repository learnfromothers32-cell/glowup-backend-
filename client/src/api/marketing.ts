import api from './axios';

export const getMyPromoCodes = async () => {
  const { data } = await api.get('/marketing/promos');
  return data.data.promos;
};

export const createPromoCode = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/marketing/promos', payload);
  return data.data.promo;
};

export const updatePromoCode = async (id: string, payload: Record<string, unknown>) => {
  const { data } = await api.put(`/marketing/promos/${id}`, payload);
  return data.data.promo;
};

export const deletePromoCode = async (id: string) => {
  await api.delete(`/marketing/promos/${id}`);
};

export const getMyGiftCards = async () => {
  const { data } = await api.get('/marketing/gift-cards');
  return data.data.giftCards;
};

export const createGiftCard = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/marketing/gift-cards', payload);
  return data.data.giftCard;
};
