// src/services/apiClient.js
import axios from 'axios';

// ✅ If you open frontend from phone using http://172.16.xx.xx:5173,
// then hostname becomes 172.16.xx.xx and backend becomes http://172.16.xx.xx:8000
// If you open frontend on laptop using http://localhost:5173,
// backend becomes http://localhost:8000
const HOST = window.location.hostname;
const BACKEND = `http://${HOST}:8000`;
const API_BASE = `${BACKEND}/api`;

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
