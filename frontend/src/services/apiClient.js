// src/services/apiClient.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: false, // set true if you really need cookies
});

// Request interceptor: add token + fix Content-Type vs FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method || '').toLowerCase();
    const isBodyMethod = ['post', 'put', 'patch'].includes(method);
    const isFormData = config.data instanceof FormData;

    if (isBodyMethod) {
      if (isFormData) {
        // IMPORTANT: let the browser set the correct multipart boundary
        if (config.headers && config.headers['Content-Type']) {
          delete config.headers['Content-Type'];
        }
      } else {
        // normal JSON request
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Helper: central logout (used when refresh fails / no token)
function hardLogout() {
  localStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// Response interceptor: handle 401 → try refresh → otherwise logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network / CORS error without response
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;
    const originalRequest = error.config || {};

    // First time we see 401 for this request → try refresh
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        hardLogout();
        return Promise.reject(error);
      }

      try {
        // ⚠️ Adjust this URL if your backend uses a different refresh endpoint
        const refreshResponse = await axios.post(
          'http://localhost:8000/api/auth/refresh/',
          { refresh: refreshToken }
        );

        const data = refreshResponse.data;
        const newAccess =
          data.access || (data.tokens ? data.tokens.access : null);

        if (!newAccess) {
          hardLogout();
          return Promise.reject(error);
        }

        // Save new access token
        localStorage.setItem('accessToken', newAccess);

        // Retry original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (refreshErr) {
        // Refresh failed → force logout
        hardLogout();
        return Promise.reject(refreshErr);
      }
    }

    // If we already retried and still got 401 → logout
    if (status === 401 && originalRequest._retry) {
      hardLogout();
    }

    return Promise.reject(error);
  }
);

export default api;
