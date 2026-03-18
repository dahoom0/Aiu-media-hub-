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
    try {
      console.log('Fetching dashboard stats...');
      
      const [
        studentsRes,
        bookingsRes,
        rentalsRes,
        cvsRes,
        tutorialsRes,
      ] = await Promise.all([
        api.get('/student-profiles/').catch(err => {
          console.error('Failed to fetch student profiles:', err.response?.data);
          return { data: [] };
        }),
        api.get('/lab-bookings/').catch(err => {
          console.error('Failed to fetch bookings:', err.response?.data);
          return { data: [] };
        }),
        api.get('/equipment-rentals/').catch(err => {
          console.error('Failed to fetch rentals:', err.response?.data);
          return { data: [] };
        }),
        api.get('/cvs/').catch(err => {
          console.error('Failed to fetch CVs:', err.response?.data);
          return { data: [] };
        }),
        api.get('/tutorials/').catch(err => {
          console.error('Failed to fetch tutorials:', err.response?.data);
          return { data: [] };
        }),
      ]);

      console.log('Students response:', studentsRes.data);
      console.log('Bookings response:', bookingsRes.data);
      console.log('Rentals response:', rentalsRes.data);
      console.log('CVs response:', cvsRes.data);
      console.log('Tutorials response:', tutorialsRes.data);

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

      console.log('Normalized counts:', {
        students: studentsList.length,
        bookings: bookingsList.length,
        rentals: rentalsList.length,
        cvs: cvsList.length,
        tutorials: tutorialsList.length
      });

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

      const stats = {
        totalStudents,
        pendingBookings: activeBookings,
        activeRentals,
        pendingCVs: tutorialViews,
      };

      console.log('Calculated stats:', stats);
      return stats;
    } catch (error) {
      console.error('getDashboardStats error:', error);
      throw error;
    }
  },

  // --- Lab Management ---
  getAllBookings: async () => {
    try {
      console.log('Fetching all bookings...');
      const response = await api.get('/lab-bookings/');
      console.log('Bookings fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('getAllBookings error:', error.response?.data || error.message);
      throw error;
    }
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
    try {
      console.log('Fetching all rentals...');
      const response = await api.get('/equipment-rentals/');
      console.log('Rentals fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('getAllRentals error:', error.response?.data || error.message);
      throw error;
    }
  },

  forceReturnItem: async (rentalId) => {
    const response = await api.post(`/equipment-rentals/${rentalId}/return_item/`);
    return response.data;
  },

  // --- CV Management ---
  getAllCVs: async () => {
    try {
      console.log('Fetching all CVs...');
      const response = await api.get('/cvs/');
      console.log('CVs fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('getAllCVs error:', error.response?.data || error.message);
      throw error;
    }
  },

  approveCV: async (id) => {
    const response = await api.post(`/cvs/${id}/approve/`);
    return response.data;
  },
};

export default adminService;
