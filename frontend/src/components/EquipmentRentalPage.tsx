import { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  QrCode,
  Package,
  Camera,
  Mic,
  Lightbulb,
  Film,
  CheckCircle2,
  Loader2,
  CheckSquare,
  Calendar,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { QRScanner } from './QRScanner';
import { useTheme } from './ThemeProvider';
import equipmentService from '../services/equipmentService';

interface EquipmentRentalPageProps {
  onNavigate?: (page: string) => void;
}

export function EquipmentRentalPage({ onNavigate }: EquipmentRentalPageProps) {
  const { theme } = useTheme();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // --- FORM STATE ---
  const [rentalDuration, setRentalDuration] = useState('1');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [customAccessory, setCustomAccessory] = useState('');

  // --- REAL DATA STATE ---
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [accessoryList, setAccessoryList] = useState<any[]>([]);
  const [myRentals, setMyRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const asArray = (maybe: any) => {
    if (!maybe) return [];
    if (Array.isArray(maybe)) return maybe;
    if (Array.isArray(maybe.results)) return maybe.results;
    return [];
  };

  const safeLower = (v: any) => String(v ?? '').toLowerCase().trim();
  const toTitleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  // ---- My Bookings status helpers (same behavior as Lab Booking) ----
  const getStatusIcon = (status: string) => {
    const s = safeLower(status);

    switch (s) {
      case 'approved':
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
      case 'cancelled':
      case 'canceled':
        return <XCircle className="h-4 w-4" />;
      case 'returned':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getRentalStatusColor = (status: string) => {
    const s = safeLower(status);

    switch (s) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'approved':
      case 'active':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'rejected':
      case 'cancelled':
      case 'canceled':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'returned':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Sort key: prefer rental_date/created_at; fallback to id (newer id = newer)
  const getRentalSortKey = (r: any) => {
    const raw =
      r?.rental_date ||
      r?.created_at ||
      r?.pickup_date ||
      r?.start_date ||
      null;

    const ms = raw ? new Date(raw).getTime() : 0;
    const id = typeof r?.id === 'number' ? r.id : 0;

    // combine so date dominates; if date missing, id still gives correct order
    return (Number.isFinite(ms) ? ms : 0) * 1000 + id;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allEquipmentRes, rentalsRes] = await Promise.all([
        equipmentService.getAll(),
        equipmentService.getRentals(),
      ]);

      const rawEquipment = asArray(allEquipmentRes);
      const rawRentals = asArray(rentalsRes);

      // Accessories list
      const accessoriesFromDB = rawEquipment.filter((item: any) => {
        const cat = item?.category;
        const catStr =
          typeof cat === 'string'
            ? cat.toLowerCase()
            : typeof cat?.name === 'string'
              ? cat.name.toLowerCase()
              : '';
        return catStr.includes('access');
      });
      setAccessoryList(accessoriesFromDB);

      // Map equipment cards
      const mappedEquipment = rawEquipment.map((item: any) => {
        const cat = item?.category;
        const categoryString =
          typeof cat === 'string'
            ? cat.toLowerCase()
            : typeof cat?.name === 'string'
              ? cat.name.toLowerCase()
              : 'cameras';

        return {
          id: item.id,
          name: item.name,
          category: categoryString,
          status: item.status,
          qrCode: item.equipment_id,
          specs: item.description || 'Professional equipment',
          image: item.image,
          quantity_available: item.quantity_available,
        };
      });

      // Lookup for joining if rental.equipment is FK id
      const equipmentById = new Map<number, any>();
      rawEquipment.forEach((eq: any) => {
        if (typeof eq?.id === 'number') equipmentById.set(eq.id, eq);
      });

      // ✅ Latest 5 rentals INCLUDING pending/approved/etc
      const recent5 = [...rawRentals]
        .sort((a: any, b: any) => getRentalSortKey(b) - getRentalSortKey(a))
        .slice(0, 5)
        .map((rental: any) => {
          const equipmentField = rental?.equipment;

          const equipmentId =
            typeof equipmentField === 'number'
              ? equipmentField
              : typeof equipmentField?.id === 'number'
                ? equipmentField.id
                : null;

          const eqFromRental = typeof equipmentField === 'object' ? equipmentField : null;
          const eqFromCatalog = equipmentId ? equipmentById.get(equipmentId) : null;

          const name =
            eqFromRental?.name ||
            eqFromCatalog?.name ||
            rental?.equipment_name ||
            rental?.equipment_title ||
            'Equipment';

          // serializer gives equipment_id (string) read-only, but we also fallback
          const qrCode =
            rental?.equipment_id ||
            eqFromRental?.equipment_id ||
            eqFromCatalog?.equipment_id ||
            rental?.equipment_code ||
            'N/A';

          const requestedAtRaw = rental?.rental_date || rental?.created_at || rental?.pickup_date || null;
          const dueDateRaw = rental?.expected_return_date || rental?.due_date || rental?.end_date || null;

          const requestedAt = requestedAtRaw ? new Date(requestedAtRaw).toLocaleDateString() : 'N/A';
          const dueDate = dueDateRaw ? new Date(dueDateRaw).toLocaleDateString() : 'N/A';

          return {
            id: rental.id,
            name,
            qrCode,
            requestedAt,
            dueDate,
            status: rental.status, // IMPORTANT: keep backend value ("Pending"/"Returned"/etc)
          };
        });

      setEquipmentList(mappedEquipment);
      setMyRentals(recent5);
    } catch (error) {
      console.error('Failed to fetch equipment', error);
    } finally {
      setLoading(false);
    }
  };

  const openRentalModal = (item: any) => {
    setSelectedEquipment(item);
    setPickupDate(new Date().toISOString().split('T')[0]);
    setRentalDuration('1');
    setCustomAccessory('');
    setSelectedAccessories([]);
    setShowRentalModal(true);
  };

  const getReturnDate = () => {
    if (!pickupDate) return 'Select date';
    const date = new Date(pickupDate);
    date.setDate(date.getDate() + parseInt(rentalDuration || '1'));
    return date.toLocaleDateString();
  };

  const toggleAccessory = (accName: string) => {
    if (selectedAccessories.includes(accName)) {
      setSelectedAccessories(selectedAccessories.filter(a => a !== accName));
    } else {
      setSelectedAccessories([...selectedAccessories, accName]);
    }
  };

  const categories = [
    { id: 'all', label: 'All Equipment', icon: Package },
    { id: 'camera', label: 'Cameras', icon: Camera },
    { id: 'audio', label: 'Audio', icon: Mic },
    { id: 'lighting', label: 'Lighting', icon: Lightbulb },
    { id: 'accessories', label: 'Accessories', icon: Film },
  ];

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (item.category && item.category.includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
      case 'rented': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'maintenance': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const handleRental = async () => {
    if (!selectedEquipment) return;
    setSubmitting(true);

    const itemsList = selectedAccessories.join(', ');
    const fullNotes = `Additional Items: ${itemsList}. ${customAccessory ? 'Note: ' + customAccessory : ''}`;

    try {
      await equipmentService.checkout(
        selectedEquipment.qrCode,
        'Main Desk',
        pickupDate,
        rentalDuration,
        fullNotes
      );
      alert(`Successfully rented ${selectedEquipment.name}`);
      setShowRentalModal(false);
      setSelectedEquipment(null);
      fetchData();
    } catch (error: any) {
      alert('Rental Failed: ' + (error?.response?.data?.error || 'Item unavailable'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (rentalId: number) => {
    if (!confirm('Return this item?')) return;
    try {
      await equipmentService.returnItem(rentalId);
      alert('Item returned!');
      fetchData();
    } catch (error) {
      console.error('Return failed', error);
    }
  };

  // Cancel only when pending (like Lab Booking)
  const handleCancel = async (rentalId: number) => {
    if (!confirm('Cancel this request?')) return;
    try {
      // If you don’t have this backend action yet, it will fail and you’ll see it in console.
      await equipmentService.cancelRental(rentalId);
      alert('Request cancelled.');
      fetchData();
    } catch (error: any) {
      console.error('Cancel failed', error);
      alert('Cancel failed (backend cancel endpoint may not be implemented).');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'}`}>
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={theme === 'light' ? 'text-gray-900 mb-2' : 'text-white mb-2'}>Equipment Rental</h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
          Browse and rent professional media equipment with QR-based tracking
        </p>
      </div>

      {/* Search and QR Scanner */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${
              theme === 'light'
                ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-teal-500'
                : 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500'
            }`}
          />
        </div>
        <Button
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
          onClick={() => setShowQRScanner(true)}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Scan QR
        </Button>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className={`border ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-900/50 border-gray-800'
        }`}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-[rgba(0,0,0,0)]">
            {filteredEquipment.length === 0 ? (
              <p className="text-gray-500 col-span-4 text-center py-8">No equipment found.</p>
            ) : (
              filteredEquipment.map((item) => (
                <Card
                  key={item.id}
                  className={`hover:border-teal-500/50 transition-all group ${
                    theme === 'light'
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-900/50 border-gray-800'
                  }`}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-800">
                      {item.image ? (
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Camera className="h-12 w-12" />
                        </div>
                      )}
                      <Badge className={`absolute top-3 right-3 ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                      <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-500/30">
                        <QrCode className="h-5 w-5 text-teal-400" />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className={theme === 'light' ? 'text-gray-900 mb-1' : 'text-white mb-1'}>{item.name}</h4>
                        <p className={`text-xs mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>ID: {item.qrCode}</p>
                        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} line-clamp-2`}>{item.specs}</p>
                      </div>

                      <Button
                        className={`w-full disabled:opacity-50 ${
                          theme === 'light'
                            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                        disabled={item.status !== 'available'}
                        onClick={() => openRentalModal(item)}
                      >
                        {item.status === 'available' ? (
                          <>
                            <Package className="h-4 w-4 mr-2" />
                            Rent Equipment
                          </>
                        ) : item.status === 'rented' ? 'Currently Rented' : 'Under Maintenance'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ✅ My Bookings (KEEP SAME STRUCTURE like Lab Booking card rows) */}
      <Card className={`${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-gray-900/50 border-gray-800'
      }`}>
        <CardHeader>
          <CardTitle className={theme === 'light' ? 'text-gray-900' : 'text-white'}>My Bookings</CardTitle>
          <CardDescription className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            View and manage your equipment rental requests (latest 5)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myRentals.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-8">No bookings found.</div>
            ) : (
              myRentals.map((rental) => {
                const statusLower = safeLower(rental.status);
                const canReturn = statusLower === 'approved' || statusLower === 'active';
                const canCancel = statusLower === 'pending';

                return (
                  <div
                    key={rental.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700 gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                          {rental.name}
                        </h4>

                        <Badge className={getRentalStatusColor(rental.status)}>
                          {getStatusIcon(rental.status)}
                          <span className="ml-1 capitalize">{statusLower || 'unknown'}</span>
                        </Badge>
                      </div>

                      <div className={`flex flex-wrap items-center gap-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <div className="flex items-center gap-1">
                          <QrCode className="h-4 w-4" />
                          <span>ID: {rental.qrCode}</span>
                        </div>

                        <span>•</span>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{rental.requestedAt}</span>
                        </div>

                        <span>•</span>

                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Due: {rental.dueDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleCancel(rental.id)}
                        >
                          Cancel
                        </Button>
                      )}

                      <Button
                        size="sm"
                        className={`${
                          canReturn
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white'
                            : theme === 'light'
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-gray-800 text-gray-400'
                        }`}
                        onClick={() => handleReturn(rental.id)}
                        disabled={!canReturn}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Return
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rental Modal */}
      <Dialog open={showRentalModal} onOpenChange={setShowRentalModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Rent Equipment</DialogTitle>
            <DialogDescription className="text-gray-400">
              Submit a rental request for admin approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20">
                  <QrCode className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h4 className="text-white mb-1">{selectedEquipment?.name}</h4>
                  <p className="text-sm text-gray-400 line-clamp-2">{selectedEquipment?.specs}</p>
                  <p className="text-xs text-gray-500 mt-1">ID: {selectedEquipment?.qrCode}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Select Available Accessories</Label>
              <div className="p-3 rounded-lg bg-gray-950 border border-gray-700 space-y-2 max-h-40 overflow-y-auto">
                {accessoryList.length === 0 ? (
                  <p className="text-sm text-gray-500">No additional accessories found.</p>
                ) : (
                  accessoryList.map((acc: any) => (
                    <div
                      key={acc.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-900 p-1 rounded"
                      onClick={() => toggleAccessory(acc.name)}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center ${
                          selectedAccessories.includes(acc.name)
                            ? 'bg-teal-500 border-teal-500'
                            : 'border-gray-500'
                        }`}
                      >
                        {selectedAccessories.includes(acc.name) && (
                          <CheckSquare className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          selectedAccessories.includes(acc.name) ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {acc.name} <span className="text-xs text-gray-600">({acc.status})</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Other Items / Notes</Label>
              <Input
                placeholder="e.g. Need extra battery..."
                value={customAccessory}
                onChange={(e) => setCustomAccessory(e.target.value)}
                className="bg-gray-950 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Rental Duration (Days)</Label>
              <Input
                type="number"
                min="1"
                max="7"
                value={rentalDuration}
                onChange={(e) => setRentalDuration(e.target.value)}
                className="bg-gray-950 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">Maximum rental period: 7 days</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Pickup Date</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="bg-gray-950 border-gray-700 text-white block"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Return Date</Label>
                <div className="px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-sm text-white h-10 flex items-center">
                  {getReturnDate()}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                onClick={() => setShowRentalModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={handleRental}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Confirm Rental'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QRScanner open={showQRScanner} onClose={() => setShowQRScanner(false)} onNavigate={onNavigate || (() => {})} />
    </div>
  );
}
