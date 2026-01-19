import api from './apiClient';

/**
 * Backend fields:
 * Equipment: name, description, category (REQUIRED legacy CharField), equipment_id, image, status,
 *            quantity_total, quantity_available (READ), quantity_under_maintenance, is_active
 * EquipmentCategory: id, name, color (M2M via category_ids)
 *
 * Serializer behavior:
 * - READ: categories: [{id,name,color}]
 * - WRITE: category_ids: [1,2,3]   (sent as repeated keys in FormData)
 *
 * IMPORTANT:
 * - Equipment.category is REQUIRED (CharField with choices):
 *   ['camera','audio','lighting','accessories','other']
 * - quantity_available is READ-ONLY in serializer -> do NOT send it in create/update
 */

const BASE = '/equipment/';
const RENTALS_BASE = '/equipment-rentals/';
const CATEGORY_BASE = '/equipment-categories/';

const getApiOrigin = () => {
  const base = api.defaults.baseURL || 'http://localhost:8000/api';
  return base.replace(/\/api\/?$/, '');
};

const normalizeImageUrl = (val) => {
  if (!val) return '';
  const ORIGIN = getApiOrigin() || 'http://localhost:8000';

  const s = typeof val === 'string' ? val : (val?.url || '');
  if (!s) return '';

  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/media/')) return `${ORIGIN}${s}`;
  if (s.startsWith('media/')) return `${ORIGIN}/${s}`;
  return `${ORIGIN}/media/${String(s).replace(/^\/+/, '')}`;
};

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

// categories read shape: [{id,name,color}]
const normalizeCategoryObj = (cat) => {
  if (!cat) return null;
  if (typeof cat === 'object') {
    return {
      id: cat.id,
      name: String(cat.name || ''),
      color: cat.color || null,
    };
  }
  return null;
};

const normalizeCategoriesObjs = (cats) => {
  if (!cats) return [];
  if (Array.isArray(cats)) return cats.map(normalizeCategoryObj).filter(Boolean);
  const one = normalizeCategoryObj(cats);
  return one ? [one] : [];
};

const safeStatus = (s) => String(s || 'available').toLowerCase();
const normalizeStatus = (s) => {
  const x = safeStatus(s);
  if (x.includes('maint')) return 'maintenance';
  if (x.includes('rent')) return 'rented';
  if (x.includes('avail')) return 'available';
  return x || 'available';
};

// ✅ map UI/category name -> backend legacy choices
const normalizeLegacyCategory = (val) => {
  const s = String(val || '').toLowerCase().trim();
  if (!s) return 'other';

  // handle typos/plurals from UI
  if (s.includes('audio')) return 'audio';
  if (s.includes('access')) return 'accessories';
  if (s.includes('light')) return 'lighting';
  if (s.includes('camera') || s.includes('camer')) return 'camera';

  // if backend already sends proper choice, keep it
  if (['camera', 'audio', 'lighting', 'accessories', 'other'].includes(s)) return s;

  return 'other';
};

// Map backend equipment -> UI object
const toUI = (x) => {
  const categoriesObjs = normalizeCategoriesObjs(x?.categories);

  const total =
    (typeof x?.quantity_total === 'number' && x.quantity_total) ||
    (typeof x?.quantity === 'number' && x.quantity) ||
    Number(x?.quantity_total ?? x?.quantity ?? 1);

  const quantity_available =
    typeof x?.quantity_available === 'number' ? x.quantity_available : undefined;

  const quantity_under_maintenance =
    typeof x?.quantity_under_maintenance === 'number' ? x.quantity_under_maintenance : undefined;

  return {
    id: String(x.id),
    name: x.name || '',
    equipmentId: x.equipment_id || x.equipmentId || '',

    // ✅ legacy single category string
    category: x.category || 'other',

    // ✅ categories objects + ids (M2M)
    categories: categoriesObjs,
    category_ids: categoriesObjs.map((c) => c.id),

    quantity: Number.isFinite(Number(total)) ? Number(total) : 1,
    quantity_total: x.quantity_total,
    quantity_available,
    quantity_under_maintenance,

    status: normalizeStatus(x.status),
    imageUrl: normalizeImageUrl(x.image),
    description: x.description || '',
    is_active: x.is_active,
    qr_code: x.qr_code,
  };
};

// ---------- FormData helpers ----------
const appendIfDefined = (fd, key, value) => {
  if (value === undefined || value === null) return;
  fd.append(key, String(value));
};

const appendCategoryIds = (fd, category_ids) => {
  if (!Array.isArray(category_ids)) return;
  category_ids
    .filter((id) => id !== null && id !== undefined && id !== '')
    .forEach((id) => fd.append('category_ids', String(id)));
};

