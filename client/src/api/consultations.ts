import api from './axios';

export const getMyForms = async () => {
  const { data } = await api.get('/consultations/forms');
  return data.data.forms;
};

export const createForm = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/consultations/forms', payload);
  return data.data.form;
};

export const updateForm = async (id: string, payload: Record<string, unknown>) => {
  const { data } = await api.put(`/consultations/forms/${id}`, payload);
  return data.data.form;
};

export const deleteForm = async (id: string) => {
  await api.delete(`/consultations/forms/${id}`);
};

export const getFormResponses = async (formId: string) => {
  const { data } = await api.get(`/consultations/forms/${formId}/responses`);
  return data.data;
};

export const submitConsultationForm = async (formId: string, payload: { answers: { questionId: string; value: string | number | boolean }[]; bookingId?: string }) => {
  const { data } = await api.post(`/consultations/forms/${formId}/submit`, payload);
  return data.data.response;
};
