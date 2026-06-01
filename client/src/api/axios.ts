import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_SERVER_URL = API_BASE_URL.replace('/api', '');

let accessToken: string | null = localStorage.getItem("access_token");
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
};
export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.get(`${API_BASE_URL}/auth/refresh`, { withCredentials: true });
        accessToken = data.data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        pendingRequests.forEach((cb) => cb(accessToken!));
        pendingRequests = [];
        return api(originalRequest);
      } catch {
        accessToken = null;
        pendingRequests = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
