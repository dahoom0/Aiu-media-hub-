# AIU Media Hub - Admin Panel Guide

## Overview
The Admin Panel for AIU Media Hub has been fully implemented with comprehensive management features for tutorials, labs, equipment, CVs, and user profiles. The admin interface is restricted to users with admin credentials only.

---

## 🔐 Access Control
**IMPORTANT:** Only accounts with admin credentials can access the admin panel features.

- Admin users are identified during login
- All admin pages are protected and only accessible through the admin dashboard
- Students cannot access admin features

---

## 📋 Admin Panel Features

### 1. **Admin Dashboard** (`/components/AdminDashboard.tsx`)
**Route:** `admin-dashboard`

**Features:**
- Real-time statistics overview (Active Students, Equipment in Use, Active Bookings, Tutorial Views)
- Pending Approvals section showing booking and rental requests
- Recent Activity feed
- Equipment Status overview
- Lab Utilization metrics
- System Health monitoring
- Quick access cards to Content Management and User Management

**Navigation:**
- From dashboard, admins can navigate to:
  - Tutorial Management
  - Lab Management  
  - Equipment Management
  - CV Review
  - Profile Management

---

### 2. **Tutorial Management** (`/components/AdminTutorialManagement.tsx`)
**Route:** `admin-tutorials`

**Features:**
- Table view of all tutorials with columns:
  - Title
  - Category (Equipment / General)
  - Views count
  - Date Added
  - Status (Active / Draft / Archived)
  - Source type (YouTube / Google Drive / Local)
  - Linked Equipment

**Upload Tutorial - Multi-Step Process:**

**Step 1: Tutorial Source**
- Choose between:
  - Upload local video file
  - Insert Google Drive link
  - Insert YouTube link

**Step 2: Basic Details**
- Tutorial title (required)
- Description (required)
- Category selector: Equipment or General
- All tutorials appear under "All Tutorials" for students

**Step 3: Equipment Link** (Only if category = Equipment)
- Button: "Link Related Equipment"
- Opens popup listing all current equipment
- Admin can select one or more equipment items
- Creates association between tutorial and equipment

**Student Experience:**
- On tutorial video page, students see link/button to related equipment
- Clicking takes students to the equipment rental page

---

### 3. **Lab Management** (`/components/AdminLabManagement.tsx`)
**Route:** `admin-labs`

**Two Main Tabs:**

#### Tab 1: Lab Settings
Configure labs, PCs, time slots, and availability

**Features:**
- View all labs/studios
- View PCs in each lab
- Manage time slots
- Control availability

**Add New Dialogs:**
- **Add Lab Dialog:**
  - Lab name
  - Capacity
  - Status

- **Add PC Dialog:**
  - Select lab
  - PC number/identifier
  - Status

- **Add Time Slot Dialog:**
  - Time range
  - Availability toggle

#### Tab 2: Booking Requests
Review and manage student lab booking requests

**Table Columns:**
- Student name (clickable → opens student profile)
- Requested lab
- Date
- Time slot
- Purpose
- Status (Pending / Approved / Rejected)
- Requested date/time

**Actions:**
- **Approve:** Immediately approve the booking
- **Reject:** Opens rejection dialog with reason field

---

### 4. **Equipment Management** (`/components/AdminEquipmentManagement.tsx`)
**Route:** `admin-equipment`

**Features:**
- Grid/table view of all equipment
- Columns:
  - Picture/Image
  - Name
  - Equipment ID
  - Category
  - Status (Available / Rented / Maintenance)

**Add Equipment Dialog:**
- Upload image
- Equipment name (required)
- Category dropdown
- Description
- Status selector (Available / Rented / Under Maintenance)

**Equipment Status Management:**
- Admin can change status for any equipment item
- Status options:
  - Available (ready for rental)
  - Rented (currently checked out)
  - Under Maintenance (unavailable)

---

