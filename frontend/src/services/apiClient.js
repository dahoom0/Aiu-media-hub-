import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    // Django requires trailing slashes on most POST/GET requests
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
      config.url += '/';
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Standard JSON headers
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
  // Only redirect if not already on login page to avoid loops
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    // If 401 and we haven't retried yet, try refreshing the token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refreshToken');

      if (!refresh) {
        hardLogout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post('http://localhost:8000/api/token/refresh/', { refresh });
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