import { useEffect, useMemo, useState } from 'react';
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
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Camera,
  Mic,
  Lightbulb,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

const API_ORIGIN = 'http://localhost:8000';

const buildMediaUrl = (val: any) => {
  if (!val) return '';

  if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
    return val;
  }

  if (typeof val === 'object' && val?.url) {
    const u = val.url;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('/')) return `${API_ORIGIN}${u}`;
    return `${API_ORIGIN}/${u}`;
  }

  const url = String(val);

  if (url.startsWith('/media/')) return `${API_ORIGIN}${url}`;
  if (url.startsWith('media/')) return `${API_ORIGIN}/${url}`;

  if (!url.startsWith('/')) return `${API_ORIGIN}/media/${url}`;

  return `${API_ORIGIN}${url}`;
};

// ✅ IMPORTANT: this matches your real file name in /services
import equipmentService from '../services/equipmentAdmin.js';

// ✅ Use your existing axios client (same one used everywhere with JWT)
import api from '../services/apiClient';

interface Equipment {
  id: string;
  name: string;
  equipmentId: string;
  category: string;
  status: 'available' | 'rented' | 'maintenance';
  imageUrl: string;
  description: string;
}

type StatusString =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'returned'
  | 'cancelled'
  | 'completed'
  | string;

type EquipmentRentalRow = {
  id: number;
  status?: StatusString;

  start_date?: string;
  end_date?: string;
  duration?: string;

  equipment?: number;
  equipment_name?: string;
  equipment_id?: string;

  student_name?: string;
  student_id?: string;
  student_email?: string;

  reviewed_by_name?: string;
  reviewed_at?: string;

  // backend may return these, not required for UI
  notes?: string;
  reject_reason?: string;

  created_at?: string;
  updated_at?: string;
};

function normalizeList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function safeStatus(x: any) {
  return String(x || '').toLowerCase();
}

function safeTime(t?: string) {
  if (!t) return '—';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function filenameFromContentDisposition(cd?: string) {
  if (!cd) return '';
  // examples:
  // attachment; filename="file.csv"
  // attachment; filename=file.csv
  const m = /filename\*?=(?:UTF-8'')?("?)([^";]+)\1/i.exec(cd);
  if (!m) return '';
  try {
    return decodeURIComponent(m[2]);
  } catch {
    return m[2];
  }
}

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

