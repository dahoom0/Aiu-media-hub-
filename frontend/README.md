# AIU Media Hub - Frontend

This is the React frontend for the AIU Media Hub system.

## 🚀 Quick Start

**For complete deployment instructions, see the main [README.md](../README.md) in the project root.**

## Development

### Prerequisites
- Node.js 20+
- npm

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

## 🐳 Docker Deployment

The frontend is automatically deployed as part of the Docker setup. 

**See [../README.md](../README.md) for complete deployment instructions.**

### Frontend Container Details
- **Build**: Multi-stage (Node.js 20 + Nginx Alpine)
- **Port**: 80 (HTTP)
- **Server**: Nginx
- **Access**: http://localhost

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # Shadcn/ui components
│   │   ├── figma/      # Figma-generated components
│   │   └── ...         # Feature components
│   ├── services/        # API services
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── Dockerfile          # Docker configuration
├── nginx.conf          # Nginx configuration
└── package.json        # Dependencies
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## 🎨 Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn/ui** - UI components
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## 🌐 API Integration

The frontend communicates with the Django backend via REST API:

```typescript
// API base URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Example API call
import apiClient from './services/apiClient';
const response = await apiClient.get('/api/endpoint/');
```

## 🎯 Features

### Student Features
- User registration and authentication
- Lab booking system
- Equipment rental management
- CV generator with templates
- Tutorial video library
- Profile management

### Admin Features
- Dashboard with analytics
- Booking approval system
- Equipment management
- CV review and approval
- Tutorial management
- User management
- System usage reports

## 🔧 Development Tips

### Hot Module Replacement (HMR)
Vite provides fast HMR for instant feedback during development.

### Component Development
```bash
# Components are organized by feature
src/components/
├── AdminDashboard.tsx
├── StudentDashboard.tsx
├── LabBookingPage.tsx
├── EquipmentRentalPage.tsx
└── ...
```

### API Services
```bash
# API services are in src/services/
src/services/
├── apiClient.ts          # Axios instance
├── authService.ts        # Authentication
├── labBookingService.ts  # Lab bookings
├── equipmentService.ts   # Equipment rentals
└── ...
```

## 🐳 Docker Build

The frontend uses a multi-stage Docker build:

### Stage 1: Build
```dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
```

### Stage 2: Serve
```dockerfile
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## 📦 Building for Production

### Local Build
```bash
npm run build
# Output: dist/ folder
```

### Docker Build
```bash
# From project root
docker-compose build frontend

# Or rebuild everything
docker-compose up -d --build
```

## 🔍 Troubleshooting

### Development Server Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Build Issues
```bash
# Check for TypeScript errors
npm run build

# Check for linting errors
npm run lint
```

### Docker Issues
```bash
# View frontend logs
docker-compose logs frontend

# Rebuild frontend container
docker-compose up -d --build frontend

# Access frontend container
docker-compose exec frontend sh
```

## 🌐 Nginx Configuration

The production build uses Nginx with custom configuration:

```nginx
# Serves static files
# Proxies API requests to backend
# Handles client-side routing
```

See `nginx.conf` for full configuration.

## 📱 Responsive Design

The application is fully responsive:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

## 🎨 Theming

The application supports light and dark themes:

```typescript
import { useTheme } from './components/ThemeProvider';

const { theme, toggleTheme } = useTheme();
```

## 📚 Additional Resources

- **Main README**: [../README.md](../README.md) - Complete deployment guide
- **Docker Guide**: [../DOCKER_DEPLOYMENT_GUIDE.md](../DOCKER_DEPLOYMENT_GUIDE.md)
- **API Documentation**: Backend API endpoints

## 🆘 Getting Help

1. Check the main [README.md](../README.md)
2. Review [DOCKER_DEPLOYMENT_GUIDE.md](../DOCKER_DEPLOYMENT_GUIDE.md)
3. Check logs: `docker-compose logs frontend`

---

**For complete deployment instructions, see [../README.md](../README.md)**