### 5. **CV Review & Management** (`/components/AdminCVReview.tsx`)
**Route:** `admin-cv-review`

**Main CV List View:**
- Table showing all students who have created CVs
- Columns:
  - Student name (clickable)
  - Email address
  - Date last updated
  - Status (Approved / Needs Changes / Flagged / Pending)

**CV Review Page (Click on student):**

**Display Sections:**
- Personal details (name, title, summary)
- Contact information
- Education history
- Work experience
- Projects
- Certifications
- Involvement/Activities
- Skills
- References (name, position, workplace, phone, email)

**Action Buttons:**
- **Download CV:** Export CV as PDF/document
- **Back to List:** Return to CV list
- **View Student Profile:** Navigate to admin's student profile page
- **Flag CV:** Mark CV for review or issues

**Admin Feedback:**
- Text comment box at bottom
- Admin can add feedback/suggestions
- Comments are visible to students when they view their CV

**Important Notes:**
- Admin cannot edit the CV directly
- Admin can only review and provide feedback
- Students must make their own edits based on feedback

---

### 6. **Profile Management** (`/components/AdminProfileManagement.tsx`)
**Route:** `admin-profiles`

**Two Main Tabs:**

#### Tab 1: Students

**Student List Table:**
- Name
- Email
- Student ID
- Program
- Year
- Status (Active / Inactive)
- Actions: "View Profile" button

**Student Profile View:**
When admin clicks "View Profile":
- Full name
- Email address
- Phone number
- Student ID
- Profile picture
- Program/Course
- Year of study
- Personal information
- Statistics:
  - Total bookings
  - Active equipment rentals
  - Tutorials watched
- **Button: "View CV Details"** → Links to CV Review Page

#### Tab 2: Admins

**Admin List Table:**
- Name
- Email
- Admin ID
- Role
- Status (Active / Inactive)
- Actions: "View Profile" button

**Admin Profile View:**
- Full name
- Email address
- Phone number
- Admin ID
- Profile picture
- Role/Position
- Personal information

---

## 🎨 Design & Theme Consistency

All admin pages maintain consistency with the student interface:

**Visual Elements:**
- Clean, minimal, academic design
- Light theme (default) with blue accents
- Dark mode available via theme toggle
- White content cards with subtle shadows
- Teal-to-cyan gradient for primary actions

**Typography:**
- Clear, readable fonts
- Consistent heading hierarchy
- Proper spacing scale

**Components:**
- Reusable UI components from `/components/ui/`
- Consistent button styles
- Uniform card layouts
- Standard form elements
- Dialog/modal patterns

