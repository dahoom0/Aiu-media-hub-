# Docker Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Login Fails / "Unable to connect to server"

**Symptoms:**
- Login page shows "Unable to connect to server"
- Browser console shows network errors
- 401 Unauthorized errors

**Solutions:**

#### Check Backend Health
```bash
# Test if backend is responding
curl http://localhost:8000/api/health/

# Should return: {"status":"healthy","service":"AIU Media Hub API","timestamp":"..."}
```

#### Check Container Logs
```bash
# View backend logs
docker logs aiu_backend

# View frontend logs
docker logs aiu_frontend

# View MySQL logs
docker logs aiu_mysql
```

#### Verify Network Connectivity
```bash
# Check if containers can communicate
docker exec aiu_frontend ping -c 3 backend
docker exec aiu_backend ping -c 3 db
```

#### Check CORS Settings
The backend should allow all origins in Docker mode. Verify in `aiu_backend/settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # Should be True in Docker
```

### 2. Dashboard Not Loading Data

**Symptoms:**
- Login succeeds but dashboard is empty
- Console shows 404 or 500 errors
- "Failed to load data" messages

**Solutions:**

#### Check API Endpoints
```bash
# Test authentication
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test with token
TOKEN="your_access_token_here"
curl http://localhost:8000/api/tutorials/ \
  -H "Authorization: Bearer $TOKEN"
```

#### Verify Database Migrations
```bash
# Run migrations
docker exec aiu_backend python manage.py migrate

# Check migration status
docker exec aiu_backend python manage.py showmigrations
```

#### Seed Initial Data
```bash
# Create default categories
docker exec aiu_backend python manage.py seed_categories

# Create superuser if needed
docker exec aiu_backend python manage.py createsuperuser
```

### 3. Frontend Can't Reach Backend

**Symptoms:**
- Network errors in browser console
- API calls timeout
- nginx 502 Bad Gateway

**Solutions:**

#### Check nginx Configuration
```bash
# Test nginx config
docker exec aiu_frontend nginx -t

# Reload nginx
docker exec aiu_frontend nginx -s reload
```

#### Verify Backend is Running
```bash
# Check if backend port is accessible
docker exec aiu_frontend wget -O- http://backend:8000/api/health/
```

#### Check Environment Variables
```bash
# View backend environment
docker exec aiu_backend env | grep -E "DB_|DJANGO_|ALLOWED"

# Verify API base URL
docker exec aiu_frontend cat /usr/share/nginx/html/assets/index-*.js | grep -o "http://[^\"]*"
```

### 4. Database Connection Issues

**Symptoms:**
- Backend logs show "Can't connect to MySQL"
- "Access denied for user" errors
- Database timeout errors

**Solutions:**

#### Check MySQL Status
```bash
# Check if MySQL is ready
docker exec aiu_mysql mysqladmin ping -h localhost -u root -proot123

# Connect to MySQL
docker exec -it aiu_mysql mysql -u aiu -paiu123 aiu_mediahub
```

#### Verify Database Credentials
Check `.env` file or docker-compose environment variables:
```bash
MYSQL_DATABASE=aiu_mediahub
MYSQL_USER=aiu
MYSQL_PASSWORD=aiu123
```

#### Reset Database (if needed)
```bash
# Stop containers
docker-compose down

# Remove database volume
docker volume rm aiu_media_hub_mysql_data

# Start fresh
docker-compose up -d
```

### 5. Permission Errors on Mac/Linux

**Symptoms:**
- "Permission denied" errors
- Can't write to media/static folders
- Vite build fails

**Solutions:**

#### Fix File Permissions
```bash
# On Mac/Linux
sudo chown -R $USER:$USER .
chmod -R 755 media staticfiles

# In Docker
docker exec aiu_backend chown -R www-data:www-data /app/media /app/staticfiles
```

### 6. Port Already in Use

**Symptoms:**
- "Port 80 is already allocated"
- "Port 8000 is already allocated"
- Container fails to start

**Solutions:**

#### Find and Kill Process
```bash
# On Mac/Linux
sudo lsof -i :80
sudo lsof -i :8000
kill -9 <PID>

# On Windows
netstat -ano | findstr :80
taskkill /PID <PID> /F
```

#### Use Different Ports
Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Use port 8080 instead of 80

backend:
  ports:
    - "8001:8000"  # Use port 8001 instead of 8000
```

## Complete Reset

If all else fails, perform a complete reset:

```bash
# Stop and remove everything
docker-compose down -v

# Remove all containers, images, and volumes
docker system prune -a --volumes

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Debugging Tips

### Enable Debug Mode
Edit `docker-compose.yml`:
```yaml
backend:
  environment:
    DEBUG: "True"
```

### View Real-time Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Access Container Shell
```bash
# Backend
docker exec -it aiu_backend bash

# Frontend
docker exec -it aiu_frontend sh

# MySQL
docker exec -it aiu_mysql bash
```

### Test API from Inside Container
```bash
# From backend container
docker exec aiu_backend curl http://localhost:8000/api/health/

# From frontend container
docker exec aiu_frontend wget -O- http://backend:8000/api/health/
```

## Platform-Specific Issues

### macOS
- Docker Desktop must be running
- File sharing must be enabled for project directory
- Use `host.docker.internal` to access host machine

### Linux
- May need to run docker commands with `sudo`
- Check firewall settings: `sudo ufw status`
- Ensure Docker service is running: `sudo systemctl status docker`

### Windows
- Use WSL2 backend for better performance
- Ensure line endings are LF not CRLF
- Run PowerShell/CMD as Administrator

## Getting Help

If issues persist:

1. Check container logs: `docker-compose logs`
2. Verify all services are running: `docker-compose ps`
3. Test health endpoint: `curl http://localhost:8000/api/health/`
4. Check browser console for frontend errors (F12)
5. Review Django logs in backend container

## Contact

For additional support, contact the development team:
- Abdirahman Abdillahi Nour - a.rahmanabdillahi@gmail.com
- Abdullah Hakeem Mohamad - abdullahhakeem2004@gmail.com
