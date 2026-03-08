# Docker Deployment Guide

## System Requirements

- Docker Desktop (Windows/macOS/Linux)
- 8GB RAM minimum (16GB recommended)
- 20GB free disk space

## Quick Start

### 1. Install Docker Desktop

**macOS:**
```bash
# Install via Homebrew
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

**Windows:**
- Download Docker Desktop from https://www.docker.com/products/docker-desktop
- Install and restart your computer

### 2. Clone and Deploy

```bash
# Clone the repository
git clone <your-repo-url>
cd aiu_media_hub

# Pull latest changes (if already cloned)
git pull origin version1

# Start the application
docker compose up -d

# Check container status
docker compose ps

# View logs
docker compose logs -f
```

### 3. Access the Application

- **Frontend:** http://localhost
- **Backend API:** http://localhost/api/
- **Admin Panel:** http://localhost/admin/
  - Username: `admin`
  - Password: `admin123`

## Architecture

The application consists of 3 services:

1. **MySQL Database** (port 3307)
   - Persistent data storage
   - Automatic health checks

2. **Django Backend** (port 8000)
   - REST API
   - Admin interface
   - Static/media file serving

3. **React Frontend** (port 80)
   - Nginx web server
   - Proxies API requests to backend
   - Serves static React build

## Network Configuration

All services communicate through the `aiu_network` Docker bridge network:

```
Frontend (nginx) → Backend (Django) → Database (MySQL)
     ↓
  User Browser
```

- Frontend uses **relative URLs** (`/api/`, `/media/`) in production
- Nginx proxies these to the backend container
- No CORS issues as everything is served from the same origin

## Development vs Production

### Development Mode (npm run dev)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Uses explicit backend URL with hostname detection

### Production Mode (Docker)
- Frontend: `http://localhost` (port 80)
- Backend: Internal Docker network
- Uses relative URLs, nginx handles proxying

## Common Commands

```bash
# Start containers
docker compose up -d

# Stop containers
docker compose down

# Rebuild after code changes
docker compose build --no-cache
docker compose up -d

# View logs
docker compose logs -f [service_name]

# Execute commands in containers
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py migrate

# Clean up everything (including volumes)
docker compose down -v
```

## Troubleshooting

### Frontend can't reach backend

**Symptom:** API calls fail with network errors

**Solution:**
1. Check all containers are running: `docker compose ps`
2. Check backend logs: `docker compose logs backend`
3. Verify nginx proxy config: `docker compose exec frontend cat /etc/nginx/conf.d/default.conf`
4. Test backend directly: `curl http://localhost:8000/api/health/`

### Permission denied errors (Linux)

**Symptom:** Vite or npm permission errors during build

**Solution:**
```bash
# Clean up and rebuild
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

The Dockerfile now properly handles file ownership using the `node` user.

### MySQL connection errors

**Symptom:** Backend can't connect to database

**Solution:**
1. Wait for MySQL to be healthy: `docker compose ps`
2. Check MySQL logs: `docker compose logs db`
3. Verify environment variables in docker-compose.yml
4. Restart: `docker compose restart backend`

### Port already in use

**Symptom:** "port is already allocated"

**Solution:**
```bash
# Find process using the port (example: port 80)
# macOS/Linux:
sudo lsof -i :80
sudo kill -9 <PID>

# Windows:
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml:
ports:
  - "8080:80"  # Use port 8080 instead
```

## Platform-Specific Notes

### macOS
- Docker Desktop includes Docker Compose
- File sharing is automatic for project directories
- Performance is good with Apple Silicon (M1/M2/M3)

### Linux
- Install `docker-compose-plugin` separately
- Add user to docker group to avoid sudo
- Best performance (native Docker)

### Windows
- Use WSL2 backend for better performance
- Keep project files in WSL2 filesystem
- Docker Desktop manages everything

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
MYSQL_ROOT_PASSWORD=root123
MYSQL_DATABASE=aiu_mediahub
MYSQL_USER=aiu
MYSQL_PASSWORD=aiu123

# Django
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# Frontend (optional, defaults work)
VITE_API_URL=http://localhost:8000
```

## Production Deployment

For production deployment:

1. Change default passwords in `.env`
2. Set `DEBUG=False`
3. Use proper `DJANGO_SECRET_KEY`
4. Configure `ALLOWED_HOSTS` with your domain
5. Set up SSL/HTTPS (add certificates to nginx)
6. Use external database for better reliability
7. Set up backup strategy for volumes

## Health Checks

All services have health checks:

```bash
# Check health status
docker compose ps

# Services should show "healthy" or "running"
```

## Data Persistence

Data is stored in Docker volumes:

- `mysql_data`: Database files
- `./media`: Uploaded files (bind mount)
- `./staticfiles`: Django static files (bind mount)

To backup:
```bash
# Backup database
docker compose exec db mysqldump -u root -proot123 aiu_mediahub > backup.sql

# Backup media files
tar -czf media_backup.tar.gz media/
```

## Support

For issues:
1. Check logs: `docker compose logs -f`
2. Verify all containers are healthy: `docker compose ps`
3. Review this guide's troubleshooting section
4. Check GitHub issues
