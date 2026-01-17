import api from './apiClient';

/**
 * Backend fields (from your Django admin):
 * name, description, category, equipment_id, qr_code, image, status,
 * quantity_total, quantity_available, is_active
 */

const BASE = '/equipment/';
const RENTALS_BASE = '/equipment-rentals/';

// Build origin from apiClient baseURL (http://localhost:8000/api -> http://localhost:8000)
const getApiOrigin = () => {
  const base = api.defaults.baseURL || 'http://localhost:8000/api';
  return base.replace(/\/api\/?$/, '');
};

const normalizeImageUrl = (val) => {
  if (!val) return '';

  const ORIGIN = getApiOrigin() || 'http://localhost:8000';

  // sometimes val is {url: "..."}
  const s = typeof val === 'string' ? val : val?.url || '';
  if (!s) return '';

  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  // "/media/xxx"
  if (s.startsWith('/media/')) return `${ORIGIN}${s}`;

  // "media/xxx"
  if (s.startsWith('media/')) return `${ORIGIN}/${s}`;

  // "equipment_images/xxx" (like Django admin shows)
  return `${ORIGIN}/media/${s.replace(/^\/+/, '')}`;
};

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

// ✅ category can be: "Camera" OR {id, name} OR number
const normalizeCategory = (cat) => {
  if (!cat) return '';
  if (typeof cat === 'string') return cat;
  if (typeof cat === 'object') {
    // common DRF nested serializer: {id, name}
    if (cat.name) return String(cat.name);
    if (cat.title) return String(cat.title);
    if (cat.label) return String(cat.label);
    // fallback: try id
    if (cat.id !== undefined && cat.id !== null) return String(cat.id);
  }
  // number / other primitive
  return String(cat);
};

// Map backend equipment -> UI object used in React table
const toUI = (x) => {
  return {
    id: String(x.id),
    name: x.name || '',
    equipmentId: x.equipment_id || x.equipmentId || '',
    category: normalizeCategory(x.category),
    status: (x.status || 'available').toLowerCase(),
    imageUrl: normalizeImageUrl(x.image),
    description: x.description || '',

    // keep backend fields too (optional if you need later)
    quantity_total: x.quantity_total,
    quantity_available: x.quantity_available,
    is_active: x.is_active,
    qr_code: x.qr_code,
  };
};

const equipmentAdmin = {
  // -------------------------
  // EQUIPMENT CRUD
  // -------------------------

  // GET all equipment
  list: async () => {
    const res = await api.get(BASE);
    const items = normalizeList(res.data);
    return items.map(toUI);
  },

  // CREATE equipment (multipart)
  create: async (payload) => {
    const {
      name,
      description,
      category,
      status,
      quantity_total,
      quantity_available,
      is_active,
      imageFile,
      qrFile,

      // support both naming styles:
      equipmentId,
      equipment_id,
    } = payload || {};

    const finalEquipmentId = equipmentId ?? equipment_id ?? '';

    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', description || '');
    fd.append('category', category);
    fd.append('equipment_id', finalEquipmentId);
    fd.append('status', status);

    if (quantity_total !== undefined && quantity_total !== null)
      fd.append('quantity_total', String(quantity_total));
    if (quantity_available !== undefined && quantity_available !== null)
      fd.append('quantity_available', String(quantity_available));
    if (is_active !== undefined && is_active !== null)
      fd.append('is_active', String(is_active));

    if (imageFile) fd.append('image', imageFile);
    if (qrFile) fd.append('qr_code', qrFile);

    const res = await api.post(BASE, fd);
    return toUI(res.data);
  },

  // UPDATE equipment (PATCH multipart so files can be updated)
  update: async (id, payload = {}) => {
    const fd = new FormData();

    if (payload.name !== undefined) fd.append('name', payload.name);
    if (payload.description !== undefined)
      fd.append('description', payload.description || '');

    if (payload.category !== undefined) fd.append('category', payload.category);

    // support both equipmentId and equipment_id
    const finalEquipmentId = payload.equipmentId ?? payload.equipment_id;
    if (finalEquipmentId !== undefined) fd.append('equipment_id', finalEquipmentId);

    if (payload.status !== undefined) fd.append('status', payload.status);

    if (payload.quantity_total !== undefined && payload.quantity_total !== null)
      fd.append('quantity_total', String(payload.quantity_total));
    if (payload.quantity_available !== undefined && payload.quantity_available !== null)
      fd.append('quantity_available', String(payload.quantity_available));
    if (payload.is_active !== undefined && payload.is_active !== null)
      fd.append('is_active', String(payload.is_active));

    if (payload.imageFile) fd.append('image', payload.imageFile);
    if (payload.qrFile) fd.append('qr_code', payload.qrFile);

    const res = await api.patch(`${BASE}${id}/`, fd);
    return toUI(res.data);
  },

  // Update status only
  updateStatus: async (id, status) => {
    const res = await api.patch(`${BASE}${id}/`, { status });
    return toUI(res.data);
  },

  // Delete
  remove: async (id) => {
    await api.delete(`${BASE}${id}/`);
  },

  // ✅ EXPORT INVENTORY (CSV)
  // IMPORTANT: must be "/equipment/export/" + blob
  exportInventory: async () => {
    const res = await api.get(`${BASE}export/`, {
      responseType: 'blob',
    });
    return res; // return axios response so frontend can read headers + blob
  },

  // -------------------------
  // RENTALS ADMIN
  // -------------------------

  // GET all rentals (admin sees all due to backend permissions)
  listRentals: async () => {
    const res = await api.get(RENTALS_BASE);
    return res.data;
  },

  // Approve a rental request
  approveRental: async (id) => {
    const res = await api.post(`${RENTALS_BASE}${id}/approve/`);
    return res.data;
  },

  // Reject a rental request (send reject_reason to match backend)
  rejectRental: async (id, reason) => {
    const payload = { reject_reason: (reason || 'Rejected by admin') };
    const res = await api.post(`${RENTALS_BASE}${id}/reject/`, payload);
    return res.data;
  },
};

export default equipmentAdmin;
