# AIU Media Hub - Student Management System

A comprehensive web-based platform for managing lab bookings, equipment rentals, CV generation, and educational tutorials for Albukhary International University.

## 🚀 Quick Deployment (5 Minutes)

### Prerequisites
- **Docker Desktop** installed and running
  - Windows: https://docs.docker.com/desktop/install/windows-install/
  - Mac: https://docs.docker.com/desktop/install/mac-install/
  - Linux: https://docs.docker.com/desktop/install/linux-install/

### Deploy on Any System

#### Windows
```cmd
deploy.bat
```

#### Mac/Linux
```bash
chmod +x deploy.sh
./deploy.sh
```

### Access Your System
- Frontend: http://localhost
- Admin Panel: http://localhost:8000/admin
- Login: admin / admin123

**⚠️ IMPORTANT: Change default passwords in production!**

## 📋 What Gets Deployed

### Services
- **MySQL Database** (Port 3306) - Optimized with 500 max connections
- **Django Backend** (Port 8000) - 8 Gunicorn workers with threading
- **React Frontend** (Port 80) - Nginx with caching

### Performance
- **Capacity**: 100-200 concurrent students (scalable to 500+)
- **Response Time**: < 200ms for API calls
- **Workers**: 8 Gunicorn workers × 4 threads = 32 concurrent requests

### Features
- ✅ Automatic database setup and migrations
- ✅ Auto-created admin user (admin/admin123)
- ✅ Lab booking system with iMac selection
- ✅ Equipment rental management
- ✅ CV generator with templates
- ✅ Tutorial video library
- ✅ Admin dashboard with analytics
- ✅ System usage tracking and Excel export

## 🔑 Default Credentials

### Admin Account
```
URL: http://localhost:8000/admin
Username: admin
Password: admin123
```

### MySQL Database
```
Host: localhost:3306
Database: aiu_mediahub
User: aiu
Password: aiu123
Root Password: root123
```

**⚠️ CRITICAL: Change these passwords before production deployment!**

## 📖 Detailed Deployment Guide

### Step 1: Install Docker Desktop

1. Download Docker Desktop for your operating system
2. Install and start Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   docker compose version
   ```

### Step 2: Get the Project

Clone from Git or copy the project folder to your system:
```bash
git clone <repository-url>
cd aiu_media_hub
```

### Step 3: Configure Environment (Optional)

The project works with default settings. To customize:

```bash
# Copy environment template
cp .env.example .env

# Edit .env file to customize:
# - Database passwords
# - Django secret key
# - Debug mode
# - Allowed hosts
```

### Step 4: Deploy

**Automated Deployment (Recommended):**

Windows:
```cmd
deploy.bat
```

Mac/Linux:
```bash
chmod +x deploy.sh
./deploy.sh
```

**Manual Deployment:**

```bash
# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 5: Verify Deployment

1. **Check containers:**
   ```bash
   docker compose ps
   # All should show "Up (healthy)"
   ```

2. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

3. **Test login:**
   - Login with admin/admin123
   - Create a student account
   - Test features

## 🎯 System Requirements

### Minimum (50-100 concurrent students)
- **RAM**: 8GB
- **Disk Space**: 20GB SSD
- **CPU**: 4 cores
- **OS**: Windows 10/11, macOS, or Linux
- **Network**: 100 Mbps

### Recommended (200-500 concurrent students)
- **RAM**: 16GB
- **Disk Space**: 50GB SSD
- **CPU**: 8 cores
- **Network**: 1 Gbps

### High-Load (500+ concurrent students)
- **RAM**: 32GB
- **Disk Space**: 100GB SSD
- **CPU**: 16 cores
- **Network**: 1 Gbps
- **Consider**: Load balancer with multiple backend instances

## 📂 Project Structure

```
aiu_media_hub/
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Backend container
├── .env.example               # Environment template
├── deploy.sh                  # Linux/Mac deployment
├── deploy.bat                 # Windows deployment
├── README.md                  # This file
│
├── aiu_backend/               # Django backend
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── api/                       # Django app
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   └── urls.py
│
├── frontend/                  # React frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   └── package.json
│
├── media/                     # Uploaded files (persistent)
├── staticfiles/              # Static assets (persistent)
│
└── Documentation/
    ├── DOCKER_DEPLOYMENT_GUIDE.md
    ├── DOCKER_README.md
    └── DEPLOYMENT_CHECKLIST.md
```

## 🔧 Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build
```

### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# View last 100 lines
docker-compose logs --tail=100
```

### Check Status

```bash
# List all containers
docker-compose ps

# Check resource usage
docker stats

# Check disk usage
docker system df
```

### Database Management

```bash
# Access Django shell
docker-compose exec backend python manage.py shell

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access MySQL shell
docker-compose exec db mysql -u aiu -paiu123 aiu_mediahub

# Backup database
docker-compose exec db mysqldump -u aiu -paiu123 aiu_mediahub > backup.sql

# Restore database
docker-compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < backup.sql
```

### Access Containers

```bash
# Access backend shell
docker-compose exec backend bash

# Access frontend shell
docker-compose exec frontend sh

# Access database shell
docker-compose exec db bash
```

## 🔄 Updating the Application

### After Code Changes

```bash
# 1. Pull latest code (if using Git)
git pull

# 2. Rebuild and restart
docker-compose up -d --build

# 3. Run migrations (if database changed)
docker-compose exec backend python manage.py migrate

# 4. Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Update Dependencies

```bash
# Backend (Python)
# 1. Update requirements.txt
# 2. Rebuild backend
docker-compose up -d --build backend

# Frontend (Node.js)
# 1. Update package.json
# 2. Rebuild frontend
docker-compose up -d --build frontend
```

## 💾 Backup and Restore

### Backup Everything

```bash
# 1. Backup database
docker-compose exec db mysqldump -u aiu -paiu123 aiu_mediahub > backup_$(date +%Y%m%d).sql

# 2. Backup media files
tar -czf media_backup_$(date +%Y%m%d).tar.gz media/

# 3. Backup environment file
cp .env env_backup_$(date +%Y%m%d).env
```

### Restore Everything

```bash
# 1. Restore database
docker-compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < backup_20260307.sql

# 2. Restore media files
tar -xzf media_backup_20260307.tar.gz

# 3. Restore environment
cp env_backup_20260307.env .env

# 4. Restart services
docker-compose restart
```

## 🛠️ Troubleshooting

### Services Won't Start

```bash
# Check if Docker Desktop is running
docker ps

# View error logs
docker-compose logs

# Rebuild everything
docker-compose down
docker-compose up -d --build
```

### Port Already in Use

**Problem:** Port 80, 8000, or 3306 is already in use

**Solution 1:** Stop the conflicting service

**Solution 2:** Change ports in `docker-compose.yml`
```yaml
frontend:
  ports:
    - "3000:80"  # Change 80 to 3000

backend:
  ports:
    - "9000:8000"  # Change 8000 to 9000
```

### Database Connection Failed

```bash
# Wait 30 seconds for MySQL to initialize
sleep 30

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Verify database is healthy
docker-compose ps
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Check if backend is running
docker-compose ps backend
```

### Reset Everything (WARNING: Deletes all data!)

```bash
# Stop and remove everything
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

## 🔒 Security (Production Deployment)

### Before deploying to production:

1. **Change all default passwords**
   ```env
   # In .env file
   MYSQL_PASSWORD=<strong-password>
   MYSQL_ROOT_PASSWORD=<strong-password>
   ```

2. **Generate new Django secret key**
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

3. **Disable debug mode**
   ```env
   DEBUG=False
   ```

4. **Set allowed hosts**
   ```env
   ALLOWED_HOSTS=your-domain.com,www.your-domain.com
   ```

5. **Enable HTTPS** (use reverse proxy like Nginx or Traefik)

6. **Set up regular backups**

7. **Monitor logs and resources**

## 🚀 Performance Optimization

The system is optimized to handle many concurrent students:

### Current Configuration
- **8 Gunicorn workers** with 4 threads each (32 concurrent requests)
- **500 MySQL connections** with query caching
- **Resource limits** for all containers

### Capacity
- **100-200 concurrent students** with default settings
- **500+ students** with recommended hardware (16GB RAM, 8 CPU cores)

### Monitor Performance

```bash
# View real-time resource usage
docker stats

# Check backend performance
docker compose logs -f backend

# Monitor database connections
docker compose exec db mysql -u aiu -paiu123 -e "SHOW STATUS LIKE 'Threads_connected';"
```

### Scaling Up

For higher loads, edit `docker-compose.yml`:

```yaml
backend:
  command: |
    gunicorn ... --workers 16 --threads 4  # Increase workers
  deploy:
    resources:
      limits:
        cpus: '8.0'    # Increase CPU
        memory: 8G     # Increase RAM
```

Then restart:
```bash
docker compose down
docker compose up -d --build
```

## 📊 Features

### For Students
- 🎓 Register and manage account
- 📅 Book lab sessions (BMC Lab)
- 📦 Rent equipment (cameras, microphones, etc.)
- 📄 Generate professional CVs
- 🎥 Watch tutorial videos
- 📱 Responsive mobile interface

### For Admins
- 👥 Manage student accounts
- ✅ Approve/reject lab bookings
- ✅ Approve/reject equipment rentals
- 📝 Review and approve CVs
- 📹 Upload and manage tutorials
- 📊 View system usage analytics
- 📥 Export usage reports (Excel)

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost | Main application |
| Backend API | http://localhost:8000 | REST API endpoints |
| Admin Panel | http://localhost:8000/admin | Django admin interface |
| MySQL | localhost:3306 | Database (internal) |

## 📚 Documentation

- **[README.md](README.md)** - This file - Complete deployment and usage guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick command reference for daily operations

## 🆘 Getting Help

### Quick Issues
1. Check logs: `docker-compose logs -f`
2. Verify all containers are running: `docker-compose ps`
3. Restart services: `docker-compose restart`

### Detailed Issues
1. Review **DOCKER_DEPLOYMENT_GUIDE.md**
2. Check troubleshooting section
3. Verify environment variables in `.env`

## 📝 Environment Variables

Key variables in `.env` file:

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL Database
MYSQL_DATABASE=aiu_mediahub
MYSQL_USER=aiu
MYSQL_PASSWORD=aiu123
MYSQL_ROOT_PASSWORD=root123
MYSQL_HOST=db
MYSQL_PORT=3306

# Frontend
VITE_API_URL=http://localhost:8000
```

## 🎉 Success!

If you can access http://localhost and see the landing page, your deployment is successful!

### Next Steps:
1. Login as admin (admin/admin123)
2. Change admin password
3. Create student accounts
4. Test all features
5. Customize settings in .env
6. Set up regular backups

## 📞 Support

For issues or questions:
1. Check the documentation in the `Documentation/` folder
2. Review logs: `docker-compose logs -f`
3. Verify Docker Desktop is running
4. Ensure ports are not in use

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors Here]

---

**Made with ❤️ for Albukhary International University**

*Last Updated: March 2026*
