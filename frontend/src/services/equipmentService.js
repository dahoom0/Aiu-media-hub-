import api from './apiClient';

// ✅ normalize single category: "Camera" OR {id, name} OR number
const normalizeCategory = (cat) => {
  if (!cat) return '';
  if (typeof cat === 'string') return cat;
  if (typeof cat === 'object') {
    if (cat.name) return String(cat.name);
    if (cat.title) return String(cat.title);
    if (cat.label) return String(cat.label);
    if (cat.id !== undefined && cat.id !== null) return String(cat.id);
  }
  return String(cat);
};

// ✅ normalize categories array -> ["Cameras", "Audio", ...]
const normalizeCategories = (cats) => {
  if (!cats) return [];
  if (Array.isArray(cats)) return cats.map(normalizeCategory).filter(Boolean);
  const single = normalizeCategory(cats);
  return single ? [single] : [];
};

// ✅ turn category names into stable slugs for filtering tabs
const toCategorySlug = (name) => {
  const n = String(name || '').toLowerCase().trim();

  // map common names -> your UI tab values
  if (n.includes('camera')) return 'camera';
  if (n.includes('audio') || n.includes('mic')) return 'audio';
  if (n.includes('light')) return 'lighting';
  if (n.includes('access')) return 'accessories';

  // fallback slug
  return n.replace(/\s+/g, '-');
};

const normalizeCategorySlugs = (cats, legacyCategory) => {
  const names = normalizeCategories(cats);
  const slugsFromNames = names.map(toCategorySlug).filter(Boolean);

  // also include legacy single field (if backend still sends it)
  const legacy = normalizeCategory(legacyCategory);
  const legacySlug = legacy ? toCategorySlug(legacy) : '';

  const merged = [...slugsFromNames, legacySlug].filter(Boolean);

  // unique
  return Array.from(new Set(merged));
};

// ✅ normalize equipment response to UI format
const toUI = (item) => {
  if (!item) return null;

  const qtyTotal = Number(item.quantity_total ?? item.quantityTotal ?? 0);
  const qtyAvail = Number(item.quantity_available ?? item.quantityAvailable ?? 0);

  const categories = normalizeCategories(item.categories || item.category);

  return {
    // ✅ IMPORTANT: keep PK numeric
    id: Number(item.id),

    name: item.name || '',

    // ✅ equipment code string for display (CAM001)
    equipmentId: item.equipment_id || item.equipmentId || '',

    // legacy single category (string)
    category: normalizeCategory(item.category),

    // ✅ readable names (for display / chips)
    categories,

    // ✅ NEW: slugs for filtering tabs (camera/audio/lighting/accessories)
    categorySlugs: normalizeCategorySlugs(item.categories, item.category),

    quantity_total: qtyTotal,
    quantity_available: qtyAvail,

    status: (item.status || 'available').toLowerCase(),
    image: item.image || '',
    description: item.description || '',
    is_active: item.is_active,
  };
};

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(toUI).filter(Boolean);
  if (Array.isArray(data.results)) return data.results.map(toUI).filter(Boolean);
  return [];
};

// ✅ NEW: fetch all pages when DRF pagination is enabled
const fetchAllEquipment = async () => {
  const allRaw = [];

  // start with first page
  let nextUrl = '/equipment/';

  while (nextUrl) {
    const res = await api.get(nextUrl);
    const data = res.data;

    // Paginated shape: { count, next, previous, results }
    if (data && Array.isArray(data.results)) {
      allRaw.push(...data.results);
      nextUrl = data.next; // can be null, absolute URL, or relative URL
      continue;
    }

    // Non-paginated shape: [ ... ]
    if (Array.isArray(data)) {
      allRaw.push(...data);
      nextUrl = null;
      continue;
    }

    // Unknown shape: stop safely
    nextUrl = null;
  }

  return allRaw.map(toUI).filter(Boolean);
};

const equipmentService = {
  // ✅ catalog (now returns ALL items, not only first page)
  getAll: async () => {
    return await fetchAllEquipment();
  },

  // ✅ single checkout (your backend expects the CODE here, e.g. CAM001)
  checkout: async (equipmentId, location = 'Main Desk', pickupDate = null, duration = 1, notes = '') => {
    const payload = {
      equipment_id: String(equipmentId || '').trim(), // ✅ CAM001 (code)
      duration: Number(duration) || 1,
      notes: notes || '',
      location: location || 'Main Desk',
      pickup_date: pickupDate,
    };

    const response = await api.post('/equipment/checkout/', payload);
    return response.data;
  },

  // ✅ Student bundle submit: backend expects PK integer for equipment_id
  createEquipmentRequest: async (payload) => {
    const cleaned = {
      notes: payload?.notes || '',
      cart_items: Array.isArray(payload?.cart_items)
        ? payload.cart_items.map((x) => ({
            // ✅ MUST BE PK integer (Equipment.id)
            equipment_id: Number(x?.equipment_id),
            quantity: Number(x?.quantity) || 1,
            duration_days: Number(x?.duration_days) || 1,
            notes: x?.notes || '',
          }))
        : [],
    };

    if (!cleaned.cart_items.length) {
      throw new Error('Cart is empty.');
    }
    const bad = cleaned.cart_items.find((i) => !Number.isFinite(i.equipment_id) || i.equipment_id <= 0);
    if (bad) {
      throw new Error('Invalid equipment_id in cart_items (must be numeric PK).');
    }

    const response = await api.post('/equipment-requests/', cleaned);
    return response.data;
  },

  // ✅ rentals list (student)
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

  cancelRental: async (rentalId) => {
    const response = await api.post(`/equipment-rentals/${rentalId}/cancel/`);
    return response.data;
  },
};

export default equipmentService;
