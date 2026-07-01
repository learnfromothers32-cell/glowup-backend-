import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || '/api');
export const API_SERVER_URL = API_BASE_URL.replace('/api', '');

let accessToken: string | null = null;
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

function getBackoff(retryCount: number): number {
  // Exponential backoff with jitter: base 1s, 2s, 4s, 8s...
  const base = Math.min(1000 * Math.pow(2, retryCount), 30000);
  return base + Math.random() * base * 0.3;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.code === 'ECONNABORTED' && !originalRequest._retryCold) {
      originalRequest._retryCold = true;
      console.warn(`[axios] timeout on ${originalRequest.url}, retrying after cold-start delay`);
      await new Promise((r) => setTimeout(r, 5000));
      return api(originalRequest);
    }
    if (error.response?.status === 429) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 3) {
        const delay = getBackoff(originalRequest._retryCount - 1);
        console.warn(`[axios] 429 on ${originalRequest.url}, retry ${originalRequest._retryCount}/3 in ${Math.round(delay)}ms`);
        await new Promise((r) => setTimeout(r, delay));
        return api(originalRequest);
      }
    }
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
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
          timeout: 60000,
        });
        accessToken = data.data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        pendingRequests.forEach((cb) => cb(accessToken!));
        pendingRequests = [];
        return api(originalRequest);
      } catch (refreshError) {
        accessToken = null;
        pendingRequests = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
