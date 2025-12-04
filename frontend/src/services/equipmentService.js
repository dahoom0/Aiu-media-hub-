import api from './apiClient';

const equipmentService = {
  getAll: async () => {
    const response = await api.get('/equipment/');
    return response.data;
  },

  // FIX: Using 'equipment_id' matching the backend logic
  checkout: async (equipmentId, location) => {
    const response = await api.post('/equipment/checkout/', {
      equipment_id: equipmentId, 
      location: location
    });
    return response.data;
  },

  getMyActiveRentals: async () => {
    const response = await api.get('/equipment-rentals/');
    return response.data;
  },

  returnItem: async (rentalId) => {
    const response = await api.post(`/equipment-rentals/${rentalId}/return_item/`);
    return response.data;
  }
};

export default equipmentService;