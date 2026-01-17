// src/services/labAdminService.js
import api from './apiClient';

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

// "10:00:00 - 12:00:00" / "10:00 - 12:00" / "10:00-12:00" -> "10:00-12:00"
const normalizeTimeSlot = (slot) => {
  if (!slot) return '';
  const s = String(slot).trim().replace(/\s+/g, '');
  const parts = s.includes('-') ? s.split('-') : s.split('–');
  if (parts.length !== 2) return '';
  const clean = (t) => String(t).trim().slice(0, 5);
  const start = clean(parts[0]);
  const end = clean(parts[1]);
  if (start.length !== 5 || end.length !== 5) return '';
  return `${start}-${end}`;
};

// Try a list of endpoints until one works.
const tryGet = async (paths, config = {}) => {
  let lastErr = null;
  for (const path of paths) {
    try {
      const res = await api.get(path, config);
      return { ok: true, data: res.data };
    } catch (err) {
      lastErr = err;
    }
  }
  return { ok: false, data: null, error: lastErr };
};

// Accept both:
// - approveBooking(id, booking)
// - approveBooking({ id, ...bookingFields })
const parseIdAndBooking = (idOrObj, maybeBooking) => {
  if (idOrObj && typeof idOrObj === 'object') {
    return { id: idOrObj.id, booking: idOrObj };
  }
  return { id: idOrObj, booking: maybeBooking || null };
};

const extractFilenameFromDisposition = (disposition) => {
  // Content-Disposition: attachment; filename="xxx.csv"
  if (!disposition) return null;
  const m = String(disposition).match(/filename="?([^"]+)"?/i);
  return m?.[1] || null;
};

const safeSlug = (s) => {
  if (!s) return 'lab';
  return (
    String(s)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_\-]+/g, '_')
      .slice(0, 60) || 'lab'
  );
};

