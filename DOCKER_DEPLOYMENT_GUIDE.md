# Docker Deployment Guide - AIU Media Hub

## Overview
This guide will help you deploy the AIU Media Hub system on any machine using Docker. The setup includes:
- **MySQL Database** (Port 3306)
- **Django Backend** (Port 8000)
- **React Frontend** (Port 80)

## Prerequisites

### Required Software
1. **Docker Desktop** (includes Docker and Docker Compose)
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/

2. **Git** (to clone the repository)
   - Download: https://git-scm.com/downloads

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: Minimum 10GB free
- **OS**: Windows 10/11, macOS, or Linux

## Quick Start (5 Minutes)

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd aiu_media_hub
```

### Step 2: Create Environment File
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (optional for local deployment)
```

### Step 3: Build and Start
```bash
# Build and start all containers
docker-compose up -d --build

# This will:
# - Download MySQL image
# - Build backend Docker image
# - Build frontend Docker image
# - Start all services
# - Run database migrations
# - Create admin user
```

### Step 4: Wait for Services to Start
```bash
# Check if all services are running
docker-compose ps

# Watch the logs (optional)
docker-compose logs -f
```

### Step 5: Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

### Default Admin Credentials
```
Username: admin
Password: admin123
Email: admin@aiu.edu.my
```

## Detailed Commands

### Starting the Application
```bash
# Start all services
docker-compose up -d

# Start with logs visible
docker-compose up

# Rebuild and start (after code changes)
docker-compose up -d --build
```

### Stopping the Application
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v
```

### Viewing Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Checking Service Status
```bash
# List all containers
docker-compose ps

# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Accessing Containers
```bash
# Access backend shell
docker-compose exec backend bash

# Access MySQL shell
docker-compose exec db mysql -u aiu -p

# Access frontend shell
docker-compose exec frontend sh
```

### Database Management
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access Django shell
docker-compose exec backend python manage.py shell

# Backup database
docker-compose exec db mysqldump -u aiu -paiu123 aiu_mediahub > backup.sql

# Restore database
docker-compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < backup.sql
```

## Configuration

### Environment Variables (.env file)

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

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

### Changing Ports

Edit `docker-compose.yml`:

```yaml
# Change frontend port from 80 to 3000
frontend:
  ports:
    - "3000:80"  # Change this line

# Change backend port from 8000 to 9000
backend:
  ports:
    - "9000:8000"  # Change this line
```

## Deployment on Different Systems

### Local Development Machine
```bash
# Use default settings
docker-compose up -d --build
```

### Production Server
```bash
# 1. Update .env file
DEBUG=False
DJANGO_SECRET_KEY=<generate-strong-key>
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# 2. Build and start
docker-compose up -d --build

# 3. Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Another Developer's Machine
```bash
# 1. Clone repository
git clone <repo-url>
cd aiu_media_hub

# 2. Copy environment file
cp .env.example .env

# 3. Start services
docker-compose up -d --build

# Done! Application is running
```

## Troubleshooting

### Problem: Port Already in Use
```bash
# Check what's using the port
# Windows
netstat -ano | findstr :80
netstat -ano | findstr :8000

# Mac/Linux
lsof -i :80
lsof -i :8000

# Solution: Change ports in docker-compose.yml or stop the conflicting service
```

### Problem: Database Connection Failed
```bash
# Check if MySQL is running
docker-compose ps db

# Check MySQL logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait for health check
docker-compose ps
```

### Problem: Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

### Problem: Backend Errors
```bash
# Check backend logs
docker-compose logs backend

# Run migrations
docker-compose exec backend python manage.py migrate

# Check database connection
docker-compose exec backend python manage.py dbshell
```

### Problem: Out of Disk Space
```bash
# Remove unused Docker images
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

## Updating the Application

### After Code Changes
```bash
# 1. Pull latest code
git pull

# 2. Rebuild and restart
docker-compose up -d --build

# 3. Run migrations (if any)
docker-compose exec backend python manage.py migrate

# 4. Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Updating Dependencies
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

## Data Persistence

### Database Data
- Stored in Docker volume: `mysql_data`
- Persists even after `docker-compose down`
- Only deleted with `docker-compose down -v`

### Media Files
- Stored in: `./media` directory
- Persists on host machine
- Backed up with your code

### Static Files
- Stored in: `./staticfiles` directory
- Regenerated on each deployment

## Backup and Restore

### Full Backup
```bash
# 1. Backup database
docker-compose exec db mysqldump -u aiu -paiu123 aiu_mediahub > backup_$(date +%Y%m%d).sql

# 2. Backup media files
tar -czf media_backup_$(date +%Y%m%d).tar.gz media/

# 3. Backup .env file
cp .env env_backup_$(date +%Y%m%d).env
```

### Full Restore
```bash
# 1. Restore database
docker-compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < backup_20260307.sql

# 2. Restore media files
tar -xzf media_backup_20260307.tar.gz

# 3. Restore .env file
cp env_backup_20260307.env .env

# 4. Restart services
docker-compose restart
```

## Performance Optimization

### Increase Backend Workers
Edit `docker-compose.yml`:
```yaml
backend:
  command: bash -c "... gunicorn ... --workers 8 ..."  # Increase from 4 to 8
```

### Allocate More Memory
Edit Docker Desktop settings:
- Resources → Memory → Increase to 8GB

### Enable Caching
Add Redis service to `docker-compose.yml` (optional)

## Security Best Practices

### Production Deployment
1. **Change default passwords**
   ```env
   MYSQL_PASSWORD=<strong-password>
   MYSQL_ROOT_PASSWORD=<strong-password>
   ```

2. **Generate new Django secret key**
   ```bash
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```

3. **Disable DEBUG mode**
   ```env
   DEBUG=False
   ```

4. **Set allowed hosts**
   ```env
   ALLOWED_HOSTS=your-domain.com,www.your-domain.com
   ```

5. **Use HTTPS** (configure reverse proxy like Nginx or Traefik)

## Monitoring

### Check Container Health
```bash
# View health status
docker-compose ps

# Check resource usage
docker stats
```

### View Application Logs
```bash
# Real-time logs
docker-compose logs -f

# Error logs only
docker-compose logs | grep ERROR
```

## Uninstalling

### Remove Everything
```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker rmi aiu_media_hub_backend aiu_media_hub_frontend

# Remove project directory
cd ..
rm -rf aiu_media_hub
```

## Support

### Common Issues
- Check logs: `docker-compose logs`
- Restart services: `docker-compose restart`
- Rebuild: `docker-compose up -d --build`

### Getting Help
- Check Docker logs for error messages
- Verify all environment variables are set
- Ensure ports are not in use
- Check Docker Desktop is running

## Summary

### To Deploy on New System:
1. Install Docker Desktop
2. Clone repository
3. Copy `.env.example` to `.env`
4. Run `docker-compose up -d --build`
5. Access http://localhost

### To Update Application:
1. Pull latest code
2. Run `docker-compose up -d --build`
3. Run migrations if needed

### To Backup Data:
1. Export database: `docker-compose exec db mysqldump ...`
2. Copy media folder
3. Save .env file

That's it! Your AIU Media Hub is now running in Docker containers and can be easily deployed on any system.
