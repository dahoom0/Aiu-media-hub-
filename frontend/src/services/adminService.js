import api from './apiClient';

const adminService = {
  // --- Dashboard Stats ---
  getDashboardStats: async () => {
    // We fetch lists to count them (or create a specific stats endpoint in backend later)
    const [students, bookings, rentals, cvs] = await Promise.all([
      api.get('/student-profiles/'),
      api.get('/lab-bookings/'),
      api.get('/equipment-rentals/'),
      api.get('/cvs/')
    ]);

    return {
      totalStudents: students.data.results ? students.data.count : students.data.length,
      pendingBookings: (bookings.data.results || bookings.data).filter(b => b.status === 'pending').length,
      activeRentals: (rentals.data.results || rentals.data).filter(r => r.status === 'active').length,
      pendingCVs: (cvs.data.results || cvs.data).filter(c => c.status === 'pending').length,
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
  // Admin can force return an item
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
  }
};

export default adminService;