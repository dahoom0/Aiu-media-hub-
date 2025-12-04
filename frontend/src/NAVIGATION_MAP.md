# AIU Media Hub - Complete Navigation Map

## 🗺️ Application Structure

```
AIU Media Hub
│
├── 🌐 PUBLIC PAGES
│   ├── Landing Page (/)
│   ├── Login Page (/login)
│   └── Signup Page (/signup)
│
├── 👨‍🎓 STUDENT PORTAL (Student Credentials Required)
│   │
│   ├── Student Dashboard (/student-dashboard)
│   │   ├── Quick stats overview
│   │   ├── Active bookings
│   │   ├── Equipment rentals
│   │   └── Recent tutorials
│   │
│   ├── Tutorials (/tutorials)
│   │   ├── Browse all tutorials
│   │   ├── Filter by category
│   │   ├── Search tutorials
│   │   └── View tutorial → Video Player Page
│   │       └── Shows linked equipment (if any)
│   │
│   ├── Lab Booking (/lab-booking)
│   │   ├── View available labs
│   │   ├── Book time slots
│   │   ├── View booking history
│   │   └── Track booking status
│   │
│   ├── Equipment Rental (/equipment-rental)
│   │   ├── Browse equipment
│   │   ├── Filter by category
│   │   ├── Request rental
│   │   ├── Scan QR codes
│   │   └── View rental history
│   │
│   ├── CV Generator (/cv-generator)
│   │   ├── Create new CV
│   │   ├── Fill in sections:
│   │   │   ├── Personal Details
│   │   │   ├── Summary
│   │   │   ├── Contact Information
│   │   │   ├── Education
│   │   │   ├── Experience
│   │   │   ├── Projects
│   │   │   ├── Certifications
│   │   │   ├── Involvement
│   │   │   ├── Skills
│   │   │   └── References
│   │   ├── Preview CV
│   │   └── View My CV (/student-cv-view)
│   │       ├── View completed CV
│   │       ├── Download CV
│   │       ├── Edit CV
│   │       └── View admin feedback
│   │
│   └── Profile & Settings
│       ├── Profile Page (/profile)
│       │   ├── View/edit profile
│       │   ├── Upload photo
│       │   └── Update information
│       └── Change Password (/change-password)
│
└── 👨‍💼 ADMIN PANEL (Admin Credentials Required ONLY)
    │
    ├── Admin Dashboard (/admin-dashboard)
    │   ├── Statistics overview
    │   ├── Pending approvals
    │   ├── Recent activity
    │   ├── Equipment status
    │   ├── Lab utilization
    │   ├── System health
    │   └── Quick access cards
    │
    ├── Tutorial Management (/admin-tutorials)
    │   ├── View all tutorials
    │   ├── Upload Tutorial (Multi-step)
    │   │   ├── Step 1: Choose source (Local/Drive/YouTube)
    │   │   ├── Step 2: Add details (Title, Description, Category)
    │   │   └── Step 3: Link equipment (if Equipment category)
    │   ├── Edit tutorials
    │   ├── Delete tutorials
    │   └── Manage tutorial status
    │
    ├── Lab Management (/admin-labs)
    │   ├── Tab 1: Lab Settings
    │   │   ├── View all labs
    │   │   ├── Add Lab
    │   │   ├── Add PC to lab
    │   │   ├── Add time slots
    │   │   └── Manage availability
    │   └── Tab 2: Booking Requests
    │       ├── View all requests
    │       ├── Filter by status
    │       ├── Approve bookings
    │       ├── Reject bookings (with reason)
    │       └── View student profile (click name)
    │
    ├── Equipment Management (/admin-equipment)
    │   ├── View all equipment
    │   ├── Add Equipment
    │   │   ├── Upload image
    │   │   ├── Enter details
    │   │   └── Set initial status
    │   ├── Edit equipment
    │   ├── Change status
    │   │   ├── Available
    │   │   ├── Rented
    │   │   └── Under Maintenance
    │   └── Delete equipment
    │
    ├── CV Review (/admin-cv-review)
    │   ├── View all student CVs
    │   ├── Filter by status
    │   ├── Click student → CV Review Page
    │   │   ├── View all CV sections
    │   │   ├── Download CV
    │   │   ├── View Student Profile
    │   │   ├── Flag CV
    │   │   ├── Add feedback comments
    │   │   └── Back to list
    │   └── Track CV approval status
    │
    ├── Profile Management (/admin-profiles)
    │   ├── Tab 1: Students
    │   │   ├── View all students
    │   │   ├── Click student → Student Profile View
    │   │   │   ├── View full details
    │   │   │   ├── View statistics
    │   │   │   ├── View CV Details → Links to CV Review
    │   │   │   └── Back to list
    │   │   └── Manage student status
    │   └── Tab 2: Admins
    │       ├── View all admins
    │       ├── Click admin → Admin Profile View
    │       │   ├── View full details
    │       │   ├── View role
    │       │   └── Back to list
    │       └── Manage admin status
    │
    └── Profile & Settings
        └── Profile Page (/profile)
            ├── View/edit admin profile
            └── Change Password (/change-password)
```

---

## 🔐 Access Control Matrix

| Page/Feature | Student Access | Admin Access | Public Access |
|--------------|----------------|--------------|---------------|
| Landing Page | ✅ | ✅ | ✅ |
| Login/Signup | ✅ | ✅ | ✅ |
| Student Dashboard | ✅ | ❌ | ❌ |
| Tutorials (View) | ✅ | ✅ | ❌ |
| Lab Booking (Request) | ✅ | ❌ | ❌ |
| Equipment Rental (Request) | ✅ | ❌ | ❌ |
| CV Generator | ✅ | ❌ | ❌ |
| Student CV View | ✅ | ❌ | ❌ |
| Admin Dashboard | ❌ | ✅ | ❌ |
| Tutorial Management | ❌ | ✅ | ❌ |
| Lab Management | ❌ | ✅ | ❌ |
| Equipment Management | ❌ | ✅ | ❌ |
| CV Review | ❌ | ✅ | ❌ |
| Profile Management | ❌ | ✅ | ❌ |
| Profile Settings | ✅ | ✅ | ❌ |

---

## 🔄 Common User Flows

### Student Journey: Booking Equipment
```
Login → Student Dashboard → Equipment Rental → 
Select Equipment → Fill Request Form → Submit → 
View Active Rentals → Receive Approval → 
Scan QR Code → Use Equipment → Return → Scan QR Code
```

### Student Journey: Creating CV
```
Login → Student Dashboard → CV Generator → 
Fill Personal Details → Add Education → Add Experience → 
Add Projects → Add Skills → Add References → 
Preview CV → Save → View My CV → 
Check Admin Feedback → Edit if needed → Download
```

### Student Journey: Booking Lab
```
Login → Student Dashboard → Lab Booking → 
Select Lab → Choose Date → Select Time Slot → 
Enter Purpose → Submit Request → 
Wait for Admin Approval → View Booking Status → 
Use Lab at Scheduled Time
```

### Student Journey: Watching Tutorials
```
Login → Student Dashboard → Tutorials → 
Browse/Search → Select Tutorial → Watch Video → 
See Linked Equipment → Click to View Equipment → 
Request Equipment Rental (if needed)
```

### Admin Journey: Approving Lab Booking
```
Login → Admin Dashboard → See Pending Approvals → 
Click on Booking → Review Details → 
Click Student Name → View Student Profile → 
Back to Booking → Approve or Reject → 
(If Reject) Enter Reason → Submit
```

### Admin Journey: Uploading Tutorial
```
Login → Admin Dashboard → Tutorial Management → 
Upload Tutorial Button → 
Step 1: Select Source (YouTube/Drive/Local) → 
Step 2: Enter Title & Description, Select Category → 
Step 3: (If Equipment Category) Link Equipment → 
Submit → Tutorial Live for Students
```

### Admin Journey: Reviewing Student CV
```
Login → Admin Dashboard → CV Review → 
View Student List → Click Student Name → 
Review All CV Sections → 
Add Feedback Comments → Flag if Needed → 
View Student Profile (optional) → 
Back to List → Next CV
```

### Admin Journey: Managing Equipment
```
Login → Admin Dashboard → Equipment Management → 
View Equipment List → Add New Equipment → 
Upload Image → Enter Details → Set Status → 
Submit → Equipment Available for Rental
```

---

## 🎯 Quick Navigation Shortcuts

### For Students:
- **Dashboard:** Click "Media Hub" logo in sidebar
- **Quick Booking:** Dashboard → Active Bookings card
- **Quick CV Access:** Sidebar → CV Generator
- **View Notifications:** Top bar → Bell icon
- **Profile:** Click avatar in sidebar
- **Logout:** Sidebar bottom → Logout button

### For Admins:
- **Dashboard:** Click "Media Hub" logo in sidebar
- **Pending Items:** Dashboard → Pending Approvals card
- **Quick Stats:** Dashboard → Top stats cards
- **Content Management:** Dashboard → Manage button
- **User Management:** Dashboard → Manage button
- **Profile:** Click avatar in sidebar
- **Logout:** Sidebar bottom → Logout button

---

## 🔗 Cross-Links Between Pages

### Tutorial ↔ Equipment
- Tutorial page shows linked equipment
- Click equipment → Go to Equipment Rental page
- Equipment page can show related tutorials

### CV Review ↔ Profile Management
- CV Review page → "View Student Profile" button
- Profile Management → "View CV Details" button

### Booking Requests ↔ Profile Management
- Booking request → Click student name → Student Profile

### Admin Dashboard ↔ All Admin Pages
- Dashboard → Quick access cards
- Dashboard → Sidebar navigation
- All pages → Back to Dashboard via sidebar

---

## 📱 Mobile Navigation Notes

On mobile devices:
- Sidebar collapses to hamburger menu
- Top bar remains accessible
- Cards stack vertically
- Tables become scrollable
- Dialogs adapt to smaller screens
- Touch-friendly button sizes
- Swipe gestures for cards (where applicable)

---

## 🎨 Visual Indicators

### Status Colors:
- 🟢 **Green/Teal:** Active, Approved, Available, Success
- 🟡 **Yellow:** Pending, Warning, Needs Attention
- 🔴 **Red:** Rejected, Error, Maintenance, Unavailable
- 🔵 **Blue/Cyan:** Info, In Progress, Selected
- ⚫ **Gray:** Inactive, Archived, Disabled

### Badges:
- Round badges show counts (notifications, pending items)
- Pill badges show status (Active, Pending, etc.)
- Gradient badges for featured items

---

## 🔍 Search Functionality

Available on all pages via top bar:
- Search tutorials by title, category
- Search equipment by name, category
- Search students by name, ID, email
- Search labs by name
- Real-time search results
- Filter integration

---

**Last Updated:** November 25, 2025  
**Version:** 1.0
