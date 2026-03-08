// src/services/apiClient.js
import axios from 'axios';

// ✅ In Docker/production: use relative URLs (nginx will proxy to backend)
// ✅ In development: use localhost with port
const isDevelopment = import.meta.env.DEV;
const HOST = window.location.hostname;

// If in development mode, use explicit backend URL
// If in production (Docker), use relative URL (nginx proxies /api to backend)
const API_BASE = isDevelopment ? `http://${HOST}:8000/api` : '/api';
const BACKEND = isDevelopment ? `http://${HOST}:8000` : '';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
      config.url += '/';
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers = config.headers || {};
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

function hardLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      // network / refused connection / CORS
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        hardLogout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BACKEND}/api/token/refresh/`, { refresh });
        const newAccess = res.data.access;

        localStorage.setItem('accessToken', newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (err) {
        hardLogout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { BACKEND, API_BASE };
