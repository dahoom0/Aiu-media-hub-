import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
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
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Mock data
  const [equipment, setEquipment] = useState<Equipment[]>([
    {
      id: '1',
      name: 'Sony A7S III',
      equipmentId: 'CAM-001',
      category: 'Camera',
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1606980183050-a57aa62d2d08?w=200&h=200&fit=crop',
      description: 'Professional mirrorless camera for video production'
    },
    {
      id: '2',
      name: 'Canon EOS R5',
      equipmentId: 'CAM-002',
      category: 'Camera',
      status: 'rented',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=200&h=200&fit=crop',
      description: 'High-resolution camera with 8K video capabilities'
    },
    {
      id: '3',
      name: 'Rode NTG4+ Microphone',
      equipmentId: 'AUD-001',
      category: 'Audio',
      status: 'available',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&h=200&fit=crop',
      description: 'Professional shotgun microphone'
    },
    {
      id: '4',
      name: 'LED Light Panel',
      equipmentId: 'LGT-001',
      category: 'Lighting',
      status: 'maintenance',
      imageUrl: 'https://images.unsplash.com/photo-1535350356005-fd52b3b524fb?w=200&h=200&fit=crop',
      description: 'Adjustable LED light panel for studio lighting'
    }
  ]);

  const categories = ['Camera', 'Audio', 'Lighting', 'Accessories', 'Grip'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEquipmentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEquipment = () => {
    if (!equipmentName || !equipmentId || !equipmentCategory) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Equipment added successfully!');
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditEquipment = () => {
    if (!equipmentName || !equipmentId || !equipmentCategory) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Equipment updated successfully!');
    resetForm();
    setIsEditDialogOpen(false);
    setSelectedEquipment(null);
  };

  const openEditDialog = (item: Equipment) => {
    setSelectedEquipment(item);
    setEquipmentName(item.name);
    setEquipmentId(item.equipmentId);
    setEquipmentCategory(item.category);
    setEquipmentDescription(item.description);
    setEquipmentStatus(item.status);
    setImagePreview(item.imageUrl);
    setIsEditDialogOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: 'available' | 'rented' | 'maintenance') => {
    setEquipment(prev =>
      prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
    );
    toast.success('Equipment status updated!');
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
                      <ImageWithFallback
                        src={imagePreview}
                        alt="Equipment preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center ${
                      theme === 'light' ? 'border-gray-300' : 'border-gray-700'
                    }`}>
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
                    className={`mt-2 ${
                      theme === 'light'
                        ? 'bg-gray-50 border-gray-200 text-gray-900'
                        : 'bg-gray-800 border-gray-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment ID *</Label>
                  <Input
                    value={equipmentId}
                    onChange={(e) => setEquipmentId(e.target.value)}
                    placeholder="e.g., CAM-001"
                    className={`mt-2 ${
                      theme === 'light'
                        ? 'bg-gray-50 border-gray-200 text-gray-900'
                        : 'bg-gray-800 border-gray-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Category *</Label>
                  <Select value={equipmentCategory} onValueChange={setEquipmentCategory}>
                    <SelectTrigger className={`mt-2 ${
                      theme === 'light'
                        ? 'bg-gray-50 border-gray-200 text-gray-900'
                        : 'bg-gray-800 border-gray-700 text-white'
                    }`}>
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
                  <Select value={equipmentStatus} onValueChange={(value: 'available' | 'rented' | 'maintenance') => setEquipmentStatus(value)}>
                    <SelectTrigger className={`mt-2 ${
                      theme === 'light'
                        ? 'bg-gray-50 border-gray-200 text-gray-900'
                        : 'bg-gray-800 border-gray-700 text-white'
                    }`}>
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
                  className={`mt-2 ${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200 text-gray-900'
                      : 'bg-gray-800 border-gray-700 text-white'
                  }`}
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

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className={theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Available</p>
                <p className={`text-2xl mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {equipment.filter(e => e.status === 'available').length}
                </p>
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
                <p className={`text-2xl mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {equipment.filter(e => e.status === 'rented').length}
                </p>
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
                <p className={`text-2xl mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {equipment.filter(e => e.status === 'maintenance').length}
                </p>
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
                        <ImageWithFallback
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
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
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
            {/* Image Upload */}
            <div>
              <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment Image</Label>
              <div className="mt-2 flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-700">
                    <ImageWithFallback
                      src={imagePreview}
                      alt="Equipment preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center ${
                    theme === 'light' ? 'border-gray-300' : 'border-gray-700'
                  }`}>
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
                  className={`mt-2 ${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200 text-gray-900'
                      : 'bg-gray-800 border-gray-700 text-white'
                  }`}
                />
              </div>

              <div>
                <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Equipment ID *</Label>
                <Input
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  placeholder="e.g., CAM-001"
                  className={`mt-2 ${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200 text-gray-900'
                      : 'bg-gray-800 border-gray-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={theme === 'light' ? 'text-gray-900' : 'text-white'}>Category *</Label>
                <Select value={equipmentCategory} onValueChange={setEquipmentCategory}>
                  <SelectTrigger className={`mt-2 ${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200 text-gray-900'
                      : 'bg-gray-800 border-gray-700 text-white'
                  }`}>
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
                <Select value={equipmentStatus} onValueChange={(value: 'available' | 'rented' | 'maintenance') => setEquipmentStatus(value)}>
                  <SelectTrigger className={`mt-2 ${
                    theme === 'light'
                      ? 'bg-gray-50 border-gray-200 text-gray-900'
                      : 'bg-gray-800 border-gray-700 text-white'
                  }`}>
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
                className={`mt-2 ${
                  theme === 'light'
                    ? 'bg-gray-50 border-gray-200 text-gray-900'
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
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
