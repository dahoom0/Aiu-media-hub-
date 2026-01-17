import api from './apiClient';

/**
 * Normalize DRF responses:
 * - { results: [...] }  (paginated)
 * - [ ... ]            (non paginated)
 * - { ... }            (single object)
 */
const normalizeList = (respData) => {
  const data = respData?.results ?? respData;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
};

const cvService = {
  // -------------------------------------------
  // 1. Get My CV (Fetch the existing CV for the student)
  // -------------------------------------------
  getMyCV: async () => {
    const response = await api.get('/cvs/');
    const data = response.data?.results || response.data;

    if (Array.isArray(data)) {
      return data.length > 0 ? data[0] : null;
    }
    return data || null;
  },

  // -------------------------------------------
  // 2. Create or Update Base CV
  // -------------------------------------------
  saveCV: async (cvData) => {
    if (cvData?.id) {
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
      formData.append('profile_image', fileOrFormData);
    }

    const response = await api.patch(`/cvs/${cvId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  // -------------------------------------------
  // 4. Download CV PDF (STUDENT)
  // Endpoint: GET /api/cvs/my/download-pdf/
  // -------------------------------------------
  downloadMyCVPdf: async (filename = 'My_CV.pdf') => {
    const response = await api.get('/cvs/my/download-pdf/', { responseType: 'blob' });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
    return true;
  },

  // -------------------------------------------
  // 5. Download CV PDF by ID (ADMIN)
  // Endpoint: GET /api/cvs/:id/download-pdf/
  // -------------------------------------------
  downloadCvPdfById: async (cvId, filename = `CV_${cvId}.pdf`) => {
    const response = await api.get(`/cvs/${cvId}/download-pdf/`, { responseType: 'blob' });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
    return true;
  },

  // -------------------------------------------
  // LIST (IMPORTANT: used to show saved data on reload)
  // -------------------------------------------
  listEducation: async () => {
    const res = await api.get('/education/');
    return normalizeList(res.data);
  },
  listExperience: async () => {
    const res = await api.get('/experience/');
    return normalizeList(res.data);
  },
  listProjects: async () => {
    const res = await api.get('/projects/');
    return normalizeList(res.data);
  },
  listSkills: async () => {
    const res = await api.get('/skills/');
    return normalizeList(res.data);
  },
  listCertifications: async () => {
    const res = await api.get('/certifications/');
    return normalizeList(res.data);
  },
  listLanguages: async () => {
    const res = await api.get('/languages/');
    return normalizeList(res.data);
  },
  listAwards: async () => {
    const res = await api.get('/awards/');
    return normalizeList(res.data);
  },
  listReferences: async () => {
    const res = await api.get('/references/');
    return normalizeList(res.data);
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
  // CERTIFICATIONS  ✅ (you were calling these in CVGeneratorPage but they were missing)
  // Backend expects: name, issuer, year
  // -------------------------------------------
  addCertification: async (data) => {
    const response = await api.post('/certifications/', data);
    return response.data;
  },
  deleteCertification: async (id) => {
    await api.delete(`/certifications/${id}/`);
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
  // LANGUAGES
  // Backend expects: name, proficiency
  // -------------------------------------------
  addLanguage: async (data) => {
    const response = await api.post('/languages/', data);
    return response.data;
  },
  deleteLanguage: async (id) => {
    await api.delete(`/languages/${id}/`);
  },

  // -------------------------------------------
  // AWARDS
  // Backend expects: title, issuer, year, description
  // -------------------------------------------
  addAward: async (data) => {
    const response = await api.post('/awards/', data);
    return response.data;
  },
  deleteAward: async (id) => {
    await api.delete(`/awards/${id}/`);
  },
};

export default cvService;
