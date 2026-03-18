/**
 * AdminEquipmentManagement Component
 * 
 * Comprehensive dashboard for managing equipment inventory, categories, and rental requests.
 * Enables admins to add/edit/delete equipment, approve/reject rental requests, and export data.
 */

// ============================================================================
// IMPORTS - Third-party libraries and React components
// ============================================================================
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useTheme } from './ThemeProvider';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Plus, Edit, Trash2, Upload, CheckCircle2, XCircle, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';

// API client for making HTTP requests to the backend
import api from '../services/apiClient';

// ============================================================================
// CONSTANTS - API configuration and endpoints
// ============================================================================

// Base URL for API endpoints - use relative path in production
const isDevelopment = import.meta.env.DEV;
const API_ORIGIN = isDevelopment ? `http://${window.location.hostname}:8000` : '';

// ============================================================================
// UTILITY FUNCTIONS - Helper methods for data transformation
// ============================================================================

/**
 * Constructs a complete media URL from various input formats
 * Handles relative paths, absolute URLs, and object-based responses
 */
const buildMediaUrl = (val: any) => {
  if (!val) return ''; // Return an empty string if the value is null or undefined

  // If the value is a valid URL string, return it as is
  if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
    return val;
  }

  // If the value is an object with a 'url' property, construct the full URL
  if (typeof val === 'object' && val?.url) {
    const u = val.url;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('/')) return `${API_ORIGIN}${u}`;
    return `${API_ORIGIN}/${u}`;
  }

  // Handle other cases where the value is a string
  const url = String(val);

  if (url.startsWith('/media/')) return `${API_ORIGIN}${url}`;
  if (url.startsWith('media/')) return `${API_ORIGIN}/${url}`;

  if (!url.startsWith('/')) return `${API_ORIGIN}/media/${url}`;

  return `${API_ORIGIN}${url}`; // Default case
};

// ============================================================================
// TYPE DEFINITIONS - Data structures for equipment and rentals
// ============================================================================

/**
 * Status values used across equipment items and rental requests
 */
type StatusString =
  | 'pending' // Status when the request is awaiting approval
  | 'approved' // Status when the request has been approved
  | 'rejected' // Status when the request has been rejected
  | 'active'   // Status when the equipment is actively in use
  | 'returned' // Status when the equipment has been returned
  | 'cancelled'; // Status when the request has been cancelled

/**
 * Represents a single equipment rental request row from the backend
 */
type EquipmentRentalRow = {
  id: number;
  status?: StatusString;

  start_date?: string;
  end_date?: string;
  duration?: string;

  equipment?: number | { id?: number; name?: string; equipment_id?: string };
  equipment_name?: string;
  equipment_id?: string;

  student_name?: string;
  student_id?: string;
  student_email?: string;

  reviewed_by_name?: string;
  reviewed_at?: string;

  notes?: string;
  reject_reason?: string;

  created_at?: string;
  updated_at?: string;
};

/**
 * Represents an equipment category row from the backend
 */
type EquipmentCategoryRow = {
  id: number;
  name: string;
  created_at?: string;
};

/**
 * Frontend UI representation of equipment with normalized backend data
 * Ensures consistent data structure for all equipment items
 */
interface EquipmentUI {
  id: string; // keep string (Select uses string keys often)
  name: string;
  equipmentId: string;

  categories: string[];
  category_ids: number[];

  // ✅ BACKEND TRUTH FIELDS
  quantity_total: number;
  quantity_available: number;
  quantity_under_maintenance: number;

  // legacy / compatibility
  quantity: number;

  status: 'available' | 'rented' | 'maintenance';
  imageUrl: string;
  description: string;
}

/**
 * Normalizes paginated or non-paginated API responses into a flat array
 */
function normalizeList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

/**
 * Handles Django REST Framework pagination by fetching all pages
 * Supports both paginated and non-paginated responses
 */
async function fetchAllPaginated(startUrl: string): Promise<any[]> {
  const all: any[] = [];
  let nextUrl: any = startUrl;

  while (nextUrl) {
    const res = await api.get(nextUrl);
    const data = res.data;

    if (data && Array.isArray(data.results)) {
      all.push(...data.results);
      nextUrl = data.next; // can be null, absolute URL, or relative URL
      continue;
    }

    if (Array.isArray(data)) {
      all.push(...data);
      nextUrl = null;
      continue;
    }

    // unknown shape -> stop safely
    nextUrl = null;
  }

  return all;
}

/**
 * Safely converts any value to lowercase status string, handling null/undefined
 */
function safeStatus(x: any) {
  return String(x || '').toLowerCase();
}

/**
 * Converts various status formats to standard equipment status values
 */
function normalizeEquipmentStatus(x: any): EquipmentUI['status'] {
  const s = safeStatus(x);
  if (s === 'available') return 'available';
  if (s === 'rented') return 'rented';
  if (s === 'maintenance') return 'maintenance';

  if (s.includes('avail')) return 'available';
  if (s.includes('rent')) return 'rented';
  if (s.includes('maint')) return 'maintenance';

  return 'available';
}