**Color Palette:**
- Primary: Teal (#14B8A6) to Cyan (#06B6D4) gradient
- Background Light: #EBF2FA
- Background Dark: Gray-950
- Cards Light: White with border-gray-200
- Cards Dark: Gray-900/50 with border-gray-800
- Status Colors:
  - Success/Active: Teal-400
  - Warning/Pending: Yellow-400
  - Error/Rejected: Red-400
  - Info: Cyan-400

---

## 🔗 Navigation Structure

### Admin Sidebar Navigation
1. Dashboard (admin-dashboard)
2. Tutorial Management (admin-tutorials)
3. Lab Management (admin-labs)
4. Equipment Management (admin-equipment)
5. CV Review (admin-cv-review)
6. Profile Management (admin-profiles)

### Quick Access
- Profile settings (click avatar in sidebar)
- Logout button
- Theme toggle (light/dark mode)
- Search bar in header
- Notifications bell

---

## 📱 Responsive Design

All admin pages are responsive and work on:
- Desktop (primary use case)
- Tablet (optimized layouts)
- Mobile (accessible but designed for desktop administration)

---

## 🔄 Integration Points

### Frontend to Backend
All admin components are ready for backend integration with API endpoints:

**Tutorial Management:**
- `GET /api/admin/tutorials` - Fetch all tutorials
- `POST /api/admin/tutorials` - Upload new tutorial
- `PUT /api/admin/tutorials/:id` - Update tutorial
- `DELETE /api/admin/tutorials/:id` - Delete tutorial
- `POST /api/admin/tutorials/:id/link-equipment` - Link equipment

**Lab Management:**
- `GET /api/admin/labs` - Fetch all labs
- `POST /api/admin/labs` - Add new lab
- `GET /api/admin/bookings` - Fetch booking requests
- `PUT /api/admin/bookings/:id/approve` - Approve booking
- `PUT /api/admin/bookings/:id/reject` - Reject with reason

**Equipment Management:**
- `GET /api/admin/equipment` - Fetch all equipment
- `POST /api/admin/equipment` - Add equipment
- `PUT /api/admin/equipment/:id` - Update equipment status

**CV Review:**
- `GET /api/admin/cvs` - Fetch all student CVs
- `GET /api/admin/cvs/:id` - Fetch specific CV
- `POST /api/admin/cvs/:id/feedback` - Add admin feedback
- `PUT /api/admin/cvs/:id/flag` - Flag CV

**Profile Management:**
- `GET /api/admin/students` - Fetch all students
- `GET /api/admin/students/:id` - Fetch student profile
- `GET /api/admin/admins` - Fetch all admins

---

## 🚀 Getting Started

### For Admins:
1. Login with admin credentials
2. System automatically redirects to Admin Dashboard
3. Use sidebar navigation to access different management sections
4. All actions are logged and tracked

### For Developers:
1. Admin routes are defined in `/App.tsx`
2. Admin components are in `/components/Admin*.tsx`
3. Navigation is controlled by `DashboardLayout.tsx`
4. API service files are in `/lib/services/`
5. Backend integration points are documented in `/INTEGRATION_GUIDE.md`

---

## 📝 Notes for Development

1. **Authentication:** Implement proper admin role checking in backend
2. **Authorization:** Verify admin permissions for each action
3. **File Upload:** Implement secure file upload for videos and images
4. **Data Validation:** Add server-side validation for all forms
5. **Audit Logging:** Track all admin actions for accountability
6. **Notifications:** Implement real-time notifications for pending actions
7. **Search:** Add search functionality across all management pages
8. **Filters:** Implement filtering options for tables and lists
9. **Export:** Add data export functionality (CSV, PDF)
10. **Backup:** Regular backup of admin actions and changes

---

## 🔐 Security Considerations

1. Only users with `is_admin=true` in database can access admin panel
2. All admin API endpoints must verify admin role
3. Sensitive actions (delete, reject) should require confirmation
4. Admin actions should be logged for audit trail
5. File uploads should be scanned and validated
6. Rate limiting on admin actions
7. Session timeout for admin accounts
8. Two-factor authentication recommended for admin accounts

---

## ✅ Implementation Checklist

- [x] Admin Dashboard with statistics
- [x] Tutorial Management with multi-step upload
- [x] Lab Management with settings and booking approval
- [x] Equipment Management with status control
- [x] CV Review with feedback system
- [x] Profile Management for students and admins
- [x] Navigation integration in App.tsx
- [x] Sidebar navigation in DashboardLayout
- [x] Theme consistency across all pages
- [x] Responsive design
- [x] Dialog/Modal components
- [x] Form validation
- [x] Toast notifications
- [x] Loading states
- [x] Error handling

---

## 📚 Related Documentation

- `/INTEGRATION_GUIDE.md` - Backend integration guide
- `/FRONTEND_API_INTEGRATION.md` - Frontend API integration
- `/API_QUICK_REFERENCE.md` - API endpoints reference
- `/BACKEND_SETUP_DJANGO.md` - Django backend setup
- `/guidelines/Guidelines.md` - Design guidelines

---

**Version:** 1.0  
**Last Updated:** November 25, 2025  
**Status:** ✅ Complete & Ready for Backend Integration
