import api from './apiClient';

const portfolioService = {
  // 1. Get the current user's portfolio
  getMyPortfolio: async () => {
    const response = await api.get('/portfolios/me/');
    return response.data;
  },

  // 2. Add a new project (Handles File Uploads)
  addProject: async (projectData) => {
    // We must use FormData to send files to the server
    const formData = new FormData();
    
    // Convert the JavaScript object to FormData
    Object.keys(projectData).forEach(key => {
      // If the value is not null/undefined, append it
      if (projectData[key] !== null && projectData[key] !== undefined) {
        formData.append(key, projectData[key]);
      }
    });

    const response = await api.post('/portfolios/projects/', formData, {
      headers: {
        // This tells the server a file is coming
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 3. Update an existing project
  updateProject: async (id, data) => {
    // Use FormData here too if you allow updating the image
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });

    const response = await api.patch(`/portfolios/projects/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // 4. Delete a project
  deleteProject: async (id) => {
    const response = await api.delete(`/portfolios/projects/${id}/`);
    return response.data;
  }
};

export default portfolioService;