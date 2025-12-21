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
import { Plus, Edit, Trash2, Package, Camera, Mic, Lightbulb, Upload } from 'lucide-react';
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

  // Django admin shows: "equipment_images/xxx.png"
  if (!url.startsWith('/')) return `${API_ORIGIN}/media/${url}`;

  return `${API_ORIGIN}${url}`;
};

















// ✅ IMPORTANT: this matches your real file name in /services
import equipmentService from '../services/equipmentAdmin.js';

interface Equipment {
  id: string;
  name: string;
  equipmentId: string;
  category: string;
  status: 'available' | 'rented' | 'maintenance';
  imageUrl: string;
  description: string;
}

export function AdminEquipmentManagement() {
  const { theme } = useTheme();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

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

  const categories = ['Camera', 'Audio', 'Lighting', 'Accessories', 'Grip'];

  const stats = useMemo(() => {
    return {
      available: equipment.filter(e => e.status === 'available').length,
      rented: equipment.filter(e => e.status === 'rented').length,
      maintenance: equipment.filter(e => e.status === 'maintenance').length,
    };
  }, [equipment]);

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

  useEffect(() => {
    fetchEquipment();
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
        imageFile: equipmentImage, // only if user selected
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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
            onClick={fetchEquipment}
            disabled={isLoading}
            className={theme === 'light' ? 'border-gray-200' : 'border-gray-700'}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
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
                {/* Image Upload */}
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

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Available</p>
                <p className={`text-2xl mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{stats.available}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500/20">
                <Package className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Rented</p>
                <p className={`text-2xl mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{stats.rented}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/20">
                <Package className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Maintenance</p>
                <p className={`text-2xl mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{stats.maintenance}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/20">
                <Package className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {equipment.map((item) => (
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className={theme === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'}
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteEquipment(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

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
                  <Input type="file" accept="image/*" onChange={handleImageUpload} className={theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'} />
                  <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Upload a clear image of the equipment</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Name *</Label>
                <Input value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} placeholder="e.g., Sony A7S III" className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`} />
              </div>

              <div>
                <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment ID *</Label>
                <Input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} placeholder="e.g., CAM-001" className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`} />
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
              <Textarea value={equipmentDescription} onChange={(e) => setEquipmentDescription(e.target.value)} placeholder="Enter equipment description and specifications" rows={4} className={`mt-2 ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`} />
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
            <Button onClick={handleEditEquipment} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
              Update Equipment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
