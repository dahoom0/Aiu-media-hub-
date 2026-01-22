import { useEffect, useMemo, useState } from 'react';
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
  AlertCircle,
  ShoppingCart,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { QRScanner } from './QRScanner';
import { useTheme } from './ThemeProvider';
import equipmentService from '../services/equipmentService';

// ✅ shadcn dropdown (Popover + Command)
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface EquipmentRentalPageProps {
  onNavigate?: (page: string) => void;
}

/**
 * IMPORTANT:
 * - UI uses BOTH:
 *   - equipmentPk: Equipment.id (PK)         (for request/bundle endpoints if you use them)
 *   - equipmentCode: Equipment.equipment_id  (CAM001) -> used by /equipment/checkout/ in your backend
 */
type CartLine = {
  equipmentPk: number;
  equipmentCode: string;

  name: string;
  image?: string;

  available: number;
  quantity: number;
  durationDays: number;
  notes: string;

  categoryText?: string;
};

type CategoryTab = {
  id: string;
  label: string;
  icon: any;
};

type MyRentalItem = {
  id: number;
  name: string;
  qrCode: string;
  requestedAt: string;
  dueDate: string;
  status: string;
  reject_reason?: string | null;
};

export function EquipmentRentalPage({ onNavigate }: EquipmentRentalPageProps) {
  const { theme } = useTheme();

  // Backend origin for media URLs (baseURL is /api but media is served from root)
  const BACKEND_ORIGIN = 'http://localhost:8000';

  const resolveMediaUrl = (src?: string) => {
    if (!src) return '';
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith('/media/')) return `${BACKEND_ORIGIN}${src}`;
    if (src.startsWith('/')) return `${BACKEND_ORIGIN}${src}`;
    return src;
  };

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // --- CART STATE ---
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [bundleNotes, setBundleNotes] = useState('');
  const [cartSubmitting, setCartSubmitting] = useState(false);

  // --- FORM STATE (single rent modal kept) ---
  const [rentalDuration, setRentalDuration] = useState('1');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [customAccessory, setCustomAccessory] = useState('');

  // ✅ NEW: dropdown open state for accessories
  const [accessoriesOpen, setAccessoriesOpen] = useState(false);

  // --- REAL DATA STATE ---
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [accessoryList, setAccessoryList] = useState<any[]>([]);
  const [myRentals, setMyRentals] = useState<MyRentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Rejection reason dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRejectedRental, setSelectedRejectedRental] = useState<MyRentalItem | null>(null);

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

  // ✅ normalize category names -> tab slugs (camera/audio/lighting/accessories/...)
  const toCatSlug = (name: any) => {
    const n = safeLower(name);

    // handle plural + variations
    if (n.includes('camera')) return 'camera';
    if (n.includes('audio') || n.includes('mic')) return 'audio';
    if (n.includes('light')) return 'lighting';
    if (n.includes('access')) return 'accessories';
    if (n.includes('other')) return 'other';

    return n.replace(/\s+/g, '-');
  };

  // ✅ extract readable category names from equipment item (objects/strings/legacy)
  const extractCatNames = (item: any) => {
    const cats = Array.isArray(item?.categories) ? item.categories : [];

    const namesFromCats = cats
      .map((c: any) => (typeof c === 'object' ? c?.name ?? c?.label ?? c?.title : c))
      .filter(Boolean)
      .map((x: any) => String(x).trim())
      .filter(Boolean);

    const legacy = item?.category;
    const legacyTokens =
      typeof legacy === 'string'
        ? legacy
            .split(/[,/|]+/g)
            .map((x) => x.trim())
            .filter(Boolean)
        : legacy
          ? [String(legacy).trim()]
          : [];

    const merged = [...namesFromCats, ...legacyTokens].map((x) => String(x).trim()).filter(Boolean);

    // unique
    return Array.from(new Set(merged));
  };

  // ✅ derive slugs from M2M categories + legacy "category" field
  const extractCatSlugs = (item: any) => {
    const names = extractCatNames(item);
    const slugs = names.map(toCatSlug).filter(Boolean);
    return Array.from(new Set(slugs));
  };

  // ---- My Bookings status helpers ----
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

  // Sort key: prefer rental_date/created_at; fallback to id
  const getRentalSortKey = (r: any) => {
    const raw = r?.rental_date || r?.created_at || r?.pickup_date || r?.start_date || null;
    const ms = raw ? new Date(raw).getTime() : 0;
    const id = typeof r?.id === 'number' ? r.id : 0;
    return (Number.isFinite(ms) ? ms : 0) * 1000 + id;
  };

  const cartCount = useMemo(() => cart.reduce((sum, x) => sum + (Number(x.quantity) || 0), 0), [cart]);

  // live inventory map from current equipmentList cards (keyed by equipmentCode CAM001)
  const availableByEquipmentCode = useMemo(() => {
    const m = new Map<string, number>();
    equipmentList.forEach((x: any) => {
      const code = String(x?.equipmentCode || x?.qrCode || '').trim();
      if (!code) return;
      m.set(code, Number(x?.quantity_available ?? 0));
    });
    return m;
  }, [equipmentList]);

  const refreshCartAvailabilityFromCatalog = () => {
    setCart((prev) =>
      prev.map((line) => {
        const latestAvail = availableByEquipmentCode.get(line.equipmentCode);
        const available = Number(latestAvail ?? line.available ?? 0);

        if (available <= 0) {
          return { ...line, available, quantity: 0 };
        }

        const q = Number(line.quantity) || 1;
        const nextQ = Math.max(1, Math.min(available, q));
        return { ...line, available, quantity: nextQ };
      })
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allEquipmentRes, rentalsRes] = await Promise.all([equipmentService.getAll(), equipmentService.getRentals()]);

      const rawEquipment = asArray(allEquipmentRes);
      const rawRentals = asArray(rentalsRes);

      // Accessories list (categories from service are often strings -> handle both strings & objects)
      const accessoriesFromDB = rawEquipment.filter((item: any) => {
        const cats = Array.isArray(item?.categories) ? item.categories : [];
        const catsStr = cats
          .map((c: any) => String(typeof c === 'object' ? c?.name ?? c?.label ?? c?.title ?? '' : c ?? ''))
          .join(' ')
          .toLowerCase();

        const cat = item?.category;
        const catStr =
          typeof cat === 'string'
            ? cat.toLowerCase()
            : typeof cat?.name === 'string'
              ? cat.name.toLowerCase()
              : typeof cat?.label === 'string'
                ? cat.label.toLowerCase()
                : '';

        return (catsStr + ' ' + catStr).includes('access');
      });
      setAccessoryList(accessoriesFromDB);

      // Map equipment cards (robust against service shape)
      const mappedEquipment = rawEquipment.map((item: any) => {
        const categoriesArr = Array.isArray(item?.categories) ? item.categories : [];

        const categoriesText = categoriesArr
          .map((c: any) => String(typeof c === 'object' ? c?.name ?? c?.label ?? c?.title ?? '' : c ?? '').trim())
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const oldCat = item?.category;
        const oldCatText =
          typeof oldCat === 'string'
            ? oldCat.toLowerCase()
            : typeof oldCat?.name === 'string'
              ? oldCat.name.toLowerCase()
              : typeof oldCat?.label === 'string'
                ? oldCat.label.toLowerCase()
                : '';

        const categoryString = categoriesText || oldCatText || 'cameras';

        const pk = Number(item?.pk ?? item?.id);
        const equipmentCode = String(
          item?.equipmentCode ?? item?.equipmentId ?? item?.equipment_id ?? item?.qrCode ?? ''
        ).trim();

        // ✅ derive categories/slugs from backend data (dynamic)
        const categoryNames = extractCatNames(item);
        const categorySlugs = extractCatSlugs(item);

        return {
          pk: Number.isFinite(pk) ? pk : 0,
          id: Number.isFinite(pk) ? pk : 0,

          name: item?.name || '',
          category: categoryString, // old display-ish text

          // Keep raw categories array too (for modal list)
          categories: categoriesArr,

          // ✅ dynamic names + slugs
          categoryNames,
          categorySlugs,

          status: item?.status || 'available',

          qrCode: equipmentCode,
          equipmentCode,

          specs: item?.description || item?.specs || 'Professional equipment',
          image: item?.image || '',
          quantity_available: Number(item?.quantity_available ?? item?.quantityAvailable ?? 0),
        };
      });

      // Lookup for joining if rental.equipment is FK id
      const equipmentById = new Map<number, any>();
      rawEquipment.forEach((eq: any) => {
        const id = Number(eq?.id);
        if (Number.isFinite(id)) equipmentById.set(id, eq);
      });

      const recent5: MyRentalItem[] = [...rawRentals]
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

          const qrCode =
            rental?.equipment_id ||
            rental?.equipment_code ||
            eqFromRental?.equipment_id ||
            eqFromCatalog?.equipment_id ||
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
            status: rental.status,
            // ✅ REQUIRED for rejected comment dialog
            reject_reason: rental?.reject_reason ?? null,
          };
        });

      setEquipmentList(mappedEquipment);
      setMyRentals(recent5);

      // keep cart availability fresh after refresh
      setTimeout(() => refreshCartAvailabilityFromCatalog(), 0);
    } catch (error) {
      console.error('Failed to fetch equipment', error);
    } finally {
      setLoading(false);
    }
  };

  // -------- CART HELPERS --------
  const addToCart = (item: any) => {
    const equipmentPk = Number(item.pk ?? item.id);
    const equipmentCode = String(item.equipmentCode ?? item.qrCode ?? item.equipmentId ?? item.equipment_id ?? '').trim();
    const available = Number(item.quantity_available ?? 0);

    if (!Number.isFinite(equipmentPk) || equipmentPk <= 0 || !equipmentCode) {
      alert('This equipment item is missing identifiers (pk/code). Please refresh.');
      return;
    }

    // 🚫 prevent adding out-of-stock items
    if (available <= 0) {
      alert('This item is currently out of stock (Available: 0).');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((x) => x.equipmentPk === equipmentPk);
      if (existing) {
        return prev.map((x) =>
          x.equipmentPk === equipmentPk
            ? { ...x, available, quantity: Math.min((Number(x.quantity) || 1) + 1, available) }
            : x
        );
      }

      return [
        ...prev,
        {
          equipmentPk,
          equipmentCode,
          name: item.name,
          image: item.image,
          available,
          quantity: 1,
          durationDays: 1,
          notes: '',
          categoryText: item.category,
        },
      ];
    });

    setCartOpen(true);
  };

  const updateCartLine = (equipmentPk: number, patch: Partial<CartLine>) => {
    setCart((prev) => prev.map((x) => (x.equipmentPk === equipmentPk ? { ...x, ...patch } : x)));
  };

  const removeFromCart = (equipmentPk: number) => {
    setCart((prev) => prev.filter((x) => x.equipmentPk !== equipmentPk));
  };

  const clearCart = () => {
    setCart([]);
    setBundleNotes('');
  };

  const cartHasInvalidLines = useMemo(() => {
    if (cart.length === 0) return false;
    return cart.some((x) => {
      const a = Number(x.available ?? 0);
      const q = Number(x.quantity ?? 0);
      if (a <= 0) return true;
      if (!Number.isFinite(q) || q < 1) return true;
      if (q > a) return true;
      return false;
    });
  }, [cart]);

  const extractDRFError = (err: any) => {
    const data = err?.response?.data;
    if (!data) return err?.message || 'Please check quantities and try again.';
    if (typeof data === 'string') return data;
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.error === 'string') return data.error;
    try {
      return JSON.stringify(data);
    } catch {
      return 'Request failed. Please try again.';
    }
  };

  /**
   * ✅ UPDATED:
   * Submit Bundle now behaves like "Rent Now":
   * it calls equipmentService.checkout() for each cart item (and repeats for quantity).
   *
   * - checkout() expects equipment_id = CAM001 (equipment code), NOT PK
   * - This creates rentals immediately (same as Rent Now)
   */
  const submitCartBundle = async () => {
    if (cart.length === 0) return;

    // ✅ resync from current catalog first
    refreshCartAvailabilityFromCatalog();

    const invalid = cart
      .map((x) => {
        const a = Number(availableByEquipmentCode.get(x.equipmentCode) ?? x.available ?? 0);
        const q = Number(x.quantity ?? 0);
        const problems: string[] = [];
        if (a <= 0) problems.push('out of stock');
        if (!Number.isFinite(q) || q < 1) problems.push('qty must be >= 1');
        if (q > a) problems.push(`qty ${q} > available ${a}`);
        return problems.length ? `${x.name} (${x.equipmentCode}): ${problems.join(', ')}` : null;
      })
      .filter(Boolean) as string[];

    if (invalid.length > 0) {
      alert('Submit blocked. Fix these items:\n\n' + invalid.join('\n'));
      return;
    }

    setCartSubmitting(true);
    try {
      // build tasks: one checkout per unit (qty)
      const tasks: Promise<any>[] = [];

      for (const line of cart) {
        const qty = Math.max(1, Number(line.quantity) || 1);

        for (let i = 0; i < qty; i++) {
          const note = (line.notes || '').trim() || (bundleNotes || '').trim() || '';

          tasks.push(
            equipmentService.checkout(
              line.equipmentCode, // ✅ CAM001
              'Main Desk',
              pickupDate,
              line.durationDays,
              note
            )
          );
        }
      }

      await Promise.all(tasks);

      alert('Bundle rented successfully!');
      clearCart();
      setCartOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Bundle rent failed', error);
      alert('Bundle rent failed: ' + extractDRFError(error));
    } finally {
      setCartSubmitting(false);
    }
  };

  // -------- Existing single-rent modal helpers (kept) --------
  const openRentalModal = (item: any) => {
    setSelectedEquipment(item);
    setPickupDate(new Date().toISOString().split('T')[0]);
    setRentalDuration('1');
    setCustomAccessory('');
    setSelectedAccessories([]);
    setAccessoriesOpen(false);
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
      setSelectedAccessories(selectedAccessories.filter((a) => a !== accName));
    } else {
      setSelectedAccessories([...selectedAccessories, accName]);
    }
  };

  // ✅ DYNAMIC CATEGORY TABS:
  const categories: CategoryTab[] = useMemo(() => {
    const base: CategoryTab[] = [{ id: 'all', label: 'All Equipment', icon: Package }];

    const map = new Map<string, { label: string; slug: string }>();

    equipmentList.forEach((item: any) => {
      const names = Array.isArray(item?.categoryNames) ? item.categoryNames : extractCatNames(item);
      names.forEach((nm: any) => {
        const label = String(nm ?? '').trim();
        if (!label) return;
        const slug = toCatSlug(label);
        if (!slug) return;
        if (!map.has(slug)) {
          map.set(slug, { label, slug });
        }
      });
    });

    // stable ordering: by label
    const sorted = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));

    const iconFor = (slug: string, label: string) => {
      const s = safeLower(slug || label);
      if (s.includes('camera')) return Camera;
      if (s.includes('audio') || s.includes('mic')) return Mic;
      if (s.includes('light')) return Lightbulb;
      if (s.includes('access')) return Film;
      return Package;
    };

    return [
      ...base,
      ...sorted.map((x) => ({
        id: x.slug,
        label: x.label,
        icon: iconFor(x.slug, x.label),
      })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentList]);

  // ✅ UPDATED FILTER:
  const filteredEquipment = equipmentList.filter((item) => {
    const q = safeLower(searchQuery);

    const hay = [
      safeLower(item?.name),
      safeLower(item?.specs),
      safeLower(item?.qrCode),
      safeLower(item?.equipmentCode),
    ].join(' ');

    const matchesSearch = !q || hay.includes(q);

    const slugs = Array.isArray(item?.categorySlugs) ? item.categorySlugs : extractCatSlugs(item);
    const matchesCategory = selectedCategory === 'all' || slugs.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

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

  // Existing single-item checkout (kept)
  const handleRental = async () => {
    if (!selectedEquipment) return;
    setSubmitting(true);

    const itemsList = selectedAccessories.join(', ');
    const fullNotes = `Additional Items: ${itemsList}. ${customAccessory ? 'Note: ' + customAccessory : ''}`;

    try {
      await equipmentService.checkout(selectedEquipment.qrCode, 'Main Desk', pickupDate, rentalDuration, fullNotes);
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

  // Cancel only when pending
  const handleCancel = async (rentalId: number) => {
    if (!confirm('Cancel this request?')) return;
    try {
      await equipmentService.cancelRental(rentalId);
      alert('Request cancelled.');
      fetchData();
    } catch (error: any) {
      console.error('Cancel failed', error);
      alert('Cancel failed (backend cancel endpoint may not be implemented).');
    }
  };

  // ✅ Ensure selectedCategory stays valid when backend categories change
  useEffect(() => {
    const valid = categories.some((c) => c.id === selectedCategory);
    if (!valid) setSelectedCategory('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // ✅ Open rejection dialog (student clicks rejected booking)
  const openRejectReasonDialog = (rental: MyRentalItem) => {
    setSelectedRejectedRental(rental);
    setRejectDialogOpen(true);
  };

  // ✅ Display text for dropdown trigger
  const accessoriesTriggerText = useMemo(() => {
    if (!selectedAccessories || selectedAccessories.length === 0) return 'Select accessories...';
    if (selectedAccessories.length === 1) return selectedAccessories[0];
    return `${selectedAccessories.length} accessories selected`;
  }, [selectedAccessories]);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === 'light' ? 'bg-[#EBF2FA]' : 'bg-gray-950'
        }`}
      >
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

      {/* Search + Cart + QR Scanner */}
      <div className="flex flex-col md:flex-row gap-4">
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

        <div className="flex gap-4">
          <Button
            variant="outline"
            className={`relative ${
              theme === 'light'
                ? 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                : 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800'
            }`}
            onClick={() => {
              refreshCartAvailabilityFromCatalog();
              setCartOpen(true);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {cartCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs bg-teal-500 text-white">
                {cartCount}
              </span>
            )}
          </Button>

          <Button
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            onClick={() => setShowQRScanner(true)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR
          </Button>
        </div>
      </div>

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList
          className={`border ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'
          } w-full overflow-x-auto whitespace-nowrap`}
        >
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
              filteredEquipment.map((item) => {
                const available = Number(item.quantity_available ?? 0);
                const imageUrl = resolveMediaUrl(item.image);

                return (
                  <Card
                    key={item.id}
                    className={`hover:border-teal-500/50 transition-all group ${
                      theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-800">
                        {imageUrl ? (
                          <ImageWithFallback
                            src={imageUrl}
                            alt={item.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Camera className="h-12 w-12" />
                          </div>
                        )}
                        <Badge className={`absolute top-3 right-3 ${getStatusColor(item.status)}`}>{item.status}</Badge>
                        <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-500/30">
                          <QrCode className="h-5 w-5 text-teal-400" />
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className={theme === 'light' ? 'text-gray-900 mb-1' : 'text-white mb-1'}>{item.name}</h4>
                          <p className={`text-xs mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                            ID: {item.qrCode}
                          </p>
                          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} line-clamp-2`}>
                            {item.specs}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">Available: {available}</p>
                        </div>

                        <div className="flex gap-3 mt-4">
                          <Button
                            className={`flex-1 disabled:opacity-50 ${
                              theme === 'light'
                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                : 'bg-gray-800 text-white hover:bg-gray-700'
                            }`}
                            disabled={item.status !== 'available' || available <= 0}
                            onClick={() => addToCart(item)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>

                          <Button
                            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white disabled:opacity-50"
                            disabled={item.status !== 'available' || available <= 0}
                            onClick={() => openRentalModal(item)}
                          >
                            Rent Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ✅ My Bookings */}
      <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900/50 border-gray-800'}`}>
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

                // ✅ clickable only for rejected items (shows reject_reason dialog)
                const isRejected = statusLower === 'rejected';
                const hasReason = Boolean(String(rental.reject_reason ?? '').trim());
                const clickable = isRejected && hasReason;

                return (
                  <div
                    key={rental.id}
                    onClick={() => {
                      if (clickable) openRejectReasonDialog(rental);
                    }}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700 gap-4 ${
                      clickable ? 'cursor-pointer' : ''
                    }`}
                    title={clickable ? 'Click to view admin comment' : undefined}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className={theme === 'light' ? 'text-gray-900' : 'text-white'}>{rental.name}</h4>

                        <Badge className={getRentalStatusColor(rental.status)}>
                          {getStatusIcon(rental.status)}
                          <span className="ml-1 capitalize">{statusLower || 'unknown'}</span>
                        </Badge>
                      </div>

                      <div
                        className={`flex flex-wrap items-center gap-3 text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(rental.id);
                          }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReturn(rental.id);
                        }}
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

      {/* ✅ Reject Reason Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setSelectedRejectedRental(null);
        }}
      >
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Request Rejected</DialogTitle>
            <DialogDescription className="text-gray-400">Admin comment for this request</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm text-gray-400">
              <span className="text-white">{selectedRejectedRental?.name || 'Equipment'}</span>
              {selectedRejectedRental?.qrCode ? (
                <span className="text-gray-500"> • ID: {selectedRejectedRental.qrCode}</span>
              ) : null}
            </div>

            <div className="p-3 rounded-lg bg-gray-950 border border-gray-700 text-sm text-white whitespace-pre-wrap">
              {String(selectedRejectedRental?.reject_reason ?? '').trim() || 'No comment provided.'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Cart Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Your Cart</DialogTitle>
            <DialogDescription className="text-gray-400">
              Submit all items as one bundle request (admin can approve items individually).
            </DialogDescription>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-10">Your cart is empty.</div>
          ) : (
            <div className="space-y-4">
              {cart.map((line) => {
                const available = Number(line.available ?? 0);
                const maxQty = Math.max(0, available);
                const outOfStock = available <= 0;
                const imageUrl = resolveMediaUrl(line.image);

                return (
                  <div key={line.equipmentPk} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                          {imageUrl ? (
                            <ImageWithFallback src={imageUrl} alt={line.name} className="object-cover w-full h-full" />
                          ) : (
                            <Camera className="h-6 w-6 text-gray-500" />
                          )}
                        </div>

                        <div>
                          <div className="text-white">{line.name}</div>
                          <div className="text-xs text-gray-500">ID: {line.equipmentCode}</div>
                          <div className="text-xs text-gray-500">Available: {available}</div>
                          {outOfStock && <div className="text-xs text-red-400 mt-1">Out of stock — remove this item.</div>}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => removeFromCart(line.equipmentPk)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Qty</Label>
                        <Input
                          type="number"
                          min={outOfStock ? 0 : 1}
                          max={maxQty}
                          value={line.quantity}
                          disabled={outOfStock}
                          onChange={(e) => {
                            const v = Number(e.target.value || (outOfStock ? 0 : 1));
                            const next = outOfStock ? 0 : Math.max(1, Math.min(maxQty, v));
                            updateCartLine(line.equipmentPk, { quantity: next });
                          }}
                          className="bg-gray-950 border-gray-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">Duration (days)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={line.durationDays}
                          onChange={(e) => {
                            const v = Number(e.target.value || 1);
                            updateCartLine(line.equipmentPk, { durationDays: Math.max(1, v) });
                          }}
                          className="bg-gray-950 border-gray-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">Notes</Label>
                        <Input
                          placeholder="Optional"
                          value={line.notes}
                          onChange={(e) => updateCartLine(line.equipmentPk, { notes: e.target.value })}
                          className="bg-gray-950 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="space-y-2">
                <Label className="text-gray-300">Bundle Notes (optional)</Label>
                <Input
                  placeholder="Anything admin should know..."
                  value={bundleNotes}
                  onChange={(e) => setBundleNotes(e.target.value)}
                  className="bg-gray-950 border-gray-700 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                  onClick={() => clearCart()}
                  disabled={cartSubmitting}
                >
                  Clear Cart
                </Button>

                <Button
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  onClick={submitCartBundle}
                  disabled={cartSubmitting || cartHasInvalidLines}
                >
                  {cartSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Submit Bundle'}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Note: bundle approval happens per item. Approved items will appear in “My Bookings” after admin review.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rental Modal (UPDATED accessories to dropdown) */}
      <Dialog open={showRentalModal} onOpenChange={setShowRentalModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Rent Equipment</DialogTitle>
            <DialogDescription className="text-gray-400">Submit a rental request for admin approval</DialogDescription>
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

            {/* ✅ Accessories dropdown (scroll + search) */}
            <div className="space-y-2">
              <Label className="text-gray-300">Accessories</Label>

              <Popover open={accessoriesOpen} onOpenChange={setAccessoriesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between border-gray-700 text-white hover:bg-gray-800 bg-gray-950"
                  >
                    <span className={`text-sm ${selectedAccessories.length ? 'text-white' : 'text-gray-500'}`}>
                      {accessoriesTriggerText}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-gray-950 border-gray-700 text-white">
                  <Command className="bg-gray-950 text-white">
                    <CommandInput placeholder="Search accessories..." className="text-white" />
                    <CommandList className="max-h-48 overflow-y-auto">
                      <CommandEmpty>No accessories found.</CommandEmpty>
                      <CommandGroup>
                        {accessoryList.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-gray-500">No additional accessories found.</div>
                        ) : (
                          accessoryList.map((acc: any) => {
                            const name = String(acc?.name ?? '').trim();
                            if (!name) return null;
                            const selected = selectedAccessories.includes(name);

                            return (
                              <CommandItem
                                key={acc.id ?? name}
                                value={name}
                                onSelect={() => toggleAccessory(name)}
                                className="cursor-pointer aria-selected:bg-gray-900"
                              >
                                <div
                                  className={`mr-2 h-4 w-4 rounded border flex items-center justify-center ${
                                    selected ? 'bg-teal-500 border-teal-500' : 'border-gray-500'
                                  }`}
                                >
                                  {selected && <CheckSquare className="h-3 w-3 text-white" />}
                                </div>

                                <div className="flex items-center justify-between w-full">
                                  <span className={`text-sm ${selected ? 'text-white' : 'text-gray-300'}`}>{name}</span>
                                  {acc?.status ? (
                                    <span className="text-xs text-gray-500 ml-3">({String(acc.status)})</span>
                                  ) : null}
                                </div>
                              </CommandItem>
                            );
                          })
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>

                  {selectedAccessories.length > 0 ? (
                    <div className="border-t border-gray-700 p-2 text-xs text-gray-500">
                      Selected: {selectedAccessories.join(', ')}
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>

              <p className="text-xs text-gray-500">Click to open dropdown, scroll to choose accessories.</p>
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
