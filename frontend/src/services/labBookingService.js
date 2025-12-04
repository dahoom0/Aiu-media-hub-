import api from './apiClient';

const labBookingService = {
  // 1. Create a new booking request
  create: async (bookingData) => {
    // bookingData should look like: { lab_room: "Studio A", date: "2023-12-01", time_slot: "09:00-11:00", purpose: "..." }
    const response = await api.post('/lab-bookings/', bookingData);
    return response.data;
  },

  // 2. Get only the current logged-in user's bookings
  getMyBookings: async () => {
    const response = await api.get('/lab-bookings/my_bookings/');
    return response.data;
  },

  // 3. Get all bookings (Useful for Admin Dashboard)
  getAll: async () => {
    const response = await api.get('/lab-bookings/');
    return response.data;
  },

  // 4. Check available slots for a specific room and date
  getAvailableSlots: async (labRoom, date) => {
    const response = await api.get('/lab-bookings/available_slots/', {
      params: { lab_room: labRoom, date: date }
    });
    return response.data;
  },

  // 5. Cancel a booking
  cancel: async (id) => {
    const response = await api.post(`/lab-bookings/${id}/cancel/`);
    return response.data;
  }
};

export default labBookingService;