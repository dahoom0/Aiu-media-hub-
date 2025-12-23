// src/services/labAdminService.js
import api from './apiClient';

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

// ✅ Convert "10:00:00 - 12:00:00" OR "10:00 - 12:00" OR "10:00-12:00"
// into "10:00-12:00"
const normalizeTimeSlot = (slot) => {
  if (!slot) return '';

  const s = String(slot).trim();
  const parts = s.includes('-') ? s.split('-') : s.split('–'); // just in case
  if (parts.length !== 2) return '';

  const clean = (t) => String(t).trim().slice(0, 5); // HH:MM from HH:MM:SS
  const start = clean(parts[0]);
  const end = clean(parts[1]);

  // must be exactly HH:MM
  if (start.length !== 5 || end.length !== 5) return '';
  return `${start}-${end}`;
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

  // ✅ approveBooking(id, bookingOptional)
  approveBooking: async (id, booking = null) => {
    // Prefer action endpoint if you have it
    try {
      const res = await api.post(`/lab-bookings/${id}/approve/`);
      return res.data;
    } catch (err) {
      // fallback: patch status + ensure time_slot format (serializer requires it)
      const slot =
        normalizeTimeSlot(booking?.time_slot) ||
        normalizeTimeSlot(booking?.timeSlot) ||
        normalizeTimeSlot(booking?.slot) ||
        '';

      const payload = {
        status: 'approved',
        ...(slot ? { time_slot: slot } : {}),
      };

      const res = await api.patch(`/lab-bookings/${id}/`, payload);
      return res.data;
    }
  },

  // ✅ rejectBooking(id, bookingOptional, reasonOptional)
  rejectBooking: async (id, bookingOrReason, maybeReason) => {
    // Backward compatible:
    // - old usage: rejectBooking(id, reason)
    // - new usage: rejectBooking(id, booking, reason)
    let booking = null;
    let reason = '';

    if (typeof bookingOrReason === 'string') {
      reason = bookingOrReason;
    } else {
      booking = bookingOrReason || null;
      reason = maybeReason || '';
    }

    // Prefer action endpoint if you have it
    try {
      const res = await api.post(`/lab-bookings/${id}/reject/`, { reason });
      return res.data;
    } catch (err) {
      const slot =
        normalizeTimeSlot(booking?.time_slot) ||
        normalizeTimeSlot(booking?.timeSlot) ||
        normalizeTimeSlot(booking?.slot) ||
        '';

      const payload = {
        status: 'rejected',
        ...(slot ? { time_slot: slot } : {}),
        ...(reason ? { admin_comment: reason } : {}),
      };

      const res = await api.patch(`/lab-bookings/${id}/`, payload);
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

  getStudentProfileByUserId: async (userId) => {
    const res = await api.get(`/student-profiles/`, { params: { user: userId } });
    const list = normalizeList(res.data);
    return list[0] || null;
  },
};

export default labAdminService;
