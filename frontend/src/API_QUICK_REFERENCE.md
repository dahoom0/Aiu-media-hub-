# API Integration Quick Reference

This is a quick reference guide for developers working on the AIU Media Hub frontend.

## 🚀 Quick Start

1. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set VITE_API_BASE_URL=http://localhost:8000
   ```

2. **Install dependencies:**
   ```bash
   npm install axios
   ```

3. **Import and use services:**
   ```javascript
   import { authService, tutorialService } from './lib/services';
   
   // Login
   const user = await authService.login('username', 'password');
   
   // Fetch data
   const tutorials = await tutorialService.getAll();
   ```

---

## 📁 File Structure

```
/lib/
├── apiClient.js              # Axios instance with auth interceptors
└── services/
    ├── index.js              # Service exports (for clean imports)
    ├── authService.js        # Authentication & user management
    ├── tutorialService.js    # Tutorial videos
    ├── labBookingService.js  # Lab room bookings
    ├── equipmentService.js   # Equipment rental & QR codes
    └── portfolioService.js   # Student portfolios
```

---

## 🔐 Authentication

```javascript
import { authService } from './lib/services';

// Login
const user = await authService.login('S2023001', 'password');

// Check if logged in
if (authService.isAuthenticated()) {
  // User is logged in
}

// Get current user
const profile = await authService.getProfile();

// Logout
authService.logout();
```

**Tokens are stored automatically in localStorage and included in all requests.**

---

## 📚 Common Use Cases

### Fetch and Display Tutorials

```javascript
import { useState, useEffect } from 'react';
import { tutorialService } from './lib/services';

const [tutorials, setTutorials] = useState([]);

useEffect(() => {
  tutorialService.getAll().then(setTutorials).catch(console.error);
}, []);
```

### Create Lab Booking

```javascript
import { labBookingService } from './lib/services';
import { toast } from 'sonner';

const handleSubmit = async (bookingData) => {
  try {
    await labBookingService.create(bookingData);
    toast.success('Booking submitted!');
  } catch (error) {
    toast.error('Booking failed');
  }
};
```

### QR Code Equipment Checkout

```javascript
import { equipmentService } from './lib/services';

const handleQRScan = async (qrCode) => {
  try {
    const equipment = await equipmentService.getByQRCode(qrCode);
    const rental = await equipmentService.checkout(qrCode, 'Studio A');
    toast.success(`Checked out: ${equipment.name}`);
  } catch (error) {
    toast.error('Checkout failed');
  }
};
```

### Add Portfolio Project

```javascript
import { portfolioService } from './lib/services';

const handleAddProject = async (formData) => {
  try {
    const project = await portfolioService.addProject({
      title: formData.title,
      description: formData.description,
      thumbnail: formData.file, // File object from input
    });
    toast.success('Project added!');
  } catch (error) {
    toast.error('Failed to add project');
  }
};
```

---

## 🛠️ Error Handling

Always use try-catch blocks:

```javascript
try {
  const data = await tutorialService.getAll();
  // Success
} catch (error) {
  if (error.response) {
    // Server error (4xx, 5xx)
    console.error('Server error:', error.response.status);
    console.error('Message:', error.response.data);
  } else if (error.request) {
    // No response from server
    console.error('No response from server');
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```

---

## 📋 Service Methods Cheat Sheet

### authService
- `login(username, password)` - Log in
- `logout()` - Log out and redirect
- `getProfile()` - Get current user
- `updateProfile(data)` - Update profile
- `isAuthenticated()` - Check login status

### tutorialService
- `getAll(params)` - List all tutorials
- `getById(id)` - Get single tutorial
- `getByCategory(category)` - Filter by category
- `search(query)` - Search tutorials
- `create(data)` - Create tutorial (admin)
- `update(id, data)` - Update tutorial (admin)
- `delete(id)` - Delete tutorial (admin)

### labBookingService
- `getAll(params)` - List all bookings
- `getMyBookings()` - Current user's bookings
- `create(data)` - Create booking
- `cancel(id)` - Cancel booking
- `approve(id)` - Approve (admin)
- `reject(id, reason)` - Reject (admin)
- `getAvailableSlots(room, date)` - Check availability

### equipmentService
- `getAll(params)` - List equipment
- `getByQRCode(qrCode)` - Find by QR code
- `getAvailable(type)` - Available equipment
- `checkout(qrCode, location)` - Checkout equipment
- `return(rentalId, location)` - Return equipment
- `getMyActiveRentals()` - User's active rentals
- `reportIssue(id, issue)` - Report problem

### portfolioService
- `getMyPortfolio()` - Get user's portfolio
- `updateSettings(settings)` - Update portfolio
- `addProject(data)` - Add project
- `updateProject(id, data)` - Update project
- `deleteProject(id)` - Delete project
- `exportAsPDF()` - Export as PDF
- `getAutoSuggestions()` - Get AI suggestions

---

## 🌐 API Endpoints Reference

All endpoints are relative to `VITE_API_BASE_URL` + `/api/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/token/` | POST | Login (get JWT tokens) |
| `/token/refresh/` | POST | Refresh access token |
| `/auth/profile/` | GET, PATCH | User profile |
| `/tutorials/` | GET, POST | Tutorials list |
| `/tutorials/{id}/` | GET, PATCH, DELETE | Single tutorial |
| `/lab-bookings/` | GET, POST | Lab bookings |
| `/lab-bookings/{id}/` | GET, PATCH | Single booking |
| `/lab-bookings/{id}/approve/` | POST | Approve booking (admin) |
| `/lab-bookings/{id}/reject/` | POST | Reject booking (admin) |
| `/equipment/` | GET, POST | Equipment list |
| `/equipment/{id}/` | GET, PATCH, DELETE | Single equipment |
| `/equipment/by-qr-code/` | GET | Find by QR code |
| `/equipment-rentals/` | GET, POST | Rentals list |
| `/equipment-rentals/{id}/return/` | POST | Return equipment |
| `/portfolio/my-portfolio/` | GET | User's portfolio |
| `/portfolio/projects/` | GET, POST | Portfolio projects |
| `/portfolio/projects/{id}/` | PATCH, DELETE | Single project |

---

## 🔧 Environment Variables

Create `.env` file in project root:

```env
# Required
VITE_API_BASE_URL=http://localhost:8000

# For production
# VITE_API_BASE_URL=https://api.aiu.edu.my
```

**Note:** After changing `.env`, restart the Vite dev server.

---

## ⚠️ Important Notes

1. **Authentication is automatic** - Tokens are stored and sent automatically
2. **CORS must be configured** in Django settings (see DJANGO_SETTINGS_SNIPPET.py)
3. **Token refresh is automatic** - Access tokens auto-refresh when expired
4. **File uploads** work automatically - Just pass File objects
5. **All requests timeout after 10 seconds** - Configurable in apiClient.js

---

## 🐛 Common Issues

**Problem:** CORS errors
- **Solution:** Check Django `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173`

**Problem:** 401 Unauthorized
- **Solution:** User needs to log in: `authService.login(username, password)`

**Problem:** Connection refused
- **Solution:** Start Django server: `python manage.py runserver`

**Problem:** Module not found
- **Solution:** Install axios: `npm install axios`

---

## 📖 Full Documentation

- **Complete guide:** See `FRONTEND_API_INTEGRATION.md`
- **Backend setup:** See `BACKEND_SETUP_DJANGO.md`
- **Django config:** See `DJANGO_SETTINGS_SNIPPET.py`

---

## 💡 Tips

1. **Use destructuring for multiple services:**
   ```javascript
   import { authService, tutorialService, labBookingService } from './lib/services';
   ```

2. **Create custom hooks for common patterns:**
   ```javascript
   function useTutorials() {
     const [tutorials, setTutorials] = useState([]);
     useEffect(() => {
       tutorialService.getAll().then(setTutorials);
     }, []);
     return tutorials;
   }
   ```

3. **Centralize error handling:**
   ```javascript
   const handleError = (error) => {
     if (error.response?.status === 401) {
       authService.logout();
     } else {
       toast.error('Something went wrong');
     }
   };
   ```

4. **Use loading states:**
   ```javascript
   const [loading, setLoading] = useState(false);
   try {
     setLoading(true);
     const data = await tutorialService.getAll();
   } finally {
     setLoading(false);
   }
   ```

---

## 🚦 Development Workflow

1. Start Django backend:
   ```bash
   cd aiu-media-hub-backend
   source venv/bin/activate
   python manage.py runserver
   ```

2. Start React frontend:
   ```bash
   npm run dev
   ```

3. Access:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/
   - Django Admin: http://localhost:8000/admin/

---

**Questions?** Check the full documentation files or contact the development team.
