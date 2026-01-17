import api from './apiClient';

const equipmentService = {
  getAll: async () => {
    const response = await api.get('/equipment/');
    return response.data;
  },

  checkout: async (equipmentId, location = 'Main Desk', pickupDate = null, duration = 1, notes = '') => {
    const payload = {
      equipment_id: equipmentId,
      duration: Number(duration) || 1,
      notes: notes || '',
      location: location || 'Main Desk',
      pickup_date: pickupDate,
    };

    const response = await api.post('/equipment/checkout/', payload);
    return response.data;
  },

  getRentals: async () => {
    const response = await api.get('/equipment-rentals/');
    return response.data;
  },

  returnItem: async (rentalId) => {
    const response = await api.post(`/equipment-rentals/${rentalId}/return_item/`);
    return response.data;
  },

  approveRental: async (rentalId) => {
    const response = await api.post(`/equipment-rentals/${rentalId}/approve/`);
    return response.data;
  },

  rejectRental: async (rentalId, reason) => {
    const response = await api.post(`/equipment-rentals/${rentalId}/reject/`, {
      reason: reason || 'Rejected by admin',
    });
    return response.data;
  },

  // ✅ Student: cancel pending request
  // expected: POST /equipment-rentals/:id/cancel/
  cancelRental: async (rentalId) => {
    const response = await api.post(`/equipment-rentals/${rentalId}/cancel/`);
    return response.data;
  },
};

export default equipmentService;
