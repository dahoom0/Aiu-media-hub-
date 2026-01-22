// src/services/authService.js
import api from './apiClient';

const PROFILE_ENDPOINTS = ['/auth/profile/', '/profile/'];
const REGISTER_ENDPOINT = '/auth/register/';

const normalizeRoleToUserType = (obj) => {
  if (obj?.user_type) return obj.user_type;
  if (obj?.is_staff === true) return 'admin';
  if (obj?.admin_profile) return 'admin';
  if (obj?.student_profile) return 'student';

  const role = String(obj?.role || obj?.user_role || '').toLowerCase();
  if (role.includes('admin')) return 'admin';

  return 'student';
};

const pickUserShape = (data) => {
  const { tokens, user, profile } = data || {};
  const mergedUser = { ...(user || {}), ...(profile || {}) };

  mergedUser.user_type = normalizeRoleToUserType(mergedUser);
  if (mergedUser.is_staff === undefined) {
    mergedUser.is_staff = mergedUser.user_type === 'admin';
  }

  return { tokens, mergedUser };
};

const authService = {
  // ---------------- AUTH ----------------
  login: async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });
    const { tokens, mergedUser } = pickUserShape(res.data);

    if (tokens?.access) localStorage.setItem('accessToken', tokens.access);
    if (tokens?.refresh) localStorage.setItem('refreshToken', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(mergedUser));

    return res.data;
  },

  register: async (payload) => {
    const p = { ...(payload || {}) };

    if (!p.user_type) p.user_type = 'student';
    if (!p.password_confirm) p.password_confirm = p.password;
    if (p.user_type === 'student' && !p.student_id && p.username) {
      p.student_id = p.username;
    }

    const res = await api.post(REGISTER_ENDPOINT, p);

    if (res?.data?.tokens) {
      const { tokens, mergedUser } = pickUserShape(res.data);
      if (tokens?.access) localStorage.setItem('accessToken', tokens.access);
      if (tokens?.refresh) localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(mergedUser));
    }

    return res.data;
  },

  getProfile: async () => {
    let lastErr = null;

    for (const endpoint of PROFILE_ENDPOINTS) {
      try {
        const res = await api.get(endpoint);
        const existing = JSON.parse(localStorage.getItem('user') || '{}');
        const merged = { ...existing, ...(res.data || {}) };

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

  // ---------------- PASSWORD RESET ----------------

  /**
   * STEP 1: Request OTP
   * POST /api/auth/password-reset/request-otp/
   */
  requestPasswordReset: async (email) => {
    const res = await api.post(
      '/auth/password-reset/request-otp/',
      { email }
    );
    return res.data;
  },

  /**
   * STEP 2: Confirm OTP + set new password
   * POST /api/auth/password-reset/confirm/
   */
  confirmPasswordReset: async ({ email, otp, new_password }) => {
    const res = await api.post(
      '/auth/password-reset/confirm/',
      {
        email,
        otp,
        new_password,
      }
    );
    return res.data;
  },

  // ---------------- SESSION ----------------
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
