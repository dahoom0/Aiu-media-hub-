# Frontend API Integration Guide

This document explains how to use the API client and services to connect the React frontend to the Django backend.

## Setup

### 1. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the `VITE_API_BASE_URL` in `.env` to point to your Django backend:

```
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Install Axios

The API client uses Axios for HTTP requests. Install it:

```bash
npm install axios
```

---

## API Client Structure

The API integration consists of:

1. **API Client** (`/lib/apiClient.js`) - Configured Axios instance with interceptors
2. **Service Files** (`/lib/services/*.js`) - API methods organized by feature
3. **Environment Configuration** (`.env`) - Backend URL configuration

---

## Using the API Client

### Basic Import

```javascript
import { api } from './lib/apiClient';
```

### Making Requests

The API client provides convenient methods:

```javascript
// GET request
const response = await api.get('/tutorials/');

// POST request
const response = await api.post('/tutorials/', { title: 'New Tutorial' });

// PUT request
const response = await api.put('/tutorials/1/', { title: 'Updated Title' });

// PATCH request
const response = await api.patch('/tutorials/1/', { title: 'Updated Title' });

// DELETE request
const response = await api.delete('/tutorials/1/');
```

---

## Using Service Files

Service files provide organized, reusable methods for each feature. Import and use them in your components.

### Example: Fetching Tutorials

```javascript
import { useState, useEffect } from 'react';
import tutorialService from './lib/services/tutorialService';

function TutorialsPage() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        setLoading(true);
        const data = await tutorialService.getAll();
        setTutorials(data.results || data);
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {tutorials.map(tutorial => (
        <div key={tutorial.id}>
          <h3>{tutorial.title}</h3>
          <p>{tutorial.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: User Login

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './lib/services/authService';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const user = await authService.login(username, password);
      console.log('Logged in as:', user);
      
      // Redirect based on role
      if (user.is_staff) {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError('Invalid username or password');
      console.error('Login error:', err);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Student ID or Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Example: Creating a Lab Booking

```javascript
import { useState } from 'react';
import labBookingService from './lib/services/labBookingService';
import { toast } from 'sonner';

function LabBookingForm() {
  const [bookingData, setBookingData] = useState({
    lab_room: '',
    date: '',
    time_slot: '',
    purpose: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const booking = await labBookingService.create(bookingData);
      toast.success('Booking request submitted successfully!');
      console.log('Created booking:', booking);
      
      // Reset form or redirect
      setBookingData({ lab_room: '', date: '', time_slot: '', purpose: '' });
    } catch (err) {
      toast.error('Failed to create booking');
      console.error('Booking error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={bookingData.lab_room}
        onChange={(e) => setBookingData({ ...bookingData, lab_room: e.target.value })}
      >
        <option value="">Select Lab Room</option>
        <option value="Studio A">Studio A</option>
        <option value="Studio B">Studio B</option>
        <option value="Editing Suite 1">Editing Suite 1</option>
      </select>

      <input
        type="date"
        value={bookingData.date}
        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
      />

      <select
        value={bookingData.time_slot}
        onChange={(e) => setBookingData({ ...bookingData, time_slot: e.target.value })}
      >
        <option value="">Select Time Slot</option>
        <option value="09:00-11:00">09:00-11:00</option>
        <option value="11:00-13:00">11:00-13:00</option>
        <option value="14:00-16:00">14:00-16:00</option>
      </select>

      <textarea
        value={bookingData.purpose}
        onChange={(e) => setBookingData({ ...bookingData, purpose: e.target.value })}
        placeholder="Purpose of booking"
      />

      <button type="submit">Submit Booking</button>
    </form>
  );
}
```

### Example: QR Code Equipment Checkout

```javascript
import { useState } from 'react';
import equipmentService from './lib/services/equipmentService';
import QRScanner from './components/QRScanner';
import { toast } from 'sonner';

function EquipmentCheckout() {
  const [scanning, setScanning] = useState(false);

  const handleQRScan = async (qrCode) => {
    try {
      // First, get equipment details
      const equipment = await equipmentService.getByQRCode(qrCode);
      
      if (equipment.availability !== 'available') {
        toast.error('This equipment is not available');
        return;
      }

      // Checkout the equipment
      const rental = await equipmentService.checkout(qrCode, 'Studio A');
      toast.success(`Successfully checked out: ${equipment.name}`);
      console.log('Rental:', rental);
      
      setScanning(false);
    } catch (err) {
      toast.error('Failed to checkout equipment');
      console.error('Checkout error:', err);
    }
  };

  return (
    <div>
      {scanning ? (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setScanning(false)}
        />
      ) : (
        <button onClick={() => setScanning(true)}>
          Scan QR Code to Checkout
        </button>
      )}
    </div>
  );
}
```

---

## Available Services

### 1. Authentication Service (`authService.js`)

- `login(username, password)` - Log in user
- `logout()` - Log out user
- `getProfile()` - Get current user profile
- `updateProfile(data)` - Update profile
- `changePassword(oldPass, newPass)` - Change password
- `isAuthenticated()` - Check if user is logged in
- `refreshToken()` - Refresh JWT token

### 2. Tutorial Service (`tutorialService.js`)

- `getAll(params)` - Get all tutorials
- `getById(id)` - Get tutorial by ID
- `create(data)` - Create tutorial (admin)
- `update(id, data)` - Update tutorial (admin)
- `delete(id)` - Delete tutorial (admin)
- `getByCategory(category)` - Filter by category
- `search(query)` - Search tutorials

### 3. Lab Booking Service (`labBookingService.js`)

- `getAll(params)` - Get all bookings
- `getById(id)` - Get booking by ID
- `getMyBookings()` - Get current user's bookings
- `create(data)` - Create new booking
- `update(id, data)` - Update booking
- `cancel(id)` - Cancel booking
- `approve(id)` - Approve booking (admin)
- `reject(id, reason)` - Reject booking (admin)
- `getAvailableSlots(labRoom, date)` - Get available time slots
- `getPendingBookings()` - Get pending bookings (admin)

### 4. Equipment Service (`equipmentService.js`)

- `getAll(params)` - Get all equipment
- `getById(id)` - Get equipment by ID
- `getByQRCode(qrCode)` - Get equipment by QR code
- `getAvailable(type)` - Get available equipment
- `checkout(qrCode, location)` - Checkout equipment
- `return(rentalId, location)` - Return equipment
- `getMyActiveRentals()` - Get user's active rentals
- `getMyRentalHistory()` - Get rental history
- `getAllRentals(params)` - Get all rentals (admin)
- `updateLocation(id, location)` - Update equipment location
- `reportIssue(id, issue)` - Report equipment issue
- `create(data)` - Create equipment (admin)
- `update(id, data)` - Update equipment (admin)
- `delete(id)` - Delete equipment (admin)

### 5. Portfolio Service (`portfolioService.js`)

- `getMyPortfolio()` - Get current user's portfolio
- `getByStudentId(studentId)` - Get portfolio by student ID
- `updateSettings(settings)` - Update portfolio settings
- `addProject(data)` - Add project to portfolio
- `updateProject(id, data)` - Update project
- `deleteProject(id)` - Delete project
- `getMyProjects()` - Get all projects
- `reorderProjects(ids)` - Reorder projects
- `generatePreviewLink()` - Generate preview link
- `exportAsPDF()` - Export portfolio as PDF
- `getAutoSuggestions()` - Get auto-generated suggestions
- `addAutoSuggestedContent(id)` - Add suggested content
- `getStatistics()` - Get portfolio statistics

---

## Authentication Flow

The API client automatically handles JWT authentication:

1. User logs in via `authService.login()`
2. Access and refresh tokens are stored in localStorage
3. All subsequent requests automatically include the access token
4. If access token expires (401 error), the client automatically:
   - Attempts to refresh using the refresh token
   - Retries the original request
   - If refresh fails, redirects to login

---

## Error Handling

Always wrap API calls in try-catch blocks:

```javascript
try {
  const data = await tutorialService.getAll();
  // Handle success
} catch (error) {
  console.error('API Error:', error);
  
  // Check for specific error types
  if (error.response) {
    // Server responded with error status
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  } else if (error.request) {
    // Request made but no response received
    console.error('No response from server');
  } else {
    // Something else happened
    console.error('Error:', error.message);
  }
}
```

---

## File Uploads

For endpoints that accept file uploads (e.g., portfolio projects with images):

```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const projectData = {
  title: 'My Project',
  description: 'Project description',
  thumbnail: file, // File object
};

// The service automatically handles FormData conversion
const project = await portfolioService.addProject(projectData);
```

---

## Custom API Calls

If you need to make a custom API call not covered by the services:

```javascript
import { api } from './lib/apiClient';

// Custom GET request
const response = await api.get('/custom-endpoint/', {
  params: { filter: 'value' }
});

// Custom POST request with custom headers
const response = await api.post('/custom-endpoint/', data, {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

---

## Environment-Specific Configuration

Different environments can use different API URLs:

**Development (`.env.development`):**
```
VITE_API_BASE_URL=http://localhost:8000
```

**Production (`.env.production`):**
```
VITE_API_BASE_URL=https://api.aiu.edu.my
```

**Staging (`.env.staging`):**
```
VITE_API_BASE_URL=https://staging-api.aiu.edu.my
```

---

## Testing API Integration

### 1. Start the Django Backend

```bash
cd aiu-media-hub-backend
source venv/bin/activate
python manage.py runserver
```

### 2. Configure Frontend Environment

Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Test Authentication

```javascript
import authService from './lib/services/authService';

// Test login
const user = await authService.login('testuser', 'testpassword');
console.log('Logged in:', user);

// Test profile retrieval
const profile = await authService.getProfile();
console.log('Profile:', profile);
```

### 4. Test Data Fetching

```javascript
import tutorialService from './lib/services/tutorialService';

// Test fetching tutorials
const tutorials = await tutorialService.getAll();
console.log('Tutorials:', tutorials);
```

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Ensure `django-cors-headers` is installed and configured (see `DJANGO_SETTINGS_SNIPPET.py`)
2. Verify `CORS_ALLOWED_ORIGINS` in Django settings includes your React dev server URL
3. Check that `corsheaders.middleware.CorsMiddleware` is in `MIDDLEWARE`

### 401 Unauthorized Errors

1. Check if user is logged in: `authService.isAuthenticated()`
2. Verify tokens exist in localStorage: `localStorage.getItem('accessToken')`
3. Try logging in again: `authService.login(username, password)`

### Connection Refused

1. Verify Django server is running: `python manage.py runserver`
2. Check `VITE_API_BASE_URL` in `.env` matches Django server URL
3. Ensure firewall allows connections to port 8000

### 404 Not Found

1. Verify the endpoint exists in Django's `urls.py`
2. Check for typos in the URL path
3. Ensure the service method uses the correct endpoint path

---

## Next Steps

1. Review `BACKEND_SETUP_DJANGO.md` for Django backend setup
2. Review `DJANGO_SETTINGS_SNIPPET.py` for Django configuration
3. Create Django models matching the data structures used in services
4. Implement Django REST Framework views and serializers
5. Test all API endpoints using Django REST Framework's browsable API
6. Integrate API calls into existing React components

---

## Additional Resources

- [Axios Documentation](https://axios-http.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
