import api from './axios';

export const getMyClients = async (params?: { search?: string; sort?: string }) => {
  const { data } = await api.get('/clients', { params });
  return data.data.clients;
};

export const getClientDetail = async (id: string) => {
  const { data } = await api.get(`/clients/${id}`);
  return data.data;
};

export const updateClient = async (id: string, payload: Record<string, unknown>) => {
  const { data } = await api.put(`/clients/${id}`, payload);
  return data.data.client;
};