/**
 * Safely parses ISO datetime strings to localized date/time display
 */
function safeTime(t?: string) {
  if (!t) return '—';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

/**
 * Extracts filename from Content-Disposition header (used in file exports)
 */
function filenameFromContentDisposition(cd?: string) {
  if (!cd) return '';
  const m = /filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
  if (!m) return '';
  try {
    return decodeURIComponent(m[2]);
  } catch {
    return m[2];
  }
}

/**
 * Triggers browser download dialog for a Blob object (CSV exports)
 */
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ============================================================================
// API ENDPOINTS - Backend router configuration
// ============================================================================
const EQUIPMENT_BASE = '/equipment/';
const RENTALS_BASE = '/equipment-rentals/';
const CATEGORIES_BASE = '/equipment-categories/';

// ============================================================================
// COMPONENT - Main equipment management admin panel
// ============================================================================
export function AdminEquipmentManagement({
  onNavigate,
}: {
  onNavigate?: (page: string, params?: any) => void;
}) {
  const { theme } = useTheme();

  // ============================================================================
  // DIALOG & UI STATE MANAGEMENT
  // ============================================================================
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentUI | null>(null);

  // Rental rejection dialog state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Status change dialog state
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ id: string; status: EquipmentUI['status']; item: EquipmentUI } | null>(null);
  const [statusChangeQuantity, setStatusChangeQuantity] = useState<number>(1);

  // CSV export loading states
  const [exportInventoryLoading, setExportInventoryLoading] = useState(false);
  const [exportRentalsLoading, setExportRentalsLoading] = useState<Record<string, boolean>>({});

  // ============================================================================
  // FORM STATE - Equipment add/edit form fields
  // ============================================================================
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [equipmentCategoryIds, setEquipmentCategoryIds] = useState<number[]>([]);

  // Inventory tracking fields (synced with backend database)
  const [equipmentTotal, setEquipmentTotal] = useState<number>(1);
  const [equipmentAvailable, setEquipmentAvailable] = useState<number>(1);
  const [equipmentMaintenance, setEquipmentMaintenance] = useState<number>(0);

  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentUI['status']>('available');
  const [equipmentImage, setEquipmentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  // ============================================================================
  // DATA STATE - Backend responses and cache
  // ============================================================================
  const [equipment, setEquipment] = useState<EquipmentUI[]>([]);
  const [categories, setCategories] = useState<EquipmentCategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Equipment rental request data
  const [rentals, setRentals] = useState<EquipmentRentalRow[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [rentalActionLoading, setRentalActionLoading] = useState<Record<number, 'approve' | 'reject' | null>>({});

  // Category management state
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  const categoryIdToName = useMemo(() => {
    const m = new Map<number, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  // ============================================================================
  // COMPUTED VALUES & MEMOIZATION
  // ============================================================================
  
  // Responsive dialog sizing for all breakpoints
  const dialogFitClass = `w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto`;

  /**
   * Transforms raw backend equipment data into standardized UI format
   * Handles multiple data structures and normalizes all fields
   */
  const mapEquipmentFromAPI = (item: any): EquipmentUI => {
    const rawId = item?.id;
    const id = rawId != null ? String(rawId) : (crypto?.randomUUID?.() ?? String(Date.now()));

    const equipment_id = item?.equipment_id ?? item?.equipmentId ?? '';
    const name = item?.name ?? '';

    const status = normalizeEquipmentStatus(item?.status);

    // ✅ STRICT: READ EXACT BACKEND FIELDS (no mixing)
    const quantity_total = Number.isFinite(Number(item?.quantity_total)) ? Number(item.quantity_total) : 0;
    const quantity_available = Number.isFinite(Number(item?.quantity_available)) ? Number(item.quantity_available) : 0;
    const quantity_under_maintenance = Number.isFinite(Number(item?.quantity_under_maintenance))
      ? Number(item.quantity_under_maintenance)
      : 0;

    // categories can be M2M (categories[]) or FK (category)
    const catObjs: any[] = Array.isArray(item?.categories)
      ? item.categories
      : (item?.category && typeof item.category === 'object' ? [item.category] : []);

    const catNames = catObjs
      .map((c: any) => (typeof c?.name === 'string' ? c.name : null))
      .filter(Boolean) as string[];

    const catIdsFromObjs = catObjs
      .map((c: any) => (typeof c?.id === 'number' ? c.id : null))
      .filter((x: any) => typeof x === 'number') as number[];

    const catIdsFromField =
      Array.isArray(item?.category_ids)
        ? item.category_ids.filter((x: any) => typeof x === 'number')
        : [];

    const catIdsFromFK =
      typeof item?.category_id === 'number'
        ? [item.category_id]
        : (typeof item?.category === 'number' ? [item.category] : []);

    const catIds = (catIdsFromField.length ? catIdsFromField : (catIdsFromObjs.length ? catIdsFromObjs : catIdsFromFK));

    const imageUrl = buildMediaUrl(item?.image);
    const description = item?.description ?? '';

    return {
      id,
      name,
      equipmentId: String(equipment_id || ''),
      categories: catNames,
      category_ids: catIds,

      quantity_total,
      quantity_available,
      quantity_under_maintenance,

      // legacy convenience
      quantity: quantity_total,

      status,
      imageUrl,
      description,
    };
  };

  // Equipment status summary statistics
  const stats = useMemo(() => {
    return {
      available: equipment.filter(e => e.status === 'available').length,
      rented: equipment.filter(e => e.status === 'rented').length,
      maintenance: equipment.filter(e => e.status === 'maintenance').length,
    };
  }, [equipment]);

  // Rental request status summary statistics
  const rentalStats = useMemo(() => {
    const pending = rentals.filter(r => safeStatus(r.status) === 'pending').length;
    const active = rentals.filter(r => safeStatus(r.status) === 'active' || safeStatus(r.status) === 'approved').length;
    const returned = rentals.filter(r => safeStatus(r.status) === 'returned').length;
    return { pending, active, returned };
  }, [rentals]);

  // ============================================================================
  // DATA FETCHING - Backend API calls for all data
  // ============================================================================
  
  /**
   * Fetches all equipment categories from the backend
   */
  const fetchCategories = async () => {
    try {
      const res = await api.get(CATEGORIES_BASE);
      const rows = normalizeList(res.data) as EquipmentCategoryRow[];
      setCategories(rows);
    } catch (err: any) {
      console.error(err);
      setCategories([]);
      toast.error('Failed to load equipment categories (check /api/equipment-categories/)');
    }
  };

  /**
   * Fetches all equipment items with pagination support
   */
  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const allRows = await fetchAllPaginated(EQUIPMENT_BASE);
      setEquipment(allRows.map(mapEquipmentFromAPI));
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load equipment');
      setEquipment([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches all equipment rental requests with pagination support
   */
  const fetchRentals = async () => {
    setRentalsLoading(true);
    try {
      const allRows = await fetchAllPaginated(RENTALS_BASE);
      setRentals(allRows as EquipmentRentalRow[]);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load equipment rental requests');
      setRentals([]);
    } finally {
      setRentalsLoading(false);
    }
  };

  /**
   * Refreshes all data from the backend (categories, equipment, rentals)
   */
  const refreshAll = async () => {
    await Promise.all([fetchCategories(), fetchEquipment(), fetchRentals()]);
  };

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================
  
  // Initial data load on component mount
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validates inventory constraints (available <= total, maintenance <= available)
  useEffect(() => {
    // available cannot exceed total
    if (equipmentAvailable > equipmentTotal) {
      setEquipmentAvailable(equipmentTotal);
    }
    // maintenance cannot exceed available
    if (equipmentMaintenance > equipmentAvailable) {
      setEquipmentMaintenance(equipmentAvailable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentTotal, equipmentAvailable, equipmentMaintenance]);

  // ============================================================================
  // FORM HANDLERS - Image upload, validation, and form reset
  // ============================================================================
  
  /**
   * Handles equipment image file selection and preview generation
   */
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEquipmentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  /**
   * Clears all form fields and resets to initial state
   */
  const resetForm = () => {
    setEquipmentName('');
    setEquipmentId('');
    setEquipmentCategoryIds([]);

    setEquipmentTotal(1);
    setEquipmentAvailable(1);
    setEquipmentMaintenance(0);

    setEquipmentDescription('');
    setEquipmentStatus('available');
    setEquipmentImage(null);
    setImagePreview('');
  };

  /**
   * Validates inventory values for logical constraints and business rules
   */
  const validateInventory = () => {
    if (equipmentTotal < 0 || equipmentAvailable < 0 || equipmentMaintenance < 0) {
      toast.error('Inventory values cannot be negative');
      return false;
    }
    if (equipmentAvailable > equipmentTotal) {
      toast.error('Available cannot be greater than Total');
      return false;
    }
    if (equipmentMaintenance > equipmentAvailable) {
      toast.error('Maintenance cannot be greater than Available');
      return false;
    }
    return true;
  };

  /**
   * Constructs FormData for equipment API requests
   * Note: quantity_available is read-only and auto-calculated by the backend
   */
  const buildEquipmentFormData = (payload: {
    name: string;
    equipment_id: string;
    quantity_total: number;
    quantity_under_maintenance: number;
    status: string;
    description: string;
    category_ids: number[];
    imageFile?: File | null;
  }) => {
    const fd = new FormData();
    fd.append('name', payload.name);
    fd.append('equipment_id', payload.equipment_id);

    fd.append('quantity_total', String(payload.quantity_total));
    fd.append('quantity_under_maintenance', String(payload.quantity_under_maintenance));

    fd.append('status', payload.status);
    fd.append('description', payload.description || '');

    // DRF safest: repeated keys for list fields
    payload.category_ids.forEach((id) => fd.append('category_ids', String(id)));

    if (payload.imageFile) {
      fd.append('image', payload.imageFile);
    }

    return fd;
  };

  // ============================================================================
  // CATEGORY MANAGEMENT
  // ============================================================================
  
  /**
   * Creates a new equipment category
   */
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/equipment-categories/', {
        name: newCategoryName.trim(),
        color: newCategoryColor
      });
      
      toast.success('Category created successfully!');
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setIsAddCategoryDialogOpen(false);
      
      // Reload categories
      await loadCategories();
      
      // Auto-select the new category
      if (response.data?.id) {
        setEquipmentCategoryIds(prev => [...prev, response.data.id]);
      }
    } catch (err: any) {
      console.error('Failed to create category:', err);
      toast.error(err?.response?.data?.detail || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // EQUIPMENT CRUD OPERATIONS
  // ============================================================================
  
  /**
   * Creates new equipment item with validation and image upload
   */
  const handleAddEquipment = async () => {
    if (!equipmentName || !equipmentId || equipmentCategoryIds.length === 0) {
      toast.error('Please fill in all required fields (including at least one category)');
      return;
    }
    if (!validateInventory()) return;

    try {
      const fd = buildEquipmentFormData({
        name: equipmentName,
        equipment_id: equipmentId,
        quantity_total: equipmentTotal,
        quantity_under_maintenance: equipmentMaintenance,
        status: equipmentStatus,
        description: equipmentDescription,
        category_ids: equipmentCategoryIds,
        imageFile: equipmentImage,
      });

      const res = await api.post(EQUIPMENT_BASE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const created = mapEquipmentFromAPI(res.data);
      setEquipment(prev => [created, ...prev]);
      toast.success('Equipment added successfully!');
      resetForm();
      setIsAddDialogOpen(false);
    } catch (err: any) {
      console.error(err);

      // show DRF validation details if present
      const data = err?.response?.data;
      const detail =
        typeof data === 'string'
          ? data
          : data?.detail
            ? String(data.detail)
            : data && typeof data === 'object'
              ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' | ')
              : null;

      toast.error(detail || 'Failed to add equipment');
    }
  };

  /**
   * Updates existing equipment item with validation and image upload
   */
  const handleEditEquipment = async () => {
    if (!selectedEquipment) return;

    if (!equipmentName || !equipmentId || equipmentCategoryIds.length === 0) {
      toast.error('Please fill in all required fields (including at least one category)');
      return;
    }
    if (!validateInventory()) return;

    try {
      const fd = buildEquipmentFormData({
        name: equipmentName,
        equipment_id: equipmentId,
        quantity_total: equipmentTotal,
        quantity_under_maintenance: equipmentMaintenance,
        status: equipmentStatus,
        description: equipmentDescription,
        category_ids: equipmentCategoryIds,
        imageFile: equipmentImage,
      });

      const res = await api.patch(`${EQUIPMENT_BASE}${selectedEquipment.id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updated = mapEquipmentFromAPI(res.data);
      setEquipment(prev => prev.map(item => (item.id === selectedEquipment.id ? updated : item)));

      toast.success('Equipment updated successfully!');
      resetForm();
      setIsEditDialogOpen(false);
      setSelectedEquipment(null);
    } catch (err: any) {
      console.error(err);

      const data = err?.response?.data;
      const detail =
        typeof data === 'string'
          ? data
          : data?.detail
            ? String(data.detail)
            : data && typeof data === 'object'
              ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' | ')
              : null;

      toast.error(detail || 'Failed to update equipment');
    }
  };

  /**
   * Populates form with equipment data and opens edit dialog
   */
  const openEditDialog = (item: EquipmentUI) => {
    setSelectedEquipment(item);

    setEquipmentName(item.name);
    setEquipmentId(item.equipmentId);
    setEquipmentCategoryIds(item.category_ids || []);

    // ✅ Prefill from backend truth
    setEquipmentTotal(Number(item.quantity_total ?? 0));
    setEquipmentAvailable(Number(item.quantity_available ?? 0));
    setEquipmentMaintenance(Number(item.quantity_under_maintenance ?? 0));

    setEquipmentDescription(item.description);
    setEquipmentStatus(item.status);

    setEquipmentImage(null);
    setImagePreview(item.imageUrl || '');
    setIsEditDialogOpen(true);
  };

  /**
   * Updates equipment status (available, rented, maintenance)
   */
  const handleStatusChange = async (id: string, newStatus: EquipmentUI['status']) => {
    const item = equipment.find(e => e.id === id);
    if (!item) return;

    // If changing to maintenance or rented, show dialog to ask for quantity
    if (newStatus === 'maintenance' || newStatus === 'rented') {
      setStatusChangeTarget({ id, status: newStatus, item });
      setStatusChangeQuantity(1);
      setIsStatusDialogOpen(true);
      return;
    }

    // For 'available', directly update without quantity dialog (resets counter)
    await updateEquipmentStatus(id, newStatus, 0);
  };

  /**
   * Confirms and applies the status change with quantity
   */
  const confirmStatusChange = async () => {
    if (!statusChangeTarget) return;

    const { id, status } = statusChangeTarget;
    await updateEquipmentStatus(id, status, statusChangeQuantity);
    setIsStatusDialogOpen(false);
    setStatusChangeTarget(null);
  };

  /**
   * Sends status update request to backend
   */
  const updateEquipmentStatus = async (id: string, newStatus: EquipmentUI['status'], quantity: number) => {
    const prev = equipment;
    setEquipment(curr => curr.map(item => (item.id === id ? { ...item, status: newStatus } : item)));

    try {
      const res = await api.post(`${EQUIPMENT_BASE}${id}/update-status/`, { 
        status: newStatus,
        quantity: quantity 
      });
      
      const updated = mapEquipmentFromAPI(res.data.equipment);
      setEquipment(curr => curr.map(item => (item.id === id ? updated : item)));
      toast.success(res.data.message || 'Equipment status updated!');
    } catch (err: any) {
      console.error(err);
      setEquipment(prev);
      const errorMsg = err?.response?.data?.error || 'Failed to update status';
      toast.error(errorMsg);
    }
  };

  /**
   * Removes equipment item from inventory
   */
  const handleDeleteEquipment = async (id: string) => {
    const prev = equipment;
    setEquipment(curr => curr.filter(e => e.id !== id));

    try {
      await api.delete(`${EQUIPMENT_BASE}${id}/`);
      toast.success('Equipment deleted successfully!');
    } catch (err: any) {
      console.error(err);
      setEquipment(prev);
      toast.error('Failed to delete equipment');
    }
  };

  // ============================================================================
  // RENTAL MANAGEMENT - Approval, rejection, and request handling
  // ============================================================================
  
  /**
   * Approves a pending equipment rental request
   */
  const approveRental = async (id: number) => {
    setRentalActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      await api.post(`${RENTALS_BASE}${id}/approve/`);
      toast.success('Rental approved!');
      await fetchRentals();
      await fetchEquipment();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || 'Failed to approve rental');
    } finally {
      setRentalActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  /**
   * Rejects a rental request with admin-provided reason
   */
  const rejectRental = async (id: number, reason: string) => {
    setRentalActionLoading(prev => ({ ...prev, [id]: 'reject' }));
    try {
      await api.post(`${RENTALS_BASE}${id}/reject/`, { reject_reason: reason });
      toast.success('Rental rejected!');
      await fetchRentals();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || 'Failed to reject rental');
    } finally {
      setRentalActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  /**
   * Opens rejection dialog and prepares form for reason input
   */
  const openRejectDialog = (rentalId: number) => {
    setRejectTargetId(rentalId);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  /**
   * Validates and submits rental rejection with reason
   */
  const confirmReject = async () => {
    const id = rejectTargetId;
    const reason = rejectReason.trim();

    if (!id) return;

    if (!reason) {
      toast.error('Please write the reject reason');
      return;
    }

    await rejectRental(id, reason);
    setIsRejectDialogOpen(false);
    setRejectTargetId(null);
    setRejectReason('');
  };

  // ============================================================================
  // DATA EXPORT - CSV download functionality
  // ============================================================================
  
  /**
   * Exports all equipment inventory to CSV file
   */
  const exportInventoryCsv = async () => {
    setExportInventoryLoading(true);
    try {
      const res = await api.get(`${EQUIPMENT_BASE}export/`, { responseType: 'blob' });
      const cd = (res.headers?.['content-disposition'] || res.headers?.['Content-Disposition']) as string | undefined;
      const filename = filenameFromContentDisposition(cd) || 'equipment_inventory.csv';
      triggerBlobDownload(new Blob([res.data], { type: 'text/csv;charset=utf-8' }), filename);
      toast.success('Inventory exported!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to export inventory (check backend export endpoint)');
    } finally {
      setExportInventoryLoading(false);
    }
  };

  /**
   * Exports rental history for specific equipment to CSV file
   */
  const exportRentalsCsv = async (equipmentIdValue: string) => {
    if (!equipmentIdValue) {
      toast.error('Missing equipment ID');
      return;
    }
    setExportRentalsLoading(prev => ({ ...prev, [equipmentIdValue]: true }));
    try {
      const url = `${RENTALS_BASE}export/?equipment_id=${encodeURIComponent(equipmentIdValue)}`;
      const res = await api.get(url, { responseType: 'blob' });
      const cd = (res.headers?.['content-disposition'] || res.headers?.['Content-Disposition']) as string | undefined;
      const filename = filenameFromContentDisposition(cd) || `${equipmentIdValue}_rentals.csv`;
      triggerBlobDownload(new Blob([res.data], { type: 'text/csv;charset=utf-8' }), filename);
      toast.success('Rentals exported!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to export rentals (check backend export endpoint)');
    } finally {
      setExportRentalsLoading(prev => ({ ...prev, [equipmentIdValue]: false }));
    }
  };

  // ============================================================================
  // UI UTILITIES - Status colors and display formatting
  // ============================================================================
  
  /**
   * Returns Tailwind color classes based on equipment status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'rented':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'maintenance':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  /**
   * Returns Tailwind color classes based on rental request status
   */
  const getRentalStatusBadge = (status: string) => {
    const s = safeStatus(status);
    if (s === 'pending') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    if (s === 'approved' || s === 'active') return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
    if (s === 'returned') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    if (s === 'rejected') return 'bg-red-500/20 text-red-400 border-red-500/50';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  /**
   * Navigates to student profile page for detailed view
   */
  const handleOpenStudentProfile = (studentId?: string) => {
    if (!studentId) return;
    onNavigate?.('admin-profiles', { studentId });
  };

  /**
   * Filters and memoizes pending rental requests for performance
   */
  const pendingRentals = useMemo(() => rentals.filter(r => safeStatus(r.status) === 'pending'), [rentals]);
  /**
   * Filters and memoizes active/approved rental requests for performance
   */
  const activeRentals = useMemo(
    () =>
      rentals.filter(r => {
        const s = safeStatus(r.status);
        return s === 'approved' || s === 'active';
      }),
    [rentals]
  );

  /**
   * Toggles category selection in add/edit form
   */
  const toggleCategoryId = (id: number) => {
    setEquipmentCategoryIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  /**
   * Extracts and displays category names from equipment object
   */
  const displayCategoryNames = (item: EquipmentUI) => {
    if (item.categories?.length) return item.categories;
    if (item.category_ids?.length) {
      return item.category_ids
        .map((id) => categoryIdToName.get(id))
        .filter(Boolean) as string[];
    }
    return [];
  };

  /**
   * Calculates number of items currently rentable (available - maintenance)
   */
  const rentableNow = useMemo(() => Math.max(0, equipmentAvailable - equipmentMaintenance), [equipmentAvailable, equipmentMaintenance]);

  // ============================================================================
  // RENDER - Main component UI structure
  // ============================================================================
  return (
    <div className="p-6 space-y-6">
      {/* ====== RENTAL REJECTION DIALOG ====== */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className={`${dialogFitClass} max-w-xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Reject Request</DialogTitle>
            <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
              Write a short reason for rejection (this will be saved in the backend).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Reject reason *</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g. Equipment not available / Missing student ID / Not eligible..."
              className={`${theme === 'light'
                ? 'bg-gray-50 border-gray-200 text-gray-900'
                : 'bg-gray-800 border-gray-700 text-white'
                }`}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={rejectTargetId == null || rentalsLoading}
            >
              Confirm Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== STATUS CHANGE DIALOG ====== */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className={`${dialogFitClass} max-w-md ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
              Change Status to {statusChangeTarget?.status === 'maintenance' ? 'Maintenance' : 'Rented'}
            </DialogTitle>
            <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
              How many units do you want to mark as {statusChangeTarget?.status}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment</Label>
              <div className={`mt-2 p-3 rounded-lg border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                <div className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {statusChangeTarget?.item.name}
                </div>
                <div className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Total: {statusChangeTarget?.item.quantity_total || 0} units
                </div>
                <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Available: {statusChangeTarget?.item.quantity_available || 0} units
                </div>
              </div>
            </div>

            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Number of units *</Label>
              <Input
                type="number"
                min="1"
                max={statusChangeTarget?.item.quantity_available || 1}
                value={statusChangeQuantity}
                onChange={(e) => setStatusChangeQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, statusChangeTarget?.item.quantity_available || 1)))}
                className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
              />
              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                Enter how many units to mark as {statusChangeTarget?.status}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setStatusChangeTarget(null);
              }}
              className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== PAGE HEADER WITH ACTION BUTTONS ====== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Management</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Manage equipment inventory and availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportInventoryCsv}
            disabled={exportInventoryLoading || isLoading || rentalsLoading}
            className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportInventoryLoading ? 'Exporting...' : 'Export'}
          </Button>

          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={isLoading || rentalsLoading}
            className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
          >
            {(isLoading || rentalsLoading) ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            {/* Add Equipment Button & Dialog Trigger */}
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>

            <DialogContent className={`${dialogFitClass} ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
              <DialogHeader>
                <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Add New Equipment</DialogTitle>
                <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                  Add a new equipment item to the inventory
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Image</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-700">
                        <ImageWithFallback src={imagePreview} alt="Equipment preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center ${theme === 'light' ? 'border-gray-300' : 'border-gray-700'
                          }`}
                      >
                        <Upload className={`h-8 w-8 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className={theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}
                      />
                      <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Upload a clear image of the equipment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Name *</Label>
                    <Input
                      value={equipmentName}
                      onChange={(e) => setEquipmentName(e.target.value)}
                      placeholder="e.g., Sony A7S III"
                      className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                    />
                  </div>

                  <div>
                    <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment ID *</Label>
                    <Input
                      value={equipmentId}
                      onChange={(e) => setEquipmentId(e.target.value)}
                      placeholder="e.g., CAM-001"
                      className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                    />
                  </div>
                </div>

                {/* ✅ Inventory fields */}
                <div>
                  <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Inventory *</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Total</Label>
                      <Input
                        type="number"
                        min="0"
                        value={equipmentTotal}
                        onChange={(e) => setEquipmentTotal(Math.max(0, parseInt(e.target.value) || 0))}
                        className={`${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                      />
                    </div>
                    <div>
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Available</Label>
                      <Input
                        type="number"
                        min="0"
                        value={equipmentAvailable}
                        onChange={(e) => setEquipmentAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                        className={`${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                      />
                    </div>
                    <div>
                      <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Maintenance</Label>
                      <Input
                        type="number"
                        min="0"
                        value={equipmentMaintenance}
                        onChange={(e) => setEquipmentMaintenance(Math.max(0, parseInt(e.target.value) || 0))}
                        className={`${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                      />
                    </div>
                  </div>

                  <div className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    Rentable: <b>{rentableNow}</b> (Available - Maintenance)
                  </div>
                </div>

                <div>
                  <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</Label>
                  <Select value={equipmentStatus} onValueChange={(value: any) => setEquipmentStatus(value)}>
                    <SelectTrigger className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      Categories * (select at least one)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddCategoryDialogOpen(true)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      New Category
                    </Button>
                  </div>

                  <div className={`mt-2 p-4 rounded-lg border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                    {categories.length === 0 ? (
                      <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        No categories found. Click "New Category" to create one.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((cat) => (
                          <div key={cat.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`cat-add-${cat.id}`}
                              checked={equipmentCategoryIds.includes(cat.id)}
                              onChange={() => toggleCategoryId(cat.id)}
                              className="rounded"
                            />
                            <label htmlFor={`cat-add-${cat.id}`} className={`cursor-pointer ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                              {cat.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Description</Label>
                  <Textarea
                    value={equipmentDescription}
                    onChange={(e) => setEquipmentDescription(e.target.value)}
                    placeholder="Enter equipment description and specifications"
                    rows={4}
                    className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}
                  className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEquipment}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                >
                  Add Equipment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ====== RENTAL REQUESTS & USAGE TRACKING SECTION ====== */}
      <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Requests & Usage</CardTitle>
            <div className="flex items-center gap-2">
              <div className={`text-xs px-2 py-1 rounded border ${getRentalStatusBadge('pending')}`}>
                {rentalStats.pending} Pending
              </div>
              <div className={`text-xs px-2 py-1 rounded border ${getRentalStatusBadge('active')}`}>
                {rentalStats.active} Active
              </div>
            </div>
          </div>
          <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            See who requested and who is currently using equipment (approve/reject here)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* --- Pending Rental Requests Table --- */}
          <div className="space-y-3">
            <div className={`text-sm flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              <Clock className="h-4 w-4" />
              Pending Requests
            </div>

            <Table>
              <TableHeader>
                <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student</TableHead>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment</TableHead>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Period</TableHead>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pendingRentals.map((r) => {
                  const rowLoading = rentalActionLoading[r.id] !== null && rentalActionLoading[r.id] !== undefined;

                  return (
                    <TableRow key={r.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        <div className="space-y-1">
                          <Button
                            variant="link"
                            className="h-auto p-0 text-left justify-start"
                            onClick={() => handleOpenStudentProfile(r.student_id)}
                          >
                            {r.student_name || 'Student'}
                          </Button>
                          <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {r.student_id || '—'} {r.student_email ? `• ${r.student_email}` : ''}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        <div className="space-y-1">
                          <div>{r.equipment_name || (typeof r.equipment === 'object' ? r.equipment?.name : 'Equipment') || 'Equipment'}</div>
                          <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {r.equipment_id || (typeof r.equipment === 'object' ? r.equipment?.equipment_id : '') || ''}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                        {r.duration || (r.start_date && r.end_date ? `${r.start_date} → ${r.end_date}` : '—')}
                      </TableCell>

                      <TableCell>
                        <div className={`inline-flex text-xs px-2 py-1 rounded border ${getRentalStatusBadge(String(r.status || ''))}`}>
                          {String(r.status || 'pending')}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            disabled={rentalsLoading || rowLoading}
                            onClick={() => openRejectDialog(r.id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>

                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                            disabled={rentalsLoading || rowLoading}
                            onClick={() => approveRental(r.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!rentalsLoading && pendingRentals.length === 0 && (
                  <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableCell colSpan={5} className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                      No pending requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* --- Active/Approved Rentals Table --- */}
          <div className="space-y-3">
            <div className={`text-sm flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              <CheckCircle2 className="h-4 w-4" />
              Active / Approved (In Use)
            </div>

            <Table>
              <TableHeader>
                <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Student</TableHead>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment</TableHead>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Period</TableHead>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Reviewed</TableHead>
                  <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {activeRentals.map((r) => (
                  <TableRow key={r.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      <div className="space-y-1">
                        <Button
                          variant="link"
                          className="h-auto p-0 text-left justify-start"
                          onClick={() => handleOpenStudentProfile(r.student_id)}
                        >
                          {r.student_name || 'Student'}
                        </Button>
                        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {r.student_id || '—'} {r.student_email ? `• ${r.student_email}` : ''}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      <div className="space-y-1">
                        <div>{r.equipment_name || (typeof r.equipment === 'object' ? r.equipment?.name : 'Equipment') || 'Equipment'}</div>
                        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {r.equipment_id || (typeof r.equipment === 'object' ? r.equipment?.equipment_id : '') || ''}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      {r.duration || (r.start_date && r.end_date ? `${r.start_date} → ${r.end_date}` : '—')}
                    </TableCell>

                    <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      <div className="space-y-1">
                        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {r.reviewed_by_name || '—'}
                        </div>
                        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {safeTime(r.reviewed_at)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className={`inline-flex text-xs px-2 py-1 rounded border ${getRentalStatusBadge(String(r.status || ''))}`}>
                        {String(r.status || '')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!rentalsLoading && activeRentals.length === 0 && (
                  <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableCell colSpan={5} className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                      No active rentals right now.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ====== EQUIPMENT INVENTORY TABLE ====== */}
      <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
        <CardHeader>
          <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>All Equipment</CardTitle>
          <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Manage equipment items and their availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>ID</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Categories</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Qty (Avail)</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((item) => {
                const exportBusy = !!exportRentalsLoading[item.equipmentId];
                const catNames = displayCategoryNames(item);

                return (
                  <TableRow key={item.id} className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-700">
                          <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{item.name}</p>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{item.description}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      {item.equipmentId}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {catNames.map((cat) => (
                          <span
                            key={cat}
                            className={`text-xs px-2 py-1 rounded ${theme === 'light' ? 'bg-teal-100 text-teal-700' : 'bg-teal-500/20 text-teal-300'}`}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                      {item.quantity_available}
                    </TableCell>

                    <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(value: EquipmentUI['status']) => handleStatusChange(item.id, value)}
                      >
                        <SelectTrigger className={`w-[140px] border-0 ${getStatusColor(item.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Export rentals for this equipment"
                          className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}
                          disabled={exportBusy || rentalsLoading || isLoading}
                          onClick={() => exportRentalsCsv(item.equipmentId)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteEquipment(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!isLoading && equipment.length === 0 && (
                <TableRow className={theme === 'light' ? 'border-gray-200' : 'border-gray-800'}>
                  <TableCell colSpan={6} className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    No equipment found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ====== EDIT EQUIPMENT DIALOG ====== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={`${dialogFitClass} ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
          <DialogHeader>
            <DialogTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Edit Equipment</DialogTitle>
            <DialogDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
              Update equipment information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Image</Label>
              <div className="mt-2 flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-700">
                    <ImageWithFallback src={imagePreview} alt="Equipment preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center ${theme === 'light' ? 'border-gray-300' : 'border-gray-700'}`}>
                    <Upload className={`h-8 w-8 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}
                  />
                  <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Upload a clear image of the equipment</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Name *</Label>
                <Input
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  placeholder="e.g., Sony A7S III"
                  className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                />
              </div>

              <div>
                <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment ID *</Label>
                <Input
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  placeholder="e.g., CAM-001"
                  className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                />
              </div>
            </div>

            {/* ✅ Inventory fields */}
            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Inventory *</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Total</Label>
                  <Input
                    type="number"
                    min="0"
                    value={equipmentTotal}
                    onChange={(e) => setEquipmentTotal(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                  />
                </div>
                <div>
                  <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Available</Label>
                  <Input
                    type="number"
                    min="0"
                    value={equipmentAvailable}
                    onChange={(e) => setEquipmentAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                  />
                </div>
                <div>
                  <Label className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Maintenance</Label>
                  <Input
                    type="number"
                    min="0"
                    value={equipmentMaintenance}
                    onChange={(e) => setEquipmentMaintenance(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
                  />
                </div>
              </div>

              <div className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                Rentable: <b>{rentableNow}</b> (Available - Maintenance)
              </div>
            </div>

            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</Label>
              <Select value={equipmentStatus} onValueChange={(value: any) => setEquipmentStatus(value)}>
                <SelectTrigger className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Categories * (select at least one)</Label>
              <div className={`mt-2 p-4 rounded-lg border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                {categories.length === 0 ? (
                  <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    No categories found. Make sure backend router has <b>equipment-categories</b>.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cat-edit-${cat.id}`}
                          checked={equipmentCategoryIds.includes(cat.id)}
                          onChange={() => toggleCategoryId(cat.id)}
                          className="rounded"
                        />
                        <label htmlFor={`cat-edit-${cat.id}`} className={`cursor-pointer ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {cat.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Description</Label>
              <Textarea
                value={equipmentDescription}
                onChange={(e) => setEquipmentDescription(e.target.value)}
                placeholder="Enter equipment description and specifications"
                rows={4}
                className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
                setSelectedEquipment(null);
              }}
              className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditEquipment}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              Update Equipment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD CATEGORY DIALOG */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className={theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new equipment category that can be assigned to equipment items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Cameras, Microphones, Lighting"
                className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  placeholder="#3b82f6"
                  className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={isLoading}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              {isLoading ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
