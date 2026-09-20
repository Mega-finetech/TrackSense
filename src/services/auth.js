import apiClient from './api';

export const authService = {
  async register(name, email, password) {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
    });
    return response;
  },

  async login(email, password) {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response;
  },

  async logout() {
    // Clear local state - no backend call needed with JWT
    return Promise.resolve();
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response;
  },
};

export default authService;
