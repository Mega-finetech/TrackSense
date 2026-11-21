import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../constants';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (!API_URL) throw new Error('The service is not configured for this build.');
  try {
    const { useAuthStore } = await import('../stores/authStore');
    const token = useAuthStore.getState().token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // store not loaded yet
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthPath = typeof config?.url === 'string' && config.url.includes('/auth/');

    if (status === 401 && config && !config._retry && !isAuthPath) {
      const { useAuthStore } = await import('../stores/authStore');
      const auth = useAuthStore.getState();
      if (auth.refreshToken) {
        config._retry = true;
        const token = await auth.refreshSession();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return apiClient.request(config);
        }
      }
    }

    if (status === 401 && !isAuthPath && config?.headers?.Authorization) {
      import('../stores/authStore').then(({ useAuthStore }) => {
        const auth = useAuthStore.getState();
        if (config.headers.Authorization === `Bearer ${auth.token}`) auth.logout().catch(() => {});
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
