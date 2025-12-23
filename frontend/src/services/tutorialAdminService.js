// frontend/src/services/tutorialAdminService.js
import apiClient from './apiClient';

/**
 * Safely unwrap list responses:
 * - []
 * - { results: [] }
 */
const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

const toIntOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? parseInt(String(n), 10) : null;
};

/**
 * Backend expects level choice values (likely lowercase).
 * UI may send "Beginner" but backend expects "beginner".
 */
const normalizeLevelForBackend = (level) => {
  if (!level) return 'beginner';
  const s = String(level).trim();

  if (s === 'Beginner') return 'beginner';
  if (s === 'Intermediate') return 'intermediate';
  if (s === 'Advanced') return 'advanced';

  const low = s.toLowerCase();
  if (low === 'beginner' || low === 'intermediate' || low === 'advanced') return low;

  return low; // fallback
};

/**
 * Try to find JWT token from common keys (no UI change, service-only fix).
 * Update these keys if your project uses a different one.
 */
const getAuthToken = () => {
  const candidates = [
    'accessToken',
    'access_token',
    'access',
    'token',
    'jwt',
    'authToken',
    'auth_token',
  ];

  for (const key of candidates) {
    const v = localStorage.getItem(key);
    if (v && typeof v === 'string') return v;
  }

  // Sometimes token stored as JSON in "auth" or "tokens"
  const auth = localStorage.getItem('auth');
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      const possible =
        parsed?.access ||
        parsed?.accessToken ||
        parsed?.token ||
        parsed?.jwt ||
        parsed?.data?.access;
      if (possible) return possible;
    } catch {
      // ignore
    }
  }

  const tokens = localStorage.getItem('tokens');
  if (tokens) {
    try {
      const parsed = JSON.parse(tokens);
      const possible = parsed?.access || parsed?.accessToken;
      if (possible) return possible;
    } catch {
      // ignore
    }
  }

  return null;
};

/**
 * Ensure Authorization header exists even if apiClient wasn't configured properly.
 */
const withAuthHeaders = (config = {}) => {
  const token = getAuthToken();
  const headers = { ...(config.headers || {}) };

  // Only attach if not already present
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  return { ...config, headers };
};

/**
 * Try multiple endpoints (some projects name them differently)
 * Example: equipments vs equipment, categories vs category
 */
const getFirstWorkingList = async (paths) => {
  let lastErr = null;

  for (const path of paths) {
    try {
      const res = await apiClient.get(path, withAuthHeaders());
      return unwrapList(res.data);
    } catch (err) {
      lastErr = err;
      // continue trying next path
    }
  }

  // If all failed, throw the last error (so UI can show real reason)
  throw lastErr;
};

/**
 * Build JSON payload (NO thumbnail)
 * MUST match TutorialSerializer fields:
 * - title, description, video_url, duration, level, category
 */
const buildJsonPayload = (formData) => {
  const duration = toIntOrNull(formData.duration);

  return {
    title: formData.title?.trim() || '',
    description: formData.description?.trim() || '',
    video_url: formData.videoUrl?.trim() || '',
    duration: duration === null ? 0 : duration,
    level: normalizeLevelForBackend(formData.level),
    category: formData.categoryId ? Number(formData.categoryId) : null,
    is_active: formData.is_active ?? true,

    // Keep both common names in case your model expects one of them
    equipment_ids: Array.isArray(formData.equipmentIds) ? formData.equipmentIds : [],
    equipments: Array.isArray(formData.equipmentIds) ? formData.equipmentIds : [],
  };
};

/**
 * Build multipart payload (WITH thumbnail)
 * NOTE: for PATCH, still ok to include full fields; backend will update those sent.
 */
const buildFormDataPayload = (formData) => {
  const fd = new FormData();

  fd.append('title', formData.title?.trim() || '');
  fd.append('description', formData.description?.trim() || '');
  fd.append('video_url', formData.videoUrl?.trim() || '');

  const duration = toIntOrNull(formData.duration);
  fd.append('duration', String(duration === null ? 0 : duration));

  fd.append('level', normalizeLevelForBackend(formData.level));

  if (formData.categoryId) {
    fd.append('category', String(Number(formData.categoryId)));
  } else {
    // Only append if your backend allows null categories.
    // If category is required, the UI should always provide one.
    // fd.append('category', '');
  }

  fd.append('is_active', String(!!(formData.is_active ?? true)));

  (formData.equipmentIds || []).forEach((id) => {
    fd.append('equipment_ids', String(id));
    fd.append('equipments', String(id));
  });

  if (formData.thumbnail) {
    fd.append('thumbnail', formData.thumbnail);
  }

  return fd;
};

/**
 * Detect a real File object (so we only do multipart when user picked a new file).
 * When editing, your formData.thumbnail might be:
 * - File (new upload) ✅ multipart
 * - null/undefined ✅ JSON
 * - string URL from existing tutorial thumbnail ✅ JSON
 */
const isFileLike = (v) => {
  if (!v) return false;
  // Browser environment: File exists
  if (typeof File !== 'undefined' && v instanceof File) return true;
  // Fallback: duck-typing
  return typeof v === 'object' && typeof v.name === 'string' && typeof v.size === 'number';
};

const tutorialAdminService = {
  async list() {
    const res = await apiClient.get('/tutorials/', withAuthHeaders());
    return res.data; // caller unwraps
  },

  async getById(id) {
    const res = await apiClient.get(`/tutorials/${id}/`, withAuthHeaders());
    return res.data;
  },

  async remove(id) {
    const res = await apiClient.delete(`/tutorials/${id}/`, withAuthHeaders());
    return res.data;
  },

  /**
   * GET equipments (robust)
   */
  async listEquipments() {
    // try plural then singular
    return getFirstWorkingList(['/equipments/', '/equipment/']);
  },

  /**
   * GET categories (robust)
   */
  async listCategories() {
    return getFirstWorkingList(['/categories/', '/category/']);
  },

  /**
   * POST tutorials
   */
  async create(formData) {
    try {
      if (isFileLike(formData.thumbnail)) {
        const fd = buildFormDataPayload(formData);
        const res = await apiClient.post('/tutorials/', fd, withAuthHeaders({
          headers: { 'Content-Type': 'multipart/form-data' },
        }));
        return res.data;
      }

      const payload = buildJsonPayload(formData);
      const res = await apiClient.post('/tutorials/', payload, withAuthHeaders());
      return res.data;
    } catch (error) {
      console.error('Tutorial create failed:', error?.response?.data || error);
      throw error;
    }
  },

  /**
   * PATCH tutorials (Edit)
   * - If thumbnail is a NEW File => multipart/form-data
   * - If no new thumbnail => JSON
   */
  async update(id, formData) {
    try {
      if (!id) throw new Error('Tutorial update failed: missing id');

      // Only multipart if admin picked a NEW file
      if (isFileLike(formData.thumbnail)) {
        const fd = buildFormDataPayload(formData);

        // PATCH with multipart
        const res = await apiClient.patch(`/tutorials/${id}/`, fd, withAuthHeaders({
          headers: { 'Content-Type': 'multipart/form-data' },
        }));
        return res.data;
      }

      // JSON PATCH
      const payload = buildJsonPayload(formData);

      // IMPORTANT: do NOT send thumbnail in JSON (serializer expects multipart file)
      // If UI stored existing thumbnail URL in formData.thumbnail, ignore it.
      const res = await apiClient.patch(`/tutorials/${id}/`, payload, withAuthHeaders());
      return res.data;
    } catch (error) {
      console.error('Tutorial update failed:', error?.response?.data || error);
      throw error;
    }
  },
};

export default tutorialAdminService;
