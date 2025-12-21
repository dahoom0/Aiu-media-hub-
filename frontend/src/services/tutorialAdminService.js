import api from './apiClient';

/**
 * Normalizes lists from DRF (handles both direct arrays and paginated {results: []} objects)
 */
const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

const tutorialAdminService = {
  /**
   * Fetch all tutorials for the admin table
   */
  list: async () => {
    const res = await api.get('/tutorials/');
    return normalizeList(res.data);
  },

  /**
   * Create tutorial for ADMIN (YouTube/External URL Flow)
   * Maps frontend names to the Django Model fields seen in your Admin screenshot.
   */
  create: async (formData) => {
    const data = new FormData();

    // 1. Basic Text Fields
    data.append('title', formData.title || '');
    data.append('description', formData.description || '');
    
    // 2. Category (Django expects the ID of the category)
    if (formData.category) {
      data.append('category', formData.category);
    }

    // 3. YouTube/External URL (Backend field: video_url)
    data.append('video_url', formData.videoUrl || '');

    // 4. Thumbnail (Image File)
    if (formData.thumbnail instanceof File) {
      data.append('thumbnail', formData.thumbnail);
    }

    // 5. Numeric & Choice Fields
    // Ensure duration is an integer (minutes) as expected by our updated Serializer
    const durationMin = parseInt(formData.duration, 10) || 0;
    data.append('duration', durationMin);
    
    data.append('level', formData.level || 'Beginner');
    
    // 6. Boolean Logic
    data.append('is_active', formData.is_active !== undefined ? formData.is_active : true);

    // 7. Equipment Linkage (If your model has this Many-to-Many field)
    if (Array.isArray(formData.linkedEquipmentIds)) {
      formData.linkedEquipmentIds.forEach(id => {
        // 'related_equipment' or 'equipment' - check your models.py field name
        data.append('related_equipment', id); 
      });
    }

    const res = await api.post('/tutorials/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  /**
   * Remove a tutorial
   */
  remove: async (id) => {
    const res = await api.delete(`/tutorials/${id}/`);
    return res.data;
  },

  /**
   * Update an existing tutorial
   */
  update: async (id, payload) => {
    // If updating with a file (like a new thumbnail), use FormData. 
    // Otherwise, a standard JSON patch is fine.
    const isMultipart = payload.thumbnail instanceof File;
    
    let requestData = payload;
    let config = {};

    if (isMultipart) {
      requestData = new FormData();
      Object.keys(payload).forEach(key => {
        requestData.append(key, payload[key]);
      });
      config = { headers: { 'Content-Type': 'multipart/form-data' } };
    }

    const res = await api.patch(`/tutorials/${id}/`, requestData, config);
    return res.data;
  },
};

export default tutorialAdminService;