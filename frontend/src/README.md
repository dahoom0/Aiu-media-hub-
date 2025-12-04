# AIU Media Hub - Complete Platform

> A comprehensive media management platform for Bachelor of Media & Communication students at Albukhary International University

[![Status](https://img.shields.io/badge/Status-Frontend_Complete-success)](/)
[![Version](https://img.shields.io/badge/Version-1.0-blue)](/)
[![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan)](https://tailwindcss.com/)

---

## 🌟 Overview

AIU Media Hub is a modern web application that combines:
- 📹 **Tutorial Videos** - Educational content library
- 🏢 **Lab Booking** - Studio and equipment room reservations
- 📦 **Equipment Rental** - QR-based equipment checkout system
- 📄 **Digital Portfolio** - Auto-generated CV/resume builder
- 👨‍💼 **Admin Panel** - Complete management system

---

## ✨ Features

### For Students
- 📚 Browse and watch tutorial videos
- 🔖 Book labs and studios with admin approval
- 📸 Rent equipment using QR codes
- 📝 Create professional CVs/portfolios
- 👤 Manage profile and settings
- 🌓 Light/Dark theme support

### For Admins (Admin Credentials Required)
- 📊 Dashboard with statistics and insights
- 🎥 Upload and manage tutorial content
- 🏢 Manage labs, PCs, and time slots
- ✅ Approve/reject booking requests
- 📦 Manage equipment inventory
- 📄 Review student CVs and provide feedback
- 👥 Manage student and admin profiles

---

## 🎨 Design Philosophy

- **Clean & Minimal:** Academic aesthetic with modern touch
- **Accessible:** Clear typography and visual hierarchy
- **Consistent:** Unified design system throughout
- **Responsive:** Works on desktop, tablet, and mobile
- **Professional:** University-grade quality
- **Practical:** Built for real-world implementation

### Color Palette
- **Primary:** Teal (#14B8A6) to Cyan (#06B6D4) gradient
- **Light Mode:** #EBF2FA background, white cards
- **Dark Mode:** Gray-950 background, dark cards
- **Accents:** Success (Teal), Warning (Yellow), Error (Red)

---

## 🚀 Quick Start

### Prerequisites
```bash
- Node.js 18+ 
- npm or yarn
- Modern web browser
```

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Navigate to project directory
cd aiu-media-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the Application
```
Local: http://localhost:5173
```

### Login Credentials (Demo)

**Student Account:**
```
Email: john@aiu.edu.my
Password: student123
```

**Admin Account:**
```
Email: admin@aiu.edu.my
Password: admin123
```

---

## 📁 Project Structure

```
/
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   ├── figma/                  # Figma-specific components
│   ├── LandingPage.tsx         # Public landing page
│   ├── LoginPage.tsx           # Authentication
│   ├── SignupPage.tsx          # Registration
│   ├── DashboardLayout.tsx     # Shared layout
│   │
│   ├── Student Components
│   ├── StudentDashboard.tsx    # Student overview
│   ├── TutorialsPage.tsx       # Tutorial browser
│   ├── LabBookingPage.tsx      # Lab reservations
│   ├── EquipmentRentalPage.tsx # Equipment rental
│   ├── CVGeneratorPage.tsx     # CV builder
│   ├── StudentCVView.tsx       # CV viewer
│   ├── ProfilePage.tsx         # User profile
│   │
│   └── Admin Components (Admin Only)
│       ├── AdminDashboard.tsx           # Admin overview
│       ├── AdminTutorialManagement.tsx  # Tutorial CRUD
│       ├── AdminLabManagement.tsx       # Lab management
│       ├── AdminEquipmentManagement.tsx # Equipment CRUD
│       ├── AdminCVReview.tsx            # CV review system
│       └── AdminProfileManagement.tsx   # User management
│
├── lib/                        # Utilities and services
│   ├── services/               # API service modules
│   │   ├── authService.js
│   │   ├── tutorialService.js
│   │   ├── labBookingService.js
│   │   ├── equipmentService.js
│   │   └── portfolioService.js
│   └── apiClient.js           # API client setup
│
├── styles/                     # Global styles
│   └── globals.css            # Tailwind + custom CSS
│
├── Documentation Files
├── ADMIN_PANEL_GUIDE.md       # Complete admin documentation
├── NAVIGATION_MAP.md          # Navigation structure
├── ADMIN_TESTING_GUIDE.md     # Testing procedures
├── ADMIN_QUICK_REFERENCE.md   # Developer reference
├── ADMIN_PANEL_SUMMARY.md     # Implementation summary
├── INTEGRATION_GUIDE.md       # Backend integration
├── API_QUICK_REFERENCE.md     # API endpoints
├── BACKEND_SETUP_DJANGO.md    # Django setup guide
│
└── App.tsx                    # Main application component
```

---

## 🗺️ Navigation Map

### Public Pages
```
/ (Landing) → /login or /signup
```

### Student Portal (Authenticated)
```
/student-dashboard
  ├── /tutorials
  ├── /lab-booking
  ├── /equipment-rental
  ├── /cv-generator
  │   └── /student-cv-view
  └── /profile
      └── /change-password
```

### Admin Panel (Admin Only)
```
/admin-dashboard
  ├── /admin-tutorials
  ├── /admin-labs
  ├── /admin-equipment
  ├── /admin-cv-review
  ├── /admin-profiles
  └── /profile
      └── /change-password
```

---

## 🔐 Security

### Access Control
- ✅ Student pages require student authentication
- ✅ Admin pages require admin authentication
- ✅ Role-based access control enforced
- ✅ Protected routes
- ✅ Session management

### Best Practices
- Input validation on all forms
- XSS protection
- CSRF protection (backend)
- Secure file uploads
- Rate limiting (backend)
- Audit logging for admin actions

---

## 📚 Documentation

### For Administrators
- **[Admin Panel Guide](ADMIN_PANEL_GUIDE.md)** - Complete feature documentation
- **[Testing Guide](ADMIN_TESTING_GUIDE.md)** - How to test admin features
- **[Navigation Map](NAVIGATION_MAP.md)** - System navigation structure

### For Developers
- **[Quick Reference](ADMIN_QUICK_REFERENCE.md)** - Code snippets and patterns
- **[Integration Guide](INTEGRATION_GUIDE.md)** - Backend integration
- **[API Reference](API_QUICK_REFERENCE.md)** - API endpoints
- **[Backend Setup](BACKEND_SETUP_DJANGO.md)** - Django configuration

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4.0** - Styling
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **Vite** - Build tool

### UI Components
- Custom component library
- Dialog/Modal system
- Form components
- Table components
- Badge components
- Card layouts

### State Management
- React hooks (useState, useEffect)
- Context API (ThemeProvider)
- Local component state

---

## 🎯 Key Features Detail

### 1. Tutorial System
- Video player integration
- Category filtering
- Search functionality
- Tutorial-equipment linking
- View count tracking
- YouTube, Google Drive, Local video support

### 2. Lab Booking System
- Calendar-based booking
- Time slot selection
- Admin approval workflow
- Booking history
- Status tracking (Pending/Approved/Rejected)

### 3. Equipment Rental
- QR code scanning
- Equipment categories
- Availability tracking
- Rental history
- Status management (Available/Rented/Maintenance)

### 4. CV Generator
Complete sections:
- Personal details
- Professional summary
- Contact information
- Education history
- Work experience
- Projects portfolio
- Certifications
- Involvement/Activities
- Skills (Technical, Soft, Languages)
- **References** (Name, Position, Workplace, Phone, Email)

Features:
- Preview before saving
- Download as PDF
- Admin feedback integration
- Edit capabilities

### 5. Admin Dashboard
- Real-time statistics
- Pending approvals overview
- Recent activity feed
- Equipment status
- Lab utilization
- System health monitoring

### 6. Tutorial Management (Admin)
Multi-step upload:
1. Choose source (Local/Drive/YouTube)
2. Enter details (Title, Description, Category)
3. Link equipment (if Equipment category)

Features:
- Edit tutorials
- Delete tutorials
- Status management
- View statistics

### 7. Lab Management (Admin)
**Lab Settings Tab:**
- Add/edit labs
- Add PCs to labs
- Manage time slots
- Control availability

**Booking Requests Tab:**
- View all requests
- Approve bookings
- Reject with reason
- View student profiles

### 8. Equipment Management (Admin)
- Add equipment with images
- Edit equipment details
- Change status (Available/Rented/Maintenance)
- Category management
- Equipment tracking

### 9. CV Review (Admin)
- View all student CVs
- Review complete CV sections
- Download CVs
- Add feedback comments
- Flag CVs for attention
- Link to student profiles

### 10. Profile Management (Admin)
**Students Tab:**
- View all students
- Student profile details
- Activity statistics
- Link to CV review

**Admins Tab:**
- View all admins
- Admin profile details
- Role management

---

## 📱 Responsive Design

### Desktop (1024px+)
- Full sidebar navigation
- Multi-column layouts
- Optimized for productivity

### Tablet (768px - 1023px)
- Collapsible sidebar
- Adaptive card layouts
- Touch-friendly controls

### Mobile (< 768px)
- Hamburger menu
- Stacked layouts
- Mobile-optimized forms
- Touch-friendly buttons

---

## 🌓 Theme System

### Light Mode (Default)
- Background: #EBF2FA
- Cards: White with subtle shadows
- Text: Dark gray for readability
- Professional daytime aesthetic

### Dark Mode
- Background: Dark gradient
- Cards: Dark with borders
- Text: Light for contrast
- Reduced eye strain

**Toggle:** Sun/Moon icon in header

---

## 🔌 Backend Integration

### API Endpoints

**Authentication:**
```
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
GET  /api/auth/user
```

**Tutorials:**
```
GET    /api/tutorials
GET    /api/tutorials/:id
POST   /api/admin/tutorials
PUT    /api/admin/tutorials/:id
DELETE /api/admin/tutorials/:id
POST   /api/admin/tutorials/:id/link-equipment
```

**Lab Bookings:**
```
GET  /api/bookings
POST /api/bookings
GET  /api/admin/bookings
PUT  /api/admin/bookings/:id/approve
PUT  /api/admin/bookings/:id/reject
```

**Equipment:**
```
GET    /api/equipment
GET    /api/equipment/:id
POST   /api/admin/equipment
PUT    /api/admin/equipment/:id
DELETE /api/admin/equipment/:id
PUT    /api/admin/equipment/:id/status
```

**CVs:**
```
GET  /api/cvs/:studentId
POST /api/cvs
PUT  /api/cvs/:studentId
GET  /api/admin/cvs
POST /api/admin/cvs/:studentId/feedback
PUT  /api/admin/cvs/:studentId/flag
```

See [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) for complete documentation.

---

## 🧪 Testing

### Manual Testing
See [ADMIN_TESTING_GUIDE.md](ADMIN_TESTING_GUIDE.md) for:
- Complete test cases
- Step-by-step instructions
- Expected results
- Bug reporting template

### Test Coverage
- ✅ All admin features
- ✅ All student features
- ✅ Theme switching
- ✅ Responsive layouts
- ✅ Form validation
- ✅ Navigation flows
- ✅ Access control

---

## 📈 Development Status

| Component | Status | Notes |
|-----------|--------|-------|
| Landing Page | ✅ Complete | Public access |
| Authentication | ✅ Complete | Login/Signup |
| Student Dashboard | ✅ Complete | Overview page |
| Tutorials | ✅ Complete | Video library |
| Lab Booking | ✅ Complete | Reservation system |
| Equipment Rental | ✅ Complete | QR-based rental |
| CV Generator | ✅ Complete | With References |
| Student CV View | ✅ Complete | With admin feedback |
| Profile Management | ✅ Complete | Student settings |
| Admin Dashboard | ✅ Complete | Statistics & overview |
| Tutorial Management | ✅ Complete | Multi-step upload |
| Lab Management | ✅ Complete | Settings & approvals |
| Equipment Management | ✅ Complete | CRUD & status |
| CV Review | ✅ Complete | Review & feedback |
| Profile Management (Admin) | ✅ Complete | User management |
| Theme System | ✅ Complete | Light/Dark mode |
| Responsive Design | ✅ Complete | All devices |
| Documentation | ✅ Complete | Comprehensive |
| **Backend** | ⏳ Pending | Ready for integration |

---

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to hosting (Vercel, Netlify, etc.)
```

### Backend Setup
See [BACKEND_SETUP_DJANGO.md](BACKEND_SETUP_DJANGO.md) for Django configuration.

---

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards
- Use TypeScript for type safety
- Follow existing component patterns
- Maintain design consistency
- Write clear comments
- Test thoroughly

---

## 📝 License

This project is proprietary software for Albukhary International University.

---

## 👥 Team

**Developed for:** Albukhary International University  
**Department:** Bachelor of Media & Communication  
**Version:** 1.0  
**Date:** November 25, 2025

---

## 📞 Support

### Documentation
- [Admin Panel Guide](ADMIN_PANEL_GUIDE.md)
- [Navigation Map](NAVIGATION_MAP.md)
- [Testing Guide](ADMIN_TESTING_GUIDE.md)
- [Quick Reference](ADMIN_QUICK_REFERENCE.md)
- [Integration Guide](INTEGRATION_GUIDE.md)

### Contact
For technical support or questions, please contact the development team.

---

## 🎉 Acknowledgments

- React team for the excellent framework
- Tailwind CSS for the styling system
- Lucide for the icon library
- All contributors and testers

---

## 📋 Changelog

### Version 1.0 (November 25, 2025)
- ✅ Complete frontend implementation
- ✅ All student features
- ✅ Complete admin panel (6 sections)
- ✅ Theme system (light/dark)
- ✅ Responsive design
- ✅ Comprehensive documentation
- ✅ Ready for backend integration

---

**Status:** ✅ Frontend Complete | ⏳ Backend Integration Pending

**Ready for Production!** (after backend setup) 🚀