export function AdminEquipmentManagement({
  onNavigate,
}: {
  onNavigate?: (page: string, params?: any) => void;
}) {
  const { theme } = useTheme();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // ✅ Reject dialog state (NEW)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ✅ Export states (NEW)
  const [exportInventoryLoading, setExportInventoryLoading] = useState(false);
  const [exportRentalsLoading, setExportRentalsLoading] = useState<Record<string, boolean>>({});

  // Form state
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [equipmentStatus, setEquipmentStatus] = useState<'available' | 'rented' | 'maintenance'>('available');
  const [equipmentImage, setEquipmentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  // Backend data
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Rentals data
  const [rentals, setRentals] = useState<EquipmentRentalRow[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [rentalActionLoading, setRentalActionLoading] = useState<Record<number, 'approve' | 'reject' | null>>({});

  const categories = ['Camera', 'Audio', 'Lighting', 'Accessories', 'Grip'];

  const stats = useMemo(() => {
    return {
      available: equipment.filter(e => e.status === 'available').length,
      rented: equipment.filter(e => e.status === 'rented').length,
      maintenance: equipment.filter(e => e.status === 'maintenance').length,
    };
  }, [equipment]);

  const rentalStats = useMemo(() => {
    const pending = rentals.filter(r => safeStatus(r.status) === 'pending').length;
    const active = rentals.filter(r => safeStatus(r.status) === 'active' || safeStatus(r.status) === 'approved').length;
    const returned = rentals.filter(r => safeStatus(r.status) === 'returned').length;
    return { pending, active, returned };
  }, [rentals]);

  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const items = await equipmentService.list();
      setEquipment(items as Equipment[]);
    } catch (err: any) {
      toast.error('Failed to load equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const RENTALS_BASE = '/equipment-rentals/';
  const EQUIPMENT_BASE = '/equipment/';

  const fetchRentals = async () => {
    setRentalsLoading(true);
    try {
      const res = await api.get(RENTALS_BASE);
      setRentals(normalizeList(res.data) as EquipmentRentalRow[]);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load equipment rental requests');
      setRentals([]);
    } finally {
      setRentalsLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchEquipment(), fetchRentals()]);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEquipmentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEquipmentName('');
    setEquipmentId('');
    setEquipmentCategory('');
    setEquipmentDescription('');
    setEquipmentStatus('available');
    setEquipmentImage(null);
    setImagePreview('');
  };

  const handleAddEquipment = async () => {
    if (!equipmentName || !equipmentId || !equipmentCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const created = await equipmentService.create({
        name: equipmentName,
        equipmentId,
        category: equipmentCategory,
        status: equipmentStatus,
        description: equipmentDescription,
        imageFile: equipmentImage,
      });

      setEquipment(prev => [created as Equipment, ...prev]);
      toast.success('Equipment added successfully!');
      resetForm();
      setIsAddDialogOpen(false);
    } catch (err: any) {
      toast.error('Failed to add equipment');
    }
  };

  const handleEditEquipment = async () => {
    if (!selectedEquipment) return;

    if (!equipmentName || !equipmentId || !equipmentCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const updated = await equipmentService.update(selectedEquipment.id, {
        name: equipmentName,
        equipmentId,
        category: equipmentCategory,
        status: equipmentStatus,
        description: equipmentDescription,
        imageFile: equipmentImage,
      });

      setEquipment(prev =>
        prev.map(item => (item.id === selectedEquipment.id ? (updated as Equipment) : item))
      );

      toast.success('Equipment updated successfully!');
      resetForm();
      setIsEditDialogOpen(false);
      setSelectedEquipment(null);
    } catch (err: any) {
      toast.error('Failed to update equipment');
    }
  };

  const openEditDialog = (item: Equipment) => {
    setSelectedEquipment(item);
    setEquipmentName(item.name);
    setEquipmentId(item.equipmentId);
    setEquipmentCategory(item.category);
    setEquipmentDescription(item.description);
    setEquipmentStatus(item.status);
    setEquipmentImage(null);
    setImagePreview(item.imageUrl);
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = async (id: string, newStatus: 'available' | 'rented' | 'maintenance') => {
    const prev = equipment;
    setEquipment(curr => curr.map(item => (item.id === id ? { ...item, status: newStatus } : item)));

    try {
      const updated = await equipmentService.updateStatus(id, newStatus);
      setEquipment(curr => curr.map(item => (item.id === id ? (updated as Equipment) : item)));
      toast.success('Equipment status updated!');
    } catch (err: any) {
      setEquipment(prev);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    const prev = equipment;
    setEquipment(curr => curr.filter(e => e.id !== id));

    try {
      await equipmentService.remove(id);
      toast.success('Equipment deleted successfully!');
    } catch (err: any) {
      setEquipment(prev);
      toast.error('Failed to delete equipment');
    }
  };

  const approveRental = async (id: number) => {
    setRentalActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      await api.post(`${RENTALS_BASE}${id}/approve/`);
      toast.success('Rental approved!');
      await fetchRentals();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || 'Failed to approve rental');
    } finally {
      setRentalActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  // ✅ UPDATED: reject now sends reject_reason
  const rejectRental = async (id: number, reason: string) => {
    setRentalActionLoading(prev => ({ ...prev, [id]: 'reject' }));
    try {
      await api.post(`${RENTALS_BASE}${id}/reject/`, {
        reject_reason: reason,
      });
      toast.success('Rental rejected!');
      await fetchRentals();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || 'Failed to reject rental');
    } finally {
      setRentalActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const openRejectDialog = (rentalId: number) => {
    setRejectTargetId(rentalId);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

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

  // ✅ NEW: Export inventory (ALL equipment recorded in system)
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
      toast.error('Failed to export inventory');
    } finally {
      setExportInventoryLoading(false);
    }
  };

  // ✅ NEW: Export rentals for ONE equipment_id
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
      toast.error('Failed to export rentals');
    } finally {
      setExportRentalsLoading(prev => ({ ...prev, [equipmentIdValue]: false }));
    }
  };

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

  const getRentalStatusBadge = (status: string) => {
    const s = safeStatus(status);
    if (s === 'pending') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    if (s === 'approved' || s === 'active') return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
    if (s === 'returned') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
    if (s === 'rejected') return 'bg-red-500/20 text-red-400 border-red-500/50';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'camera':
        return <Camera className="h-4 w-4" />;
      case 'audio':
        return <Mic className="h-4 w-4" />;
      case 'lighting':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const pendingRentals = useMemo(() => rentals.filter(r => safeStatus(r.status) === 'pending'), [rentals]);
  const activeRentals = useMemo(
    () =>
      rentals.filter(r => {
        const s = safeStatus(r.status);
        return s === 'approved' || s === 'active';
      }),
    [rentals]
  );

  const handleOpenStudentProfile = (studentId?: string) => {
    if (!studentId) return;
    onNavigate?.('admin-profiles', { studentId });
  };

  return (
    <div className="p-6 space-y-6">
      {/* ✅ Reject Reason Dialog (NEW) */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className={`max-w-xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
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
              placeholder="e.g., Equipment is not available for these dates / Missing student ID / Not eligible..."
              className={`${
                theme === 'light'
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Management</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            Manage equipment inventory and availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* ✅ NEW BUTTON: Export Inventory */}
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
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>

            <DialogContent className={`max-w-2xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
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
                        className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center ${
                          theme === 'light' ? 'border-gray-300' : 'border-gray-700'
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Category *</Label>
                    <Select value={equipmentCategory} onValueChange={setEquipmentCategory}>
                      <SelectTrigger className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

      {/* ✅ Requests & Usage */}
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
          {/* Pending */}
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
                          <div>{r.equipment_name || 'Equipment'}</div>
                          <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                            {r.equipment_id || ''}
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

          {/* Active */}
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
                        <div>{r.equipment_name || 'Equipment'}</div>
                        <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {r.equipment_id || ''}
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

      {/* Equipment Table */}
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
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Category</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Status</TableHead>
                <TableHead className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((item) => {
                const exportBusy = !!exportRentalsLoading[item.equipmentId];
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
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(item.category)}
                        <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{item.category}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(value: 'available' | 'rented' | 'maintenance') => handleStatusChange(item.id, value)}
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
                        {/* ✅ NEW BUTTON: Export Rentals for this Equipment ID */}
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
                  <TableCell colSpan={5} className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    No equipment found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={`max-w-2xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900 border-gray-800'}`}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Category *</Label>
                <Select value={equipmentCategory} onValueChange={setEquipmentCategory}>
                  <SelectTrigger className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  );
}
