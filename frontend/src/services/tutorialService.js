import api from './apiClient';

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

const toBool = (v, fallback = false) => {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(s)) return false;
  return fallback;
};

const toInt = (v, fallback = 0) => {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return parseInt(String(n), 10);
};

const clampProgress = (p) => {
  const n = toInt(p, 0);
  return Math.max(0, Math.min(100, n));
};

const tutorialService = {
  // 1. Get All Tutorials
  getAll: async () => {
    const response = await api.get('/tutorials/');
    return response.data;
  },

  // 2. Get Single Tutorial Details
  getById: async (id) => {
    const response = await api.get(`/tutorials/${id}/`);
    return response.data;
  },

  // 3. Track Views
  incrementViews: async (id) => {
    const response = await api.post(`/tutorials/${id}/increment_views/`);
    return response.data;
  },

  /**
   * 4. Get My Progress
   * Prefer explicit endpoint if available: /tutorial-progress/my/
   * Fallback to /tutorial-progress/
   */
  getProgress: async () => {
    try {
      const res = await api.get('/tutorial-progress/my/');
      // return same shape the caller expects (could be [] or {results:[]})
      return res.data;
    } catch (err) {
      // fallback for older backend routes
      const res = await api.get('/tutorial-progress/');
      return res.data;
    }
  },

  /**
   * 5. Save Progress (UPSERT)
   * Expected data: { tutorial: id, progress_percentage: 50, completed: false }
   * We intentionally POST always; backend handles update_or_create.
   *
   * Accepts optional `id` from older code, but we strip it because backend
   * doesn't need it for UPSERT and it avoids confusion.
   */
  saveProgress: async (progressData) => {
    const tutorialId =
      typeof progressData?.tutorial === 'object'
        ? progressData?.tutorial?.id
        : progressData?.tutorial;

    const payload = {
      tutorial: tutorialId,
      progress_percentage: clampProgress(progressData?.progress_percentage),
      completed: toBool(progressData?.completed, false),
    };

    const response = await api.post('/tutorial-progress/', payload);
    return response.data;
  },

  /**
   * Optional helper if you ever need a single tutorial progress quickly:
   * GET /tutorial-progress/by-tutorial/<id>/
   */
  getProgressByTutorial: async (tutorialId) => {
    try {
      const res = await api.get(`/tutorial-progress/by-tutorial/${tutorialId}/`);
      return res.data;
    } catch (err) {
      // fallback: fetch all and find
      const data = await tutorialService.getProgress();
      const list = unwrapList(data);
      return list.find((p) => (typeof p.tutorial === 'object' ? p.tutorial?.id : p.tutorial) === tutorialId) || {};
    }
  },
};

export default tutorialService;
