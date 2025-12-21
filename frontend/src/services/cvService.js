import api from './apiClient';

const cvService = {
  // -------------------------------------------
  // 1. Get My CV (Fetch the existing CV for the student)
  // -------------------------------------------
  getMyCV: async () => {
    const response = await api.get('/cvs/');

    // DRF may return:
    // - { results: [...] }  (paginated)
    // - [ ... ]            (non paginated)
    // - { ... }            (single object)
    const data = response.data.results || response.data;

    if (Array.isArray(data)) {
      return data.length > 0 ? data[0] : null;
    }
    return data || null; // in case backend returns single CV object
  },

  // -------------------------------------------
  // 2. Create or Update Base CV
  // -------------------------------------------
  saveCV: async (cvData) => {
    if (cvData.id) {
      const response = await api.patch(`/cvs/${cvData.id}/`, cvData);
      return response.data;
    } else {
      const response = await api.post('/cvs/', cvData);
      return response.data;
    }
  },

  // -------------------------------------------
  // 3. Upload / Update CV Profile Image
  //     -> writes into CV.profile_image (CVs table)
  // -------------------------------------------
  uploadProfileImage: async (cvId, fileOrFormData) => {
    let formData;

    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else {
      formData = new FormData();
      // Backend field name on CV model = profile_image
      formData.append('profile_image', fileOrFormData);
    }

    const response = await api.patch(`/cvs/${cvId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // -------------------------------------------
  // EDUCATION
  // -------------------------------------------
  addEducation: async (data) => {
    const response = await api.post('/education/', data);
    return response.data;
  },

  deleteEducation: async (id) => {
    await api.delete(`/education/${id}/`);
  },

  // -------------------------------------------
  // EXPERIENCE
  // -------------------------------------------
  addExperience: async (data) => {
    const response = await api.post('/experience/', data);
    return response.data;
  },

  deleteExperience: async (id) => {
    await api.delete(`/experience/${id}/`);
  },

  // -------------------------------------------
  // PROJECTS
  // -------------------------------------------
  addProject: async (data) => {
    const response = await api.post('/projects/', data);
    return response.data;
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}/`);
  },

  // -------------------------------------------
  // SKILLS
  // -------------------------------------------
  addSkill: async (data) => {
    const response = await api.post('/skills/', data);
    return response.data;
  },

  deleteSkill: async (id) => {
    await api.delete(`/skills/${id}/`);
  },

  // -------------------------------------------
  // REFERENCES
  // -------------------------------------------
  addReference: async (data) => {
    const response = await api.post('/references/', data);
    return response.data;
  },

  deleteReference: async (id) => {
    await api.delete(`/references/${id}/`);
  },

  // -------------------------------------------
  // LANGUAGES (NEW)
  // Backend model expects: name, proficiency
  // -------------------------------------------
  addLanguage: async (data) => {
    // data = { name: string, proficiency: string }
    const response = await api.post('/languages/', data);
    return response.data;
  },

  deleteLanguage: async (id) => {
    await api.delete(`/languages/${id}/`);
  },

  // -------------------------------------------
  // AWARDS (NEW)
  // Backend expects: title, issuer, year, description
  // -------------------------------------------
  addAward: async (data) => {
    // data = { title, issuer, year, description }
    const response = await api.post('/awards/', data);
    return response.data;
  },

  deleteAward: async (id) => {
    await api.delete(`/awards/${id}/`);
  },
};

export default cvService;
