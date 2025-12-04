# AIU Media Hub - Admin Panel Quick Reference

## 🚀 Quick Start

### Access Admin Panel
```bash
# Login with admin credentials
URL: /login
Email: admin@aiu.edu.my
Password: [admin_password]
→ Auto-redirect to /admin-dashboard
```

---

## 📍 Admin Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `admin-dashboard` | AdminDashboard | Main admin overview |
| `admin-tutorials` | AdminTutorialManagement | Manage tutorials |
| `admin-labs` | AdminLabManagement | Manage labs & bookings |
| `admin-equipment` | AdminEquipmentManagement | Manage equipment |
| `admin-cv-review` | AdminCVReview | Review student CVs |
| `admin-profiles` | AdminProfileManagement | Manage user profiles |

---

## 🗂️ File Structure

```
/components/
├── AdminDashboard.tsx             # Main admin dashboard
├── AdminTutorialManagement.tsx    # Tutorial CRUD + upload
├── AdminLabManagement.tsx         # Lab settings + booking approval
├── AdminEquipmentManagement.tsx   # Equipment CRUD + status
├── AdminCVReview.tsx              # CV review + feedback
├── AdminProfileManagement.tsx     # User profile management
└── DashboardLayout.tsx            # Shared layout with sidebar

/lib/services/
├── tutorialService.js             # Tutorial API calls
├── labBookingService.js           # Lab API calls
├── equipmentService.js            # Equipment API calls
└── portfolioService.js            # CV API calls
```

---

## 🎨 Component Props

### AdminDashboard
```typescript
interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}
```

### AdminTutorialManagement
```typescript
// No props required
// Uses theme context internally
```

### AdminLabManagement
```typescript
// No props required
// Uses theme context internally
```

### AdminEquipmentManagement
```typescript
// No props required
// Uses theme context internally
```

### AdminCVReview
```typescript
interface AdminCVReviewProps {
  onNavigate?: (page: string, params?: any) => void;
}
```

### AdminProfileManagement
```typescript
interface AdminProfileManagementProps {
  onNavigate?: (page: string, params?: any) => void;
}
```

---

## 🎯 Key Features by Component

### AdminDashboard
```typescript
✅ Statistics cards (4)
✅ Pending approvals list
✅ Recent activity feed
✅ Equipment status overview
✅ Lab utilization metrics
✅ System health indicators
✅ Quick access buttons
✅ Navigate to other admin pages
```

### AdminTutorialManagement
```typescript
✅ View all tutorials (table/grid)
✅ Multi-step upload dialog
   → Step 1: Source (Local/Drive/YouTube)
   → Step 2: Details (Title, Description, Category)
   → Step 3: Link Equipment (if Equipment category)
✅ Edit tutorial
✅ Delete tutorial
✅ View tutorial details
✅ Filter by category/status
```

### AdminLabManagement
```typescript
✅ Tab 1: Lab Settings
   → View labs
   → Add lab
   → Add PC to lab
   → Add time slot
   → Manage availability
✅ Tab 2: Booking Requests
   → View all requests
   → Approve booking
   → Reject booking (with reason)
   → View student profile
   → Filter by status
```

### AdminEquipmentManagement
```typescript
✅ View all equipment (grid/table)
✅ Add equipment dialog
   → Upload image
   → Enter details
   → Set category
   → Set initial status
✅ Change equipment status
   → Available
   → Rented
   → Under Maintenance
✅ Edit equipment
✅ Delete equipment
```

### AdminCVReview
```typescript
✅ View student CV list
✅ Click student → CV Review Page
✅ View all CV sections
   → Personal, Contact, Education, Experience
   → Projects, Certifications, Involvement
   → Skills, References
✅ Download CV (PDF)
✅ View student profile
✅ Flag CV
✅ Add admin feedback
✅ Back to list
```

### AdminProfileManagement
```typescript
✅ Tab 1: Students
   → View all students
   → Click → Student profile view
   → View CV details (links to CV Review)
   → View statistics
✅ Tab 2: Admins
   → View all admins
   → Click → Admin profile view
   → View role/permissions
```

---

## 🎨 Theme System

### Using Theme in Components
```typescript
import { useTheme } from './ThemeProvider';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={theme === 'light' ? 'bg-white' : 'bg-gray-900'}>
      {/* Content */}
    </div>
  );
}
```

### Theme Classes
```typescript
// Light Mode
theme === 'light' ? 'bg-white' : 'bg-gray-900'           // Card background
theme === 'light' ? 'text-gray-900' : 'text-white'       // Text
theme === 'light' ? 'border-gray-200' : 'border-gray-800' // Borders

// Dark Mode
'bg-gray-900/50'        // Card background
'text-white'            // Primary text
'text-gray-400'         // Secondary text
'border-gray-800'       // Borders
```

---

## 🔔 Toast Notifications

```typescript
import { toast } from 'sonner';

// Success
toast.success('Tutorial uploaded successfully!');

// Error
toast.error('Failed to upload tutorial');

// Info
toast.info('Processing your request...');

// Warning
toast.warning('Please fill all required fields');

// Custom
toast('Custom message', {
  description: 'Additional details here',
  duration: 5000,
});
```

---

## 📝 Form Patterns

### Dialog Pattern
```typescript
const [isDialogOpen, setIsDialogOpen] = useState(false);

<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

### Multi-Step Form
```typescript
const [step, setStep] = useState<1 | 2 | 3>(1);

const handleNext = () => {
  if (step === 1) {
    // Validate step 1
    setStep(2);
  } else if (step === 2) {
    // Validate step 2
    if (needsStep3) {
      setStep(3);
    } else {
      handleSubmit();
    }
  }
};
```

---

## 🎨 Status Badges

```typescript
// Success/Active
<Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
  Active
