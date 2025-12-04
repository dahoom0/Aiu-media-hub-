import api from './apiClient';

const tutorialService = {
  // 1. Get All Tutorials (with categories)
  getAll: async () => {
    const response = await api.get('/tutorials/');
    return response.data;
  },

  // 2. Get Single Tutorial Details
  getById: async (id) => {
    const response = await api.get(`/tutorials/${id}/`);
    return response.data;
  },

  // 3. Track Views (Call this when video starts)
  incrementViews: async (id) => {
    const response = await api.post(`/tutorials/${id}/increment_views/`);
    return response.data;
  },

  // 4. Get My Progress (Which videos I've watched)
  // FIX: Renamed from 'getMyProgress' to 'getProgress' to match frontend calls
  getProgress: async () => {
    const response = await api.get('/tutorial-progress/');
    return response.data;
  },

  // 5. Save Progress (Call this when pausing or finishing)
  // Expected data: { tutorial: id, progress_percentage: 50, completed: false }
  saveProgress: async (progressData) => {
    const response = await api.post('/tutorial-progress/', progressData);
    return response.data;
  }
};

export default tutorialService;