# Docker Deployment - Quick Reference

## One-Command Deployment

### Windows
```cmd
deploy.bat
```

### Mac/Linux
```bash
chmod +x deploy.sh
./deploy.sh
```

## What Gets Deployed

### Services
1. **MySQL Database** (Port 3306)
   - Database: aiu_mediahub
   - User: aiu
   - Password: aiu123

2. **Django Backend** (Port 8000)
   - API endpoints
   - Admin panel
   - Static files
   - Media uploads

3. **React Frontend** (Port 80)
   - User interface
   - Nginx web server

### Features
- ✅ Automatic database migrations
- ✅ Auto-created admin user
- ✅ Health checks for all services
- ✅ Persistent data storage
- ✅ Network isolation
- ✅ Restart policies

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost | N/A |
| Backend API | http://localhost:8000 | N/A |
| Admin Panel | http://localhost:8000/admin | admin / admin123 |
| MySQL | localhost:3306 | aiu / aiu123 |

## Quick Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Check status
docker-compose ps

# Access backend shell
docker-compose exec backend bash

# Run Django commands
docker-compose exec backend python manage.py <command>
```

## File Structure

```
aiu_media_hub/
├── docker-compose.yml          # Main orchestration file
├── Dockerfile                  # Backend Docker image
├── .env                        # Environment variables
├── deploy.sh                   # Linux/Mac deployment script
├── deploy.bat                  # Windows deployment script
├── frontend/
│   ├── Dockerfile             # Frontend Docker image
│   └── nginx.conf             # Nginx configuration
├── media/                      # Uploaded files (persistent)
├── staticfiles/               # Static assets (persistent)
└── DOCKER_DEPLOYMENT_GUIDE.md # Detailed guide
```

## Environment Variables

Key variables in `.env`:

```env
# Security
DJANGO_SECRET_KEY=<change-in-production>
DEBUG=False

# Database
MYSQL_DATABASE=aiu_mediahub
MYSQL_USER=aiu
MYSQL_PASSWORD=aiu123

# Network
ALLOWED_HOSTS=localhost,127.0.0.1
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check if ports are in use
netstat -ano | findstr :80    # Windows
lsof -i :80                   # Mac/Linux

# Restart Docker Desktop
```

### Database connection errors
```bash
# Wait for MySQL to be ready
docker-compose logs db

# Restart database
docker-compose restart db
```

### Frontend not loading
```bash
# Rebuild frontend
docker-compose up -d --build frontend

# Check nginx logs
docker-compose logs frontend
```

## Data Management

### Backup
```bash
# Database
docker-compose exec db mysqldump -u aiu -paiu123 aiu_mediahub > backup.sql

# Media files
tar -czf media_backup.tar.gz media/
```

### Restore
```bash
# Database
docker-compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < backup.sql

# Media files
tar -xzf media_backup.tar.gz
```

### Reset Everything
```bash
# WARNING: This deletes all data!
docker-compose down -v
docker-compose up -d --build
```

## Production Deployment

### Before deploying to production:

1. **Update .env file**
   ```env
   DEBUG=False
   DJANGO_SECRET_KEY=<generate-new-key>
   ALLOWED_HOSTS=your-domain.com
   ```

2. **Change passwords**
   ```env
   MYSQL_PASSWORD=<strong-password>
   MYSQL_ROOT_PASSWORD=<strong-password>
   ```

3. **Enable HTTPS** (use reverse proxy)

4. **Set up backups** (automated)

5. **Monitor logs** (set up logging service)

## System Requirements

### Minimum
- RAM: 4GB
- Disk: 10GB free
- CPU: 2 cores

### Recommended
- RAM: 8GB
- Disk: 20GB free
- CPU: 4 cores

## Support

For detailed information, see:
- **DOCKER_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **docker-compose.yml** - Service configuration
- **Dockerfile** - Backend image configuration
- **frontend/Dockerfile** - Frontend image configuration

## Quick Start Summary

1. Install Docker Desktop
2. Clone repository
3. Run deployment script:
   - Windows: `deploy.bat`
   - Mac/Linux: `./deploy.sh`
4. Access http://localhost
5. Login with admin/admin123

That's it! 🚀