// ✅ ensure required legacy `category` is always sent
const appendRequiredLegacyCategory = (fd, payloadCategory, category_ids, categoriesLookup) => {
  // 1) if UI already provides a legacy category string, use it
  if (payloadCategory) {
    fd.append('category', normalizeLegacyCategory(payloadCategory));
    return;
  }

  // 2) try infer from first selected EquipmentCategory name
  const firstId = Array.isArray(category_ids) && category_ids.length > 0 ? category_ids[0] : null;

  if (firstId && Array.isArray(categoriesLookup)) {
    const found = categoriesLookup.find((c) => String(c.id) === String(firstId));
    if (found?.name) {
      fd.append('category', normalizeLegacyCategory(found.name));
      return;
    }
  }

  // 3) fallback
  fd.append('category', 'other');
};

const equipmentAdmin = {
  // -------------------------
  // CATEGORIES
  // -------------------------
  listCategories: async () => {
    const res = await api.get(CATEGORY_BASE);
    return normalizeList(res.data); // [{id,name,color}]
  },

  // -------------------------
  // EQUIPMENT CRUD
  // -------------------------
  list: async () => {
    const res = await api.get(BASE);
    return normalizeList(res.data).map(toUI);
  },

  create: async (payload = {}) => {
    const {
      name,
      description,
      status,

      // quantities
      quantity_total,
      quantity_under_maintenance,

      // legacy alias
      quantity,

      // ✅ legacy category string (optional if UI provides)
      category,

      // optional: pass categories list from UI so we can infer category string from first id
      categoriesLookup,

      is_active,
      imageFile,
      qrFile,
      equipmentId,
      equipment_id,

      // category ids from UI
      category_ids,
    } = payload;

    const finalEquipmentId = equipmentId ?? equipment_id ?? '';
    const finalStatus = normalizeStatus(status || 'available');

    const fd = new FormData();
    fd.append('name', name);
    fd.append('description', description || '');
    fd.append('equipment_id', finalEquipmentId);
    fd.append('status', finalStatus);

    // Prefer explicit quantity_total; fallback to legacy `quantity`
    const totalToSend =
      quantity_total !== undefined && quantity_total !== null ? quantity_total : quantity;

    appendIfDefined(fd, 'quantity_total', totalToSend);

    // ✅ DO NOT send quantity_available (read-only in serializer)
    appendIfDefined(fd, 'quantity_under_maintenance', quantity_under_maintenance);
    appendIfDefined(fd, 'is_active', is_active);

    // ✅ M2M categories
    appendCategoryIds(fd, category_ids);

    // ✅ REQUIRED legacy category (CharField choices)
    appendRequiredLegacyCategory(fd, category, category_ids, categoriesLookup);

    if (imageFile) fd.append('image', imageFile);
    if (qrFile) fd.append('qr_code', qrFile);

    const res = await api.post(BASE, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toUI(res.data);
  },

  update: async (id, payload = {}) => {
    const fd = new FormData();

    if (payload.name !== undefined) fd.append('name', payload.name);
    if (payload.description !== undefined) fd.append('description', payload.description || '');

    const finalEquipmentId = payload.equipmentId ?? payload.equipment_id;
    if (finalEquipmentId !== undefined) fd.append('equipment_id', String(finalEquipmentId));

    if (payload.status !== undefined) fd.append('status', normalizeStatus(payload.status));

    // quantities (prefer quantity_total, fallback to legacy `quantity`)
    const totalToSend =
      payload.quantity_total !== undefined && payload.quantity_total !== null
        ? payload.quantity_total
        : payload.quantity;

    appendIfDefined(fd, 'quantity_total', totalToSend);

    // ✅ DO NOT send quantity_available (read-only in serializer)
    appendIfDefined(fd, 'quantity_under_maintenance', payload.quantity_under_maintenance);
    appendIfDefined(fd, 'is_active', payload.is_active);

    // categories (M2M)
    if (Array.isArray(payload.category_ids)) {
      appendCategoryIds(fd, payload.category_ids);
    }

    // ✅ REQUIRED legacy category (always ensure exists)
    if (payload.category !== undefined || Array.isArray(payload.category_ids)) {
      appendRequiredLegacyCategory(fd, payload.category, payload.category_ids, payload.categoriesLookup);
    }

    if (payload.imageFile) fd.append('image', payload.imageFile);
    if (payload.qrFile) fd.append('qr_code', payload.qrFile);

    const res = await api.patch(`${BASE}${id}/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toUI(res.data);
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`${BASE}${id}/`, { status: normalizeStatus(status) });
    return toUI(res.data);
  },

  remove: async (id) => {
    await api.delete(`${BASE}${id}/`);
  },

  exportInventory: async () => {
    const res = await api.get(`${BASE}export/`, { responseType: 'blob' });
    return res;
  },

  // -------------------------
  // RENTALS ADMIN
  // -------------------------
  listRentals: async () => {
    const res = await api.get(RENTALS_BASE);
    return res.data;
  },

  approveRental: async (id) => {
    const res = await api.post(`${RENTALS_BASE}${id}/approve/`);
    return res.data;
  },

  rejectRental: async (id, reason) => {
    const payload = { reject_reason: reason || 'Rejected by admin' };
    const res = await api.post(`${RENTALS_BASE}${id}/reject/`, payload);
    return res.data;
  },
};

export default equipmentAdmin;
