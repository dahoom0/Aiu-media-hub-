// src/services/labBookingService.js
import api from './apiClient';

const labBookingService = {
  /**
   * Get labs list
   * Backend: GET /labs/
   */
  getLabs: async () => {
    const response = await api.get('/labs/');
    return response.data;
  },

  /**
   * Create a new booking
   *
   * Backend Serializer accepts (write-only):
   * - lab_room (lab name)
   * - date (YYYY-MM-DD)
   * - time_slot ("HH:MM-HH:MM")
   * - imac_number (1-30)
   * - purpose
   * - participants
   */
  create: async (bookingData) => {
    const {
      lab_room,
      date,
      time_slot,
      imac_number,
      purpose,
      participants = 1,
    } = bookingData;

    const payload = {
      lab_room,
      date,
      time_slot,
      imac_number,
      purpose,
      participants,
    };

    const response = await api.post('/lab-bookings/', payload);
    return response.data;
  },

  /**
   * Get current student's bookings
   * ✅ FIX: There is NO /my-bookings/ action in your backend.
   * Backend already filters bookings in get_queryset()
   * so GET /lab-bookings/ returns only the logged-in student's bookings.
   */
  getMyBookings: async () => {
    const response = await api.get('/lab-bookings/');
    return response.data;
  },

  /**
   * Get available iMac numbers for a lab+date+time slot
   *
   * ✅ FIX: Backend endpoint is:
   * GET /lab-bookings/available-imacs/?date=YYYY-MM-DD&time_slot=09:00-11:00&lab_room=BMC%20Lab
   *
   * Response:
   * {
   *   lab_room: "BMC Lab",
   *   date: "2025-12-21",
   *   time_slot: "10:00-12:00",
   *   available_imacs: [1,2,5,...]
   * }
   */
  getAvailableImacs: async ({ lab_room, date, time_slot }) => {
    const response = await api.get('/lab-bookings/available-imacs/', {
      params: {
        lab_room,
        date,
        time_slot,
      },
    });
    return response.data; // object with available_imacs
  },

  /**
   * Cancel a booking
   * NOTE: your backend does NOT define /cancel/ action in views.py
   * so keep this only if you really created it elsewhere.
   * If not, DO NOT call it from UI.
   */
  cancel: async (id) => {
    const response = await api.post(`/lab-bookings/${id}/cancel/`);
    return response.data;
  },
};

export default labBookingService;