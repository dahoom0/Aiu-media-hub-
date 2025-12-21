// src/services/authService.js
import api from './apiClient';

const PROFILE_ENDPOINTS = ['/auth/profile/', '/profile/']; // support both

const normalizeRoleToUserType = (obj) => {
  // If backend already provides these, keep them
  if (obj?.user_type) return obj.user_type; // 'admin' or 'student'
  if (obj?.is_staff === true) return 'admin';

  // Your backend seems to return: role: "system admin"
  const role = String(obj?.role || obj?.user_role || '').toLowerCase();
  if (role.includes('admin')) return 'admin';

  return 'student';
};

const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });

    const { tokens, user, profile } = res.data || {};

    if (tokens?.access) localStorage.setItem('accessToken', tokens.access);
    if (tokens?.refresh) localStorage.setItem('refreshToken', tokens.refresh);

    // Merge safely (user + profile + role object)
    const merged = { ...(profile || {}), ...(user || {}), ...(res.data || {}) };

    // Normalize role into user_type so the whole app can rely on it
    merged.user_type = normalizeRoleToUserType(merged);

    // Also set is_staff if missing (optional but useful)
    if (merged.is_staff === undefined) {
      merged.is_staff = merged.user_type === 'admin';
    }

    localStorage.setItem('user', JSON.stringify(merged));
    return res.data;
  },

  getProfile: async () => {
    let lastErr = null;

    for (const endpoint of PROFILE_ENDPOINTS) {
      try {
        const res = await api.get(endpoint);

        let existing = null;
        try {
          existing = JSON.parse(localStorage.getItem('user'));
        } catch {
          existing = null;
        }

        const merged = { ...(existing || {}), ...(res.data || {}) };

        // Normalize again (backend might return role here too)
        merged.user_type = normalizeRoleToUserType(merged);
        if (merged.is_staff === undefined) {
          merged.is_staff = merged.user_type === 'admin';
        }

        localStorage.setItem('user', JSON.stringify(merged));
        return merged;
      } catch (err) {
        lastErr = err;
      }
    }

    throw lastErr;
  },

  logout: () => {
    localStorage.clear();
  },

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  isAuthenticated: () => !!localStorage.getItem('accessToken'),

  isAdmin: () => {
    const u = authService.getUser();
    return u?.user_type === 'admin' || u?.is_staff === true;
  },
};

export default authService;
