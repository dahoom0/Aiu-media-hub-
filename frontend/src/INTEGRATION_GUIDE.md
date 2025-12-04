# AIU Media Hub - Frontend-Backend Integration Guide

This guide explains how the React frontend connects to the Django REST backend.

---

## Quick Start

### 1. Backend Setup

Follow the instructions in `BACKEND_SETUP_DJANGO.md` to set up the Django backend.

### 2. Frontend Configuration

Create a `.env.local` file in the frontend root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your backend URL:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Start Both Servers

**Backend (Terminal 1):**
```bash
cd aiu-media-hub-backend
source venv/bin/activate
python manage.py runserver
```

**Frontend (Terminal 2):**
```bash
cd aiu-media-hub-frontend
npm install  # or yarn install
npm run dev  # or yarn dev
```

The frontend will be available at `http://localhost:5173` and will connect to the backend at `http://localhost:8000`.

---

## Architecture Overview

### Frontend (React + Vite)
- **Port:** 5173 (default Vite dev server)
- **Tech Stack:** React, TailwindCSS, shadcn/ui
- **API Client:** Axios (`src/lib/apiClient.js`)

### Backend (Django REST Framework)
- **Port:** 8000 (default Django dev server)
- **Tech Stack:** Django, Django REST Framework, MySQL
- **CORS:** Configured to allow requests from frontend

---

## API Client Architecture

### Base API Client (`src/lib/apiClient.js`)

The API client is a configured Axios instance that:

1. **Reads base URL from environment variables**
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
   ```

2. **Automatically adds authentication headers**
   ```javascript
   // Request interceptor adds Bearer token
   const token = localStorage.getItem('auth_token');
   if (token) {
     config.headers.Authorization = `Bearer ${token}`;
   }
   ```

3. **Handles errors globally**
   - 401: Unauthorized (redirects to login)
   - 403: Forbidden (permission denied)
   - 404: Not found
   - 500: Server error

4. **Supports file uploads and downloads**
   - `uploadFile()` helper for multipart/form-data
   - `downloadFile()` helper for binary responses

### Service Layer

Each feature has a dedicated service file that uses the API client:

- **`authService.js`** - Authentication (login, register, logout)
- **`tutorialService.js`** - Tutorial videos
- **`labBookingService.js`** - Lab booking and approval
- **`equipmentService.js`** - Equipment rental and QR codes
- **`portfolioService.js`** - Student portfolios and projects

### Example Usage in Components

```javascript
import { useEffect, useState } from 'react';
import { getAllTutorials } from '../services/tutorialService';

function TutorialsPage() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const data = await getAllTutorials({ category: 'editing' });
        setTutorials(data.results || data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
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
        <div key={tutorial.id}>{tutorial.title}</div>
      ))}
    </div>
  );
}
```

---

## API Endpoint Structure

All API endpoints follow Django REST Framework conventions:

### Tutorials
- `GET /api/tutorials/` - List all tutorials
- `GET /api/tutorials/:id/` - Get single tutorial
- `POST /api/tutorials/` - Create tutorial (admin)
- `PUT /api/tutorials/:id/` - Update tutorial (admin)
- `DELETE /api/tutorials/:id/` - Delete tutorial (admin)

### Lab Bookings
- `GET /api/lab-bookings/` - List all bookings
- `GET /api/lab-bookings/my-bookings/` - Get user's bookings
- `POST /api/lab-bookings/` - Create booking
- `POST /api/lab-bookings/:id/approve/` - Approve booking (admin)
- `POST /api/lab-bookings/:id/reject/` - Reject booking (admin)
- `POST /api/lab-bookings/:id/cancel/` - Cancel booking

### Equipment
- `GET /api/equipment/` - List all equipment
- `GET /api/equipment/:id/` - Get single equipment
- `GET /api/equipment/by-qr/?qr_code=XXX` - Get by QR code
- `POST /api/equipment/rent/` - Rent equipment
- `POST /api/equipment/rentals/:id/return/` - Return equipment
- `GET /api/equipment/rentals/my-rentals/` - Get user's rentals

### Portfolios
- `GET /api/portfolios/my-portfolio/` - Get user's portfolio
- `PUT /api/portfolios/my-portfolio/` - Update portfolio
- `GET /api/portfolios/:id/projects/` - Get portfolio projects
- `POST /api/portfolios/projects/` - Create project
- `POST /api/portfolios/projects/media/` - Upload project media
- `GET /api/portfolios/my-portfolio/generate-pdf/` - Generate PDF

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/register/` - Register
- `GET /api/auth/user/` - Get current user
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh JWT token

---

## Authentication Flow

### Session-Based Auth (Default)

1. User submits login form
2. Frontend calls `authService.login(email, password)`
3. Backend validates credentials and creates session
4. Backend sets session cookie (httpOnly)
5. All subsequent requests include session cookie automatically

### JWT Auth (Alternative)

1. User submits login form
2. Frontend calls `authService.login(email, password)`
3. Backend returns access and refresh tokens
4. Frontend stores tokens in localStorage
5. API client adds `Authorization: Bearer <token>` to all requests
6. When access token expires, call `authService.refreshAccessToken()`

