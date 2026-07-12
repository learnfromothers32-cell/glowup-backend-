import api from './axios';

export const getStylistTiers = async (stylistId: string) => {
  const { data } = await api.get(`/memberships/stylist/${stylistId}/tiers`);
  return data.data.tiers;
};

export const getMyTiers = async () => {
  const { data } = await api.get('/memberships/tiers');
  return data.data.tiers;
};

export const createTier = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/memberships/tiers', payload);
  return data.data.tier;
};

export const updateTier = async (id: string, payload: Record<string, unknown>) => {
  const { data } = await api.put(`/memberships/tiers/${id}`, payload);
  return data.data.tier;
};

export const deleteTier = async (id: string) => {
  await api.delete(`/memberships/tiers/${id}`);
};

export const subscribeToTier = async (tierId: string) => {
  const { data } = await api.post('/memberships/subscribe', { tierId });
  return data.data;
};

export const getMySubscribers = async () => {
  const { data } = await api.get('/memberships/subscribers');
  return data.data.subscribers;
};
