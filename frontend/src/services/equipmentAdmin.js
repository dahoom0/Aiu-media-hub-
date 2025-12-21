import api from './apiClient';

/**
 * Backend fields (from your Django admin):
 * name, description, category, equipment_id, qr_code, image, status,
 * quantity_total, quantity_available, is_active
 */

const BASE = '/equipment/';

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

// Map backend object -> UI object used in React table
const toUI = (x) => {
  return {
    id: String(x.id),
    name: x.name || '',
    equipmentId: x.equipment_id || '',
    category: x.category || '',
    status: x.status || 'available',
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
  // GET all equipment
  list: async () => {
    const res = await api.get(BASE);
    const items = normalizeList(res.data);
    return items.map(toUI);
  },

  // CREATE equipment (multipart)
  create: async ({
    name,
    description,
    category,
    equipment_id,
    status,
    quantity_total,
    quantity_available,
    is_active,
    imageFile,
    qrFile,
  }) => {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', description || '');
    fd.append('category', category);
    fd.append('equipment_id', equipment_id);
    fd.append('status', status);

    if (quantity_total !== undefined && quantity_total !== null) fd.append('quantity_total', String(quantity_total));
    if (quantity_available !== undefined && quantity_available !== null) fd.append('quantity_available', String(quantity_available));
    if (is_active !== undefined && is_active !== null) fd.append('is_active', String(is_active));

    if (imageFile) fd.append('image', imageFile);
    if (qrFile) fd.append('qr_code', qrFile);

    const res = await api.post(BASE, fd);
    return toUI(res.data);
  },

  // UPDATE equipment (PATCH multipart so files can be updated)
  update: async (id, payload) => {
    const fd = new FormData();

    if (payload.name !== undefined) fd.append('name', payload.name);
    if (payload.description !== undefined) fd.append('description', payload.description || '');
    if (payload.category !== undefined) fd.append('category', payload.category);
    if (payload.equipment_id !== undefined) fd.append('equipment_id', payload.equipment_id);
    if (payload.status !== undefined) fd.append('status', payload.status);

    if (payload.quantity_total !== undefined && payload.quantity_total !== null) fd.append('quantity_total', String(payload.quantity_total));
    if (payload.quantity_available !== undefined && payload.quantity_available !== null) fd.append('quantity_available', String(payload.quantity_available));
    if (payload.is_active !== undefined && payload.is_active !== null) fd.append('is_active', String(payload.is_active));

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
};

export default equipmentAdmin;