</Badge>

// Warning/Pending
<Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
  Pending
</Badge>

// Error/Rejected
<Badge className="bg-red-500/20 text-red-400 border-red-500/50">
  Rejected
</Badge>

// Info
<Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
  Info
</Badge>
```

---

## 🔗 Navigation

### In Component
```typescript
// With onNavigate prop
<Button onClick={() => onNavigate('admin-tutorials')}>
  Go to Tutorials
</Button>

// In DashboardLayout
<button onClick={() => onNavigate('admin-dashboard')}>
  Dashboard
</button>
```

### Cross-Page Navigation
```typescript
// CV Review → Profile Management
onNavigate && onNavigate('admin-profiles', { studentId: 'S001' })

// Profile Management → CV Review
onNavigate && onNavigate('admin-cv-review', { studentId: 'S001' })

// Lab Booking → Student Profile
// Handled within component state
```

---

## 📊 Data Structures

### Tutorial
```typescript
interface Tutorial {
  id: string;
  title: string;
  category: 'equipment' | 'general';
  views: number;
  dateAdded: string;
  status: 'active' | 'draft' | 'archived';
  source: 'local' | 'drive' | 'youtube';
  linkedEquipment?: string[];
}
```

### Lab Booking Request
```typescript
interface BookingRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lab: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  rejectionReason?: string;
}
```

### Equipment
```typescript
interface Equipment {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'available' | 'rented' | 'maintenance';
  image?: string;
}
```

### Student CV
```typescript
interface StudentCV {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lastUpdated: string;
  status: 'approved' | 'needs-changes' | 'flagged' | 'pending';
  cvData: {
    personal: {...};
    contact: {...};
    education: any[];
    experience: any[];
    projects: any[];
    certifications: any[];
    involvement: any[];
    skills: any[];
    references: any[];
  };
}
```

---

## 🔌 API Integration Points

### Tutorial Service
```typescript
// GET all tutorials
GET /api/admin/tutorials

// POST new tutorial
POST /api/admin/tutorials
Body: { title, description, category, source, url/file, linkedEquipment }

// PUT update tutorial
PUT /api/admin/tutorials/:id
Body: { ...tutorialData }

// DELETE tutorial
DELETE /api/admin/tutorials/:id

// POST link equipment
POST /api/admin/tutorials/:id/link-equipment
Body: { equipmentIds: string[] }
```

### Lab Service
```typescript
// GET all labs
GET /api/admin/labs

// POST new lab
POST /api/admin/labs
Body: { name, capacity, status }

// GET booking requests
GET /api/admin/bookings?status=pending

// PUT approve booking
PUT /api/admin/bookings/:id/approve

// PUT reject booking
PUT /api/admin/bookings/:id/reject
Body: { reason: string }
```

### Equipment Service
```typescript
// GET all equipment
GET /api/admin/equipment

// POST new equipment
POST /api/admin/equipment
Body: { name, category, description, status, image }

// PUT update status
PUT /api/admin/equipment/:id/status
Body: { status: 'available' | 'rented' | 'maintenance' }
```

### CV Service
```typescript
// GET all student CVs
GET /api/admin/cvs

// GET specific CV
GET /api/admin/cvs/:studentId

// POST feedback
POST /api/admin/cvs/:studentId/feedback
Body: { comment: string }

// PUT flag CV
PUT /api/admin/cvs/:studentId/flag
Body: { flagged: boolean }
```

---

## 🎨 Gradient Buttons

```typescript
// Primary (Teal to Cyan)
<Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
  Primary Action
</Button>

// Secondary (Purple to Pink)
<Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
  Secondary Action
</Button>

// Danger (Red)
<Button className="border-red-500/50 text-red-400 hover:bg-red-500/10" variant="outline">
  Danger Action
</Button>
```

---

## 📱 Responsive Utilities

```typescript
// Grid responsive
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

// Hide on mobile
<div className="hidden lg:block">

// Show only on mobile
<div className="lg:hidden">

// Flex responsive
<div className="flex flex-col md:flex-row">
```

---

## 🔍 Common Patterns

### Loading State
```typescript
const [isLoading, setIsLoading] = useState(false);

{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
  </div>
) : (
  // Content
)}
```

### Empty State
```typescript
{items.length === 0 ? (
  <div className="text-center p-8">
    <p className="text-gray-400">No items found</p>
  </div>
) : (
  // List items
)}
```

### Confirmation Dialog
```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 🐛 Debugging Tips

### Check Theme
```typescript
console.log('Current theme:', theme);
```

### Check Navigation
```typescript
console.log('Current page:', activePage);
console.log('Is admin:', isAdmin);
```

### Check Form State
```typescript
console.log('Form data:', {
  title: tutorialTitle,
  category: tutorialCategory,
  step: uploadStep
});
```

---

## 📚 Resources

- **Component Library:** `/components/ui/`
- **Icons:** `lucide-react`
- **Notifications:** `sonner`
- **Forms:** React state + validation
- **Styling:** Tailwind CSS

---

## 🎯 Common Tasks

### Add New Admin Page
1. Create component in `/components/Admin[Name].tsx`
2. Add route in `/App.tsx` (PageType + renderPage)
3. Add nav item in `/components/DashboardLayout.tsx`
4. Import component in App.tsx
5. Test navigation

### Add New Dialog
1. Import Dialog components
2. Create state: `const [isOpen, setIsOpen] = useState(false)`
3. Add trigger button
4. Add DialogContent with form
5. Handle submit

### Add New Table Column
1. Update interface
2. Add TableHead
3. Add TableCell in map
4. Style appropriately

---

**Version:** 1.0  
**Last Updated:** November 25, 2025
