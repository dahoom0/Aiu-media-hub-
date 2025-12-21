// src/services/labAdminService.js
import api from './apiClient';

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

const labAdminService = {
  // ---------------------------
  // LABS
  // ---------------------------
  getLabs: async () => {
    const res = await api.get('/labs/');
    return normalizeList(res.data);
  },

  createLab: async ({ name, capacity }) => {
    const res = await api.post('/labs/', { name, capacity });
    return res.data;
  },

  deleteLab: async (id) => {
    const res = await api.delete(`/labs/${id}/`);
    return res.data;
  },

  // ---------------------------
  // LAB BOOKINGS (ADMIN)
  // ---------------------------
  getLabBookings: async () => {
    const res = await api.get('/lab-bookings/');
    return normalizeList(res.data);
  },

  approveBooking: async (id) => {
    // Prefer action endpoint if you have it
    try {
      const res = await api.post(`/lab-bookings/${id}/approve/`);
      return res.data;
    } catch {
      // fallback: patch status
      const res = await api.patch(`/lab-bookings/${id}/`, { status: 'approved' });
      return res.data;
    }
  },

  rejectBooking: async (id, reason) => {
    // Prefer action endpoint if you have it
    try {
      const res = await api.post(`/lab-bookings/${id}/reject/`, { reason });
      return res.data;
    } catch {
      // fallback: patch status + reason
      const res = await api.patch(`/lab-bookings/${id}/`, {
        status: 'rejected',
        rejection_reason: reason,
        reject_reason: reason, // extra safe in case serializer uses this
      });
      return res.data;
    }
  },

  // ---------------------------
  // STUDENT PROFILE (ADMIN)
  // ---------------------------
  getStudentProfile: async (id) => {
    const res = await api.get(`/student-profiles/${id}/`);
    return res.data;
  },

  // (Optional) if your API supports query by user id:
  getStudentProfileByUserId: async (userId) => {
    const res = await api.get(`/student-profiles/`, { params: { user: userId } });
    const list = normalizeList(res.data);
    return list[0] || null;
  },
};

export default labAdminService;
