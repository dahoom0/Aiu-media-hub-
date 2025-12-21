// src/services/adminService.js
import api from './apiClient';

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
};

const normStatus = (v) => String(v || '').trim().toLowerCase();

const adminService = {
  // --- Dashboard Stats ---
  // NOTE:
  // AdminDashboard.tsx currently displays:
  // - "Active Bookings" using statsData.pendingBookings
  // - "Tutorial Views" using statsData.pendingCVs
  //
  // We keep that contract to avoid changing your UI/component structure.
  getDashboardStats: async () => {
    const [
      studentsRes,
      bookingsRes,
      rentalsRes,
      cvsRes,
      tutorialsRes,
    ] = await Promise.all([
      api.get('/student-profiles/'),
      api.get('/lab-bookings/'),
      api.get('/equipment-rentals/'),
      api.get('/cvs/'),
      api.get('/tutorials/'),
    ]);

    const studentsData = studentsRes.data;
    const bookingsData = bookingsRes.data;
    const rentalsData = rentalsRes.data;
    const cvsData = cvsRes.data;
    const tutorialsData = tutorialsRes.data;

    const studentsList = normalizeList(studentsData);
    const bookingsList = normalizeList(bookingsData);
    const rentalsList = normalizeList(rentalsData);
    const cvsList = normalizeList(cvsData);
    const tutorialsList = normalizeList(tutorialsData);

    // Students count
    const totalStudents =
      studentsData && typeof studentsData.count === 'number'
        ? studentsData.count
        : studentsList.length;

    // Bookings
    const pendingBookings = bookingsList.filter(
      (b) => normStatus(b.status) === 'pending'
    ).length;

    // Your dashboard card label says "Active Bookings"
    // We'll treat "active" as: pending OR approved (not rejected/cancelled/completed)
    const activeBookings = bookingsList.filter((b) => {
      const s = normStatus(b.status);
      return s === 'pending' || s === 'approved';
    }).length;

    // Rentals: count active/in_use (different projects name status differently)
    const activeRentals = rentalsList.filter((r) => {
      const s = normStatus(r.status);
      return s === 'active' || s === 'in_use' || s === 'in-use' || s === 'ongoing';
    }).length;

    // CVs pending
    const pendingCVs = cvsList.filter((c) => normStatus(c.status) === 'pending').length;

    // Tutorials total views (matches your Django Admin "views" column)
    const tutorialViews = tutorialsList.reduce((sum, t) => {
      const v = Number(t.views);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);

    return {
      totalStudents,

      // IMPORTANT: AdminDashboard uses this field for the "Active Bookings" card
      pendingBookings: activeBookings,

      activeRentals,

      // IMPORTANT: AdminDashboard uses this field for the "Tutorial Views" card
      pendingCVs: tutorialViews,

      // (Optional extra fields if you want later)
      // realPendingBookings: pendingBookings,
      // realPendingCVs: pendingCVs,
    };
  },

  // --- Lab Management ---
  getAllBookings: async () => {
    const response = await api.get('/lab-bookings/');
    return response.data;
  },

  approveBooking: async (id) => {
    const response = await api.post(`/lab-bookings/${id}/approve/`);
    return response.data;
  },

  rejectBooking: async (id) => {
    const response = await api.post(`/lab-bookings/${id}/reject/`);
    return response.data;
  },

  // --- Equipment Management ---
  getAllRentals: async () => {
    const response = await api.get('/equipment-rentals/');
    return response.data;
  },

  forceReturnItem: async (rentalId) => {
    const response = await api.post(`/equipment-rentals/${rentalId}/return_item/`);
    return response.data;
  },

  // --- CV Management ---
  getAllCVs: async () => {
    const response = await api.get('/cvs/');
    return response.data;
  },

  approveCV: async (id) => {
    const response = await api.post(`/cvs/${id}/approve/`);
    return response.data;
  },
};

export default adminService;
