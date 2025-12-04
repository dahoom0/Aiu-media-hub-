import api from './apiClient';

const cvService = {
  // 1. Get My CV (Fetches the existing CV for the student)
  getMyCV: async () => {
    const response = await api.get('/cvs/');
    // If list is empty, return null. If items exist, return the first one.
    const data = response.data.results || response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  },

  // 2. Create/Update Basic Info
  saveCV: async (cvData) => {
    if (cvData.id) {
      // Update existing
      const response = await api.patch(`/cvs/${cvData.id}/`, cvData);
      return response.data;
    } else {
      // Create new
      const response = await api.post('/cvs/', cvData);
      return response.data;
    }
  },

  // --- Sub-Sections ---

  // Education
  addEducation: async (data) => {
    const response = await api.post('/education/', data);
    return response.data;
  },
  deleteEducation: async (id) => {
    await api.delete(`/education/${id}/`);
  },

  // Experience
  addExperience: async (data) => {
    const response = await api.post('/experience/', data);
    return response.data;
  },
  deleteExperience: async (id) => {
    await api.delete(`/experience/${id}/`);
  },

  // Projects
  addProject: async (data) => {
    const response = await api.post('/projects/', data);
    return response.data;
  },
  deleteProject: async (id) => {
    await api.delete(`/projects/${id}/`);
  },

  // Skills
  addSkill: async (data) => {
    const response = await api.post('/skills/', data);
    return response.data;
  },
  deleteSkill: async (id) => {
    await api.delete(`/skills/${id}/`);
  },
  
  // References
  addReference: async (data) => {
    const response = await api.post('/references/', data);
    return response.data;
  },
  deleteReference: async (id) => {
    await api.delete(`/references/${id}/`);
  }
};

export default cvService;