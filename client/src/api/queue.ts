import api from './axios';

export const getQueueStatus = async (stylistId: string) => {
  const { data } = await api.get(`/queue/${stylistId}`);
  return data.data;
};

export const advanceQueue = async (stylistId: string) => {
  const { data } = await api.post(`/queue/${stylistId}/advance`);
  return data.data;
};

export const markQueueDone = async (stylistId: string, entryUserId: string) => {
  const { data } = await api.post(`/queue/${stylistId}/done/${entryUserId}`);
  return data.data;
};

export const skipQueueEntry = async (stylistId: string, entryUserId: string) => {
  const { data } = await api.post(`/queue/${stylistId}/skip/${entryUserId}`);
  return data.data;
};
