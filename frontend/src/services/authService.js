// src/services/authService.js
import api from './apiClient';

const PROFILE_ENDPOINTS = ['/auth/profile/', '/profile/']; // support both (your app uses /auth/profile/)

const REGISTER_ENDPOINT = '/auth/register/'; // ✅ correct based on your Django URLs

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

  /**
   * Register a new user (student/admin) using your backend RegisterSerializer.
   * Backend expects:
   * - username, email, password, password_confirm, first_name, last_name, phone(optional), user_type,
   * - student_id (required if user_type === 'student')
   * - year (optional)
   *
   * Frontend currently sends "password" but not always "password_confirm",
   * so we auto-fill password_confirm=password.
   */
  register: async (payload) => {
    const p = { ...(payload || {}) };

    // Ensure required defaults
    if (!p.user_type) p.user_type = 'student';

    // Backend requires password_confirm
    if (!p.password_confirm) p.password_confirm = p.password;

    // Student ID required when user_type=student
    if (p.user_type === 'student' && !p.student_id) {
      // If they use studentId as username, fallback to username
      if (p.username) p.student_id = p.username;
    }

    // ✅ correct endpoint: /api/auth/register/
    const res = await api.post(REGISTER_ENDPOINT, p);

    // Your register endpoint returns created user (likely no tokens),
    // so do NOT assume tokens exist.
    // If you later decide to return tokens on register, we can store them.
    if (res?.data?.tokens?.access || res?.data?.tokens?.refresh) {
      const { tokens, user, profile } = res.data || {};

      if (tokens?.access) localStorage.setItem('accessToken', tokens.access);
      if (tokens?.refresh) localStorage.setItem('refreshToken', tokens.refresh);

      const merged = { ...(profile || {}), ...(user || {}), ...(res.data || {}) };
      merged.user_type = normalizeRoleToUserType(merged);
      if (merged.is_staff === undefined) merged.is_staff = merged.user_type === 'admin';

      localStorage.setItem('user', JSON.stringify(merged));
      return res.data;
    }

    // If register returns no tokens (most likely), optionally auto-login
    // so your UI can navigate to dashboard.
    // Your SignupPage already expects "auto login" behavior.
    if (p.username && p.password) {
      try {
        await authService.login(p.username, p.password);
      } catch (e) {
        // registration succeeded but login failed; still return register response
      }
    }

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