// ✅ helpers for matching
const toStr = (v) => (v === null || v === undefined ? '' : String(v));
const normId = (v) => toStr(v).trim();
const normLower = (v) => normId(v).toLowerCase();

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

  /**
   * ✅ Export student requests + admin response for a lab (CSV)
   * Backend endpoint: GET /labs/<labId>/bookings-export/
   */
  exportLabBookings: async (labId, labName = '') => {
    if (!labId) throw new Error('Missing labId');

    const res = await api.get(`/labs/${labId}/bookings-export/`, {
      responseType: 'blob',
    });

    const disposition = res?.headers?.['content-disposition'] || res?.headers?.['Content-Disposition'];
    const serverFilename = extractFilenameFromDisposition(disposition);

    const fallback = `${safeSlug(labName || `lab_${labId}`)}_${labId}_requests_responses.csv`;
    const filename = serverFilename || fallback;

    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    window.URL.revokeObjectURL(url);

    return true;
  },

  // ---------------------------
  // LAB BOOKINGS (ADMIN)
  // ---------------------------
  getLabBookings: async () => {
    const res = await api.get('/lab-bookings/');
    return normalizeList(res.data);
  },

  /**
   * ✅ Student Profile by profile ID (from student-profiles table)
   */
  getStudentProfile: async (profileId) => {
    if (!profileId) throw new Error('Missing profileId');

    const { ok, data, error } = await tryGet([`/student-profiles/${profileId}/`, `/student-profiles/${profileId}`]);

    if (!ok) throw error;
    return data;
  },

  /**
   * ✅ Student Profile by student_id
   * IMPORTANT: backend might NOT filter, so we filter client-side too.
   */
  getStudentProfileByStudentId: async (studentId) => {
    if (!studentId) throw new Error('Missing studentId');

    const sidLower = normLower(studentId);

    // 1) query param patterns (even if backend ignores filter, we still filter client-side)
    const q1 = await tryGet([`/student-profiles/?student_id=${encodeURIComponent(studentId)}`]);
    if (q1.ok) {
      const list = normalizeList(q1.data);
      const match = list.find((p) => normLower(p?.student_id) === sidLower);
      if (match) return match;
    }

    const q2 = await tryGet([`/student-profiles/?studentId=${encodeURIComponent(studentId)}`]);
    if (q2.ok) {
      const list = normalizeList(q2.data);
      const match = list.find((p) => normLower(p?.student_id) === sidLower);
      if (match) return match;
    }

    // 2) action pattern (only if backend has it)
    const a = await tryGet([
      `/student-profiles/by-student-id/${encodeURIComponent(studentId)}/`,
      `/student-profiles/by-student-id/${encodeURIComponent(studentId)}`,
    ]);
    if (a.ok) return a.data;

    throw q2.error || q1.error || a.error || new Error('Profile not found');
  },

  /**
   * ✅ Student Profile by user ID
   * IMPORTANT: backend might NOT filter, so we filter client-side too.
   */
  getStudentProfileByUserId: async (userId) => {
    if (!userId) throw new Error('Missing userId');

    const uid = normId(userId);

    // 1) query param patterns
    const q1 = await tryGet([`/student-profiles/?user=${encodeURIComponent(userId)}`]);
    if (q1.ok) {
      const list = normalizeList(q1.data);
      const match = list.find((p) => normId(p?.user?.id) === uid);
      if (match) return match;
    }

    const q2 = await tryGet([`/student-profiles/?user_id=${encodeURIComponent(userId)}`]);
    if (q2.ok) {
      const list = normalizeList(q2.data);
      const match = list.find((p) => normId(p?.user?.id) === uid);
      if (match) return match;
    }

    // 2) action pattern
    const a = await tryGet([`/student-profiles/by-user/${userId}/`, `/student-profiles/by-user/${userId}`]);
    if (a.ok) return a.data;

    throw q2.error || q1.error || a.error || new Error('Profile not found');
  },

  approveBooking: async (idOrObj, maybeBooking = null) => {
    const { id, booking } = parseIdAndBooking(idOrObj, maybeBooking);
    if (!id) throw new Error('Missing booking id');

    // 1) try action endpoint (best)
    try {
      const payload = {};
      if (booking?.admin_comment) payload.admin_comment = booking.admin_comment;

      const res = await api.post(`/lab-bookings/${id}/approve/`, payload);
      return res.data;
    } catch (err) {
      // 2) fallback PATCH
      const payload = { status: 'approved' };

      const slot =
        normalizeTimeSlot(booking?.time_slot) ||
        normalizeTimeSlot(booking?.timeSlot) ||
        normalizeTimeSlot(booking?.slot) ||
        normalizeTimeSlot(booking?.time_slot_normalized) ||
        '';

      if (slot) payload.time_slot = slot;

      if (booking?.date) payload.date = booking.date;
      if (booking?.booking_date) payload.booking_date = booking.booking_date;
      if (booking?.lab_room) payload.lab_room = booking.lab_room;

      if (booking?.admin_comment) payload.admin_comment = booking.admin_comment;

      const res = await api.patch(`/lab-bookings/${id}/`, payload);
      return res.data;
    }
  },

  rejectBooking: async (idOrObj, bookingOrReason = null, maybeReason = '') => {
    let id = null;
    let booking = null;
    let reason = '';
    let admin_comment = '';

    if (idOrObj && typeof idOrObj === 'object') {
      id = idOrObj.id;
      booking = idOrObj;
      reason = idOrObj.reason || '';
      admin_comment = idOrObj.admin_comment || idOrObj.comment || '';
    } else {
      id = idOrObj;
      if (typeof bookingOrReason === 'string') {
        reason = bookingOrReason;
      } else {
        booking = bookingOrReason || null;
        reason = maybeReason || '';
      }
    }

    if (!admin_comment && reason) admin_comment = reason;
    if (!id) throw new Error('Missing booking id');

    // 1) try action endpoint
    try {
      const res = await api.post(`/lab-bookings/${id}/reject/`, {
        reason,
        admin_comment,
      });
      return res.data;
    } catch (err) {
      // 2) fallback PATCH
      const payload = { status: 'rejected' };

      const slot =
        normalizeTimeSlot(booking?.time_slot) ||
        normalizeTimeSlot(booking?.timeSlot) ||
        normalizeTimeSlot(booking?.slot) ||
        '';

      if (slot) payload.time_slot = slot;
      if (reason) payload.reject_reason = reason;
      if (admin_comment) payload.admin_comment = admin_comment;

      if (booking?.date) payload.date = booking.date;
      if (booking?.booking_date) payload.booking_date = booking.booking_date;
      if (booking?.lab_room) payload.lab_room = booking.lab_room;

      const res = await api.patch(`/lab-bookings/${id}/`, payload);
      return res.data;
    }
  },
};

export default labAdminService;
