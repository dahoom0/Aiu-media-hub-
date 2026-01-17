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
 */
const normalizeLevelForBackend = (level) => {
  if (!level) return 'beginner';
  const s = String(level).trim();

  if (s === 'Beginner') return 'beginner';
  if (s === 'Intermediate') return 'intermediate';
  if (s === 'Advanced') return 'advanced';

  const low = s.toLowerCase();
  if (low === 'beginner' || low === 'intermediate' || low === 'advanced') return low;

  return low;
};

const getAuthToken = () => {
  const candidates = ['accessToken', 'access_token', 'access', 'token', 'jwt', 'authToken', 'auth_token'];
  for (const key of candidates) {
    const v = localStorage.getItem(key);
    if (v && typeof v === 'string') return v;
  }
  const auth = localStorage.getItem('auth');
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      const possible = parsed?.access || parsed?.accessToken || parsed?.token || parsed?.jwt;
      if (possible) return possible;
    } catch { /* ignore */ }
  }
  return null;
};

const withAuthHeaders = (config = {}) => {
  const token = getAuthToken();
  const headers = { ...(config.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  return { ...config, headers };
};

const getFirstWorkingList = async (paths) => {
  let lastErr = null;
  for (const path of paths) {
    try {
      const res = await apiClient.get(path, withAuthHeaders());
      return unwrapList(res.data);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
};

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
    equipment_ids: Array.isArray(formData.equipmentIds) ? formData.equipmentIds : [],
  };
};

const buildFormDataPayload = (formData) => {
  const fd = new FormData();
  fd.append('title', formData.title?.trim() || '');
  fd.append('description', formData.description?.trim() || '');
  fd.append('video_url', formData.videoUrl?.trim() || '');
  const duration = toIntOrNull(formData.duration);
  fd.append('duration', String(duration === null ? 0 : duration));
  fd.append('level', normalizeLevelForBackend(formData.level));
  if (formData.categoryId) fd.append('category', String(Number(formData.categoryId)));
  fd.append('is_active', String(!!(formData.is_active ?? true)));
  (formData.equipmentIds || []).forEach((id) => fd.append('equipment_ids', String(id)));
  if (formData.thumbnail) fd.append('thumbnail', formData.thumbnail);
  return fd;
};

const isFileLike = (v) => {
  if (!v) return false;
  if (typeof File !== 'undefined' && v instanceof File) return true;
  return typeof v === 'object' && typeof v.name === 'string' && typeof v.size === 'number';
};

const extractFilenameFromContentDisposition = (headerValue) => {
  if (!headerValue) return null;
  // examples:
  // attachment; filename="tutorial_2_completions.csv"
  // attachment; filename=tutorial_2_completions.csv
  const m = /filename\*?=(?:UTF-8''|")?([^;"\n]+)"?/i.exec(headerValue);
  if (!m || !m[1]) return null;
  try {
    return decodeURIComponent(m[1].trim());
  } catch {
    return m[1].trim();
  }
};

const tutorialAdminService = {
  async list() {
    const res = await apiClient.get('/tutorials/', withAuthHeaders());
    return res.data;
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
   * ✅ Export CSV: download completed students for a tutorial
   */
  async exportCompletedStudents(id) {
    try {
      const res = await apiClient.get(
        `/tutorials/${id}/completed-export/`,
        withAuthHeaders({ responseType: 'blob' })
      );

      const contentType = res?.headers?.['content-type'] || 'text/csv';
      const cd = res?.headers?.['content-disposition'];
      const serverFilename = extractFilenameFromContentDisposition(cd);
      const filename = serverFilename || `tutorial_${id}_completions.csv`;

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV Export failed:', error);
      throw error;
    }
  },

  async listEquipments() {
    return getFirstWorkingList(['/equipments/', '/equipment/']);
  },

  async listCategories() {
    return getFirstWorkingList(['/categories/', '/category/']);
  },

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
      throw error;
    }
  },

  async update(id, formData) {
    try {
      if (isFileLike(formData.thumbnail)) {
        const fd = buildFormDataPayload(formData);
        const res = await apiClient.patch(`/tutorials/${id}/`, fd, withAuthHeaders({
          headers: { 'Content-Type': 'multipart/form-data' },
        }));
        return res.data;
      }
      const payload = buildJsonPayload(formData);
      const res = await apiClient.patch(`/tutorials/${id}/`, payload, withAuthHeaders());
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};

export default tutorialAdminService;
