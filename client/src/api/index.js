import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const headers = config.headers || {};
  const existing = headers.Authorization || headers.authorization;
  if (existing) return config;

  const url = String(config.url || '');
  const isUserRoute = url === '/user' || url.startsWith('/user/') || url.includes('/user/');
  const token = isUserRoute
    ? localStorage.getItem('userToken')
    : localStorage.getItem('token');

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

export default api;
