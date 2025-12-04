# AIU Media Hub - API Usage Examples

This document provides practical code examples for integrating the Django backend API with your React frontend components.

---

## Table of Contents

1. [Authentication Examples](#authentication-examples)
2. [Tutorial Service Examples](#tutorial-service-examples)
3. [Lab Booking Examples](#lab-booking-examples)
4. [Equipment Rental Examples](#equipment-rental-examples)
5. [Portfolio Management Examples](#portfolio-management-examples)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Loading States](#loading-states)
8. [Form Submissions](#form-submissions)

---

## Authentication Examples

### Login Component

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      
      // Check user role and redirect accordingly
      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="text-red-500">{error}</div>}
      
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

### Protected Route

```javascript
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Usage in App.tsx
<Route
  path="/student/dashboard"
  element={
    <ProtectedRoute>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>
```

### Logout Button

```javascript
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login even if API call fails
      navigate('/login');
    }
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Logout
    </Button>
  );
}
```

---

## Tutorial Service Examples

### Fetching Tutorials List

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
        const data = await getAllTutorials();
        setTutorials(data.results || data);
      } catch (err) {
        setError('Failed to load tutorials');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  if (loading) return <div>Loading tutorials...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {tutorials.map((tutorial) => (
        <div key={tutorial.id}>
          <h3>{tutorial.title}</h3>
          <p>{tutorial.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Filtering by Category

```javascript
import { useState, useEffect } from 'react';
import { getTutorialsByCategory } from '../services/tutorialService';

function CategoryTutorials({ category }) {
  const [tutorials, setTutorials] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTutorialsByCategory(category);
        setTutorials(data.results || data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  }, [category]);

  return (
    <div>
      {tutorials.map((tutorial) => (
        <TutorialCard key={tutorial.id} tutorial={tutorial} />
      ))}
    </div>
  );
}
```

### Search Functionality

```javascript
import { useState } from 'react';
import { searchTutorials } from '../services/tutorialService';
import { Input } from './components/ui/input';

function TutorialSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await searchTutorials(searchQuery);
      setResults(data.results || data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <Input
        type="search"
        placeholder="Search tutorials..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {searching && <div>Searching...</div>}
      
      {results.map((tutorial) => (
        <div key={tutorial.id}>{tutorial.title}</div>
      ))}
    </div>
  );
}
```

---

## Lab Booking Examples

### Create Booking Form

```javascript
import { useState } from 'react';
import { createBooking } from '../services/labBookingService';
import { Button } from './components/ui/button';
import { toast } from 'sonner@2.0.3';

function BookingForm() {
  const [formData, setFormData] = useState({
    lab: '',
    date: '',
    time_slot: '',
    purpose: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const booking = await createBooking(formData);
      toast.success('Booking created successfully!');
      // Reset form or redirect
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Invalid booking details. Please check your input.');
      } else {
        toast.error('Failed to create booking');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={formData.lab}
        onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
        required
      >
        <option value="">Select Lab</option>
        <option value="studio-a">Studio A</option>
        <option value="editing-suite-1">Editing Suite 1</option>
      </select>

      <input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />

      <textarea
        placeholder="Purpose"
        value={formData.purpose}
        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        required
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Book Lab'}
      </Button>
    </form>
  );
}
```

### Admin Approval Actions

```javascript
import { approveBooking, rejectBooking } from '../services/labBookingService';
import { Button } from './components/ui/button';
import { toast } from 'sonner@2.0.3';

function BookingApproval({ booking, onUpdate }) {
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const updated = await approveBooking(booking.id);
      toast.success('Booking approved');
      onUpdate(updated);
    } catch (error) {
      toast.error('Failed to approve booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    setProcessing(true);
    try {
      const updated = await rejectBooking(booking.id, reason);
      toast.success('Booking rejected');
      onUpdate(updated);
    } catch (error) {
      toast.error('Failed to reject booking');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <Button onClick={handleApprove} disabled={processing}>
        Approve
      </Button>
      <Button onClick={handleReject} disabled={processing} variant="destructive">
        Reject
      </Button>
    </div>
  );
}
```

---

## Equipment Rental Examples

### QR Code Scanner Integration

```javascript
import { useState } from 'react';
import { getEquipmentByQRCode } from '../services/equipmentService';
import QRScanner from './components/QRScanner'; // Your existing scanner component

function EquipmentScanner() {
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (qrCode) => {
    try {
      const data = await getEquipmentByQRCode(qrCode);
      setEquipment(data);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Equipment not found');
      } else {
        setError('Failed to scan equipment');
      }
    }
  };

  return (
    <div>
      <QRScanner onScan={handleScan} />
      
      {error && <div className="text-red-500">{error}</div>}
      
      {equipment && (
        <div>
          <h3>{equipment.name}</h3>
          <p>Location: {equipment.location}</p>
          <p>Status: {equipment.status}</p>
        </div>
      )}
    </div>
  );
}
```

### Rent Equipment

```javascript
import { rentEquipment } from '../services/equipmentService';
import { Button } from './components/ui/button';
import { toast } from 'sonner@2.0.3';

function RentEquipmentButton({ equipmentId }) {
  const [renting, setRenting] = useState(false);

  const handleRent = async () => {
    setRenting(true);
    
    try {
      const rental = await rentEquipment({
        equipment_id: equipmentId,
        return_date: '2025-11-20', // Or from date picker
      });
      
      toast.success('Equipment rented successfully!');
      // Update UI or redirect
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Equipment not available');
      } else {
        toast.error('Failed to rent equipment');
      }
    } finally {
      setRenting(false);
    }
  };

  return (
    <Button onClick={handleRent} disabled={renting}>
      {renting ? 'Processing...' : 'Rent Equipment'}
    </Button>
  );
}
```

---

## Portfolio Management Examples

### Fetch and Display Portfolio

```javascript
import { useEffect, useState } from 'react';
import { getMyPortfolio } from '../services/portfolioService';

function MyPortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await getMyPortfolio();
        setPortfolio(data);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  if (loading) return <div>Loading portfolio...</div>;
  if (!portfolio) return <div>No portfolio found</div>;

  return (
    <div>
      <h1>{portfolio.student_name}</h1>
      <p>{portfolio.bio}</p>
      
      <h2>Projects</h2>
      {portfolio.projects?.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### Upload Project Media

```javascript
import { useState } from 'react';
import { uploadProjectMedia } from '../services/portfolioService';
import { toast } from 'sonner@2.0.3';

function ProjectMediaUpload({ projectId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadProjectMedia(
        projectId,
        file,
        (progressValue) => {
          setProgress(progressValue);
        }
      );
      
      toast.success('File uploaded successfully!');
      onUploadComplete(result);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      {uploading && (
        <div>
          <div>Uploading... {progress}%</div>
          <progress value={progress} max="100" />
        </div>
      )}
    </div>
  );
}
```

### Generate Portfolio PDF

```javascript
import { generatePortfolioPDF } from '../services/portfolioService';
import { Button } from './components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

function DownloadPortfolioButton() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    
    try {
      await generatePortfolioPDF();
      toast.success('Portfolio downloaded!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={downloading}>
      <Download className="mr-2 h-4 w-4" />
      {downloading ? 'Generating...' : 'Download Portfolio'}
    </Button>
  );
}
```

---

## Error Handling Patterns

### Centralized Error Handler

```javascript
function useApiError() {
  const handleError = (error, defaultMessage = 'An error occurred') => {
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return data.message || 'Invalid request';
        case 401:
          return 'Please log in to continue';
        case 403:
          return 'You do not have permission to perform this action';
        case 404:
          return 'Resource not found';
        case 500:
          return 'Server error. Please try again later';
        default:
          return data.message || defaultMessage;
      }
    } else if (error.request) {
      // No response from server
      return 'Network error. Please check your connection';
    } else {
      // Other errors
      return error.message || defaultMessage;
    }
  };

  return { handleError };
}

// Usage
const { handleError } = useApiError();

try {
  await someApiCall();
} catch (error) {
  const message = handleError(error);
  toast.error(message);
}
```

---

## Loading States

### Loading Component

```javascript
function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="ml-2">{message}</span>
    </div>
  );
}

// Usage
{loading && <LoadingState message="Loading tutorials..." />}
```

### Skeleton Loader

```javascript
import { Skeleton } from './components/ui/skeleton';

function TutorialSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// Usage
{loading ? <TutorialSkeleton /> : <TutorialList tutorials={tutorials} />}
```

---

## Form Submissions

### React Hook Form Integration

```javascript
import { useForm } from 'react-hook-form@7.55.0';
import { createBooking } from '../services/labBookingService';
import { Button } from './components/ui/button';

function BookingFormAdvanced() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await createBooking(data);
      toast.success('Booking created!');
    } catch (error) {
      toast.error('Failed to create booking');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('lab', { required: 'Lab is required' })}
        placeholder="Lab name"
      />
      {errors.lab && <span>{errors.lab.message}</span>}

      <input
        type="date"
        {...register('date', { required: 'Date is required' })}
      />
      {errors.date && <span>{errors.date.message}</span>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}
```

---

This guide provides ready-to-use code examples. Copy and adapt them to your specific needs!