---

## CORS Configuration

The Django backend must allow requests from the React frontend.

In Django `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative
]

CORS_ALLOW_CREDENTIALS = True
```

See `BACKEND_CONFIG_SAMPLE.py` for complete configuration.

---

## Error Handling

### Service Level

Each service function wraps API calls in try-catch:

```javascript
export const getTutorialById = async (id) => {
  try {
    const response = await apiClient.get(`/tutorials/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tutorial ${id}:`, error);
    throw error;  // Re-throw for component to handle
  }
};
```

### Component Level

Components should handle errors from services:

```javascript
try {
  const data = await getTutorialById(id);
  setTutorial(data);
} catch (error) {
  if (error.response?.status === 404) {
    setError('Tutorial not found');
  } else if (error.response?.status === 401) {
    // Redirect to login
    navigate('/login');
  } else {
    setError('Failed to load tutorial');
  }
}
```

### Global Error Handling

The API client interceptor handles common errors globally:

- **401 Unauthorized:** Clears auth tokens, redirects to login
- **403 Forbidden:** Shows permission error
- **500 Server Error:** Shows generic error message

---

## File Uploads

### Uploading Files

Use the `uploadFile()` helper or services like `uploadProjectMedia()`:

```javascript
import { uploadProjectMedia } from '../services/portfolioService';

const handleFileUpload = async (file) => {
  try {
    const result = await uploadProjectMedia(
      projectId, 
      file,
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    );
    console.log('Upload complete:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Django Backend

Ensure your Django model has a FileField or ImageField:

```python
class ProjectMedia(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    file = models.FileField(upload_to='portfolios/projects/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

And configure media settings in `settings.py`:

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

---

## Development Workflow

### 1. Create Django Model

```python
# tutorials/models.py
class Tutorial(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50)
    # ... other fields
```

### 2. Create Serializer

```python
# tutorials/serializers.py
class TutorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tutorial
        fields = '__all__'
```

### 3. Create ViewSet

```python
# tutorials/views.py
class TutorialViewSet(viewsets.ModelViewSet):
    queryset = Tutorial.objects.all()
    serializer_class = TutorialSerializer
```

### 4. Register URL

```python
# urls.py
router = DefaultRouter()
router.register(r'tutorials', TutorialViewSet)
```

### 5. Create/Update Frontend Service

```javascript
// src/services/tutorialService.js
export const getAllTutorials = async () => {
  const response = await apiClient.get('/tutorials/');
  return response.data;
};
```

### 6. Use in Component

```javascript
import { getAllTutorials } from '../services/tutorialService';

const { data } = await getAllTutorials();
```

---

## Testing API Endpoints

### Using Django REST Framework Browsable API

Visit `http://localhost:8000/api/` in your browser to see the browsable API interface.

### Using cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@aiu.edu.my","password":"password123"}'

# Get tutorials
curl http://localhost:8000/api/tutorials/

# Create booking (with auth token)
curl -X POST http://localhost:8000/api/lab-bookings/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"lab":"Studio A","date":"2025-11-15","time_slot":"10:00-12:00"}'
```

### Using Postman

1. Import endpoints from `http://localhost:8000/api/?format=openapi`
2. Set base URL to `http://localhost:8000/api`
3. Add Authorization header if needed

---

## Production Deployment

### Frontend

1. Build the React app:
   ```bash
   npm run build
   ```

2. Set production API URL in `.env.production`:
   ```env
   VITE_API_BASE_URL=https://api.aiuapp.aiu.edu.my/api
   ```

3. Deploy `dist/` folder to hosting (Vercel, Netlify, etc.)

### Backend

1. Update Django settings for production:
   ```python
   DEBUG = False
   ALLOWED_HOSTS = ['api.aiuapp.aiu.edu.my']
   CORS_ALLOWED_ORIGINS = ['https://aiuapp.aiu.edu.my']
   ```

2. Use environment variables for sensitive data
3. Set up proper database (MySQL in production)
4. Configure static and media file serving
5. Use a production server (Gunicorn, uWSGI)
6. Set up SSL/HTTPS

---

## Troubleshooting

### CORS Errors

**Problem:** Browser blocks requests with CORS error

**Solution:**
- Check `CORS_ALLOWED_ORIGINS` in Django settings
- Ensure `corsheaders` middleware is installed and configured
- Verify frontend URL matches exactly (including port)

### 401 Unauthorized

**Problem:** All API requests return 401

**Solution:**
- Check if auth token is stored in localStorage
- Verify token is not expired
- Check if API client interceptor is adding Authorization header
- Try logging in again

### Connection Refused

**Problem:** Frontend can't connect to backend

**Solution:**
- Ensure Django server is running (`python manage.py runserver`)
- Check `VITE_API_BASE_URL` in `.env.local`
- Verify Django is running on correct port (default 8000)
- Check firewall settings

### 404 Not Found

**Problem:** API endpoint returns 404

**Solution:**
- Check URL pattern in Django urls.py
- Verify endpoint path in service file
- Check trailing slash (DRF requires trailing slashes by default)
- Visit `http://localhost:8000/api/` to see available endpoints

---

## Additional Resources

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
