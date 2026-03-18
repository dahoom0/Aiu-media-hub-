# Docker Network Access Guide

## Overview
This guide helps you deploy the AIU Media Hub system via Docker so it's accessible from any device on your network (192.168.x.x, 10.100.10.x, etc.).

## Quick Start

### 1. Deploy the System
```bash
# On macOS/Linux
chmod +x deploy-docker-network.sh
./deploy-docker-network.sh

# On Windows
deploy-docker-network.bat
```

### 2. Find Your Server IP
**On macOS:**
```bash
ifconfig | grep "inet "
```

**On Windows:**
```cmd
ipconfig
```

Look for:
- Ethernet: Usually 192.168.x.x
- WiFi: Usually 10.100.10.x

### 3. Access from Any Device
Once deployed, access the system from any browser on your network:
- Frontend: `http://YOUR_IP` or `http://YOUR_IP:3000`
- Backend API: `http://YOUR_IP:8000`

## Common Issues & Solutions

### Issue 1: Students Register but Profile Not Showing

**Cause:** StudentProfile not created during registration

**Solution:** The system now automatically creates profiles with fallback values:
- If `student_id` is missing, uses `username` as fallback
- If `student_id` is duplicate, uses `username_timestamp`
- Always creates profile even if some fields are missing

**To fix existing users without profiles:**
```bash
docker-compose exec backend python manage.py shell
```
Then run:
```python
from api.models import User, StudentProfile
import time

# Find users without profiles
users_without_profiles = User.objects.filter(user_type='student', student_profile__isnull=True)

for user in users_without_profiles:
    student_id = user.username
    StudentProfile.objects.create(
        user=user,
        student_id=student_id,
        year='1',
        program='Bachelor of Media & Communication'
    )
    print(f"Created profile for {user.username}")
```

### Issue 2: Can't Access from Other Devices

**Cause:** Firewall blocking ports or wrong IP

**Solutions:**

1. **Check firewall settings:**
   ```bash
   # macOS - Allow ports 80, 3000, 8000
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/docker
   
   # Windows - Add firewall rules
   netsh advfirewall firewall add rule name="AIU Frontend" dir=in action=allow protocol=TCP localport=80
   netsh advfirewall firewall add rule name="AIU Frontend Alt" dir=in action=allow protocol=TCP localport=3000
   netsh advfirewall firewall add rule name="AIU Backend" dir=in action=allow protocol=TCP localport=8000
   ```

2. **Verify containers are running:**
   ```bash
   docker-compose ps
   ```
   All containers should show "Up" status.

3. **Check container logs:**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

### Issue 3: 400 Bad Request Errors

**Cause:** Unapplied migrations or CORS issues

**Solution:**
```bash
# Apply migrations
docker-compose exec backend python manage.py migrate

# Restart containers
docker-compose restart backend
```

### Issue 4: Frontend Can't Reach Backend

**Cause:** API URL misconfiguration

**Solution:** The system uses relative URLs in production (Docker), so no configuration needed. The nginx proxy handles routing:
- `/api/*` → backend:8000
- `/static/*` → backend:8000/static/
- `/media/*` → backend:8000/media/
- `/admin/*` → backend:8000/admin/

## Network Configuration

### Backend (Django)
- Listens on: `0.0.0.0:8000` (all interfaces)
- CORS: Allows all origins when `DOCKER_ENV=true`
- Allowed hosts: `*` (all hosts)

### Frontend (Nginx)
- Listens on: `0.0.0.0:80` (all interfaces)
- Proxies API requests to backend container
- Serves static files from `/usr/share/nginx/html`

### Database (MySQL)
- Internal only: `db:3306`
- External access: `localhost:3307` (for debugging)

## Accessing from Different Networks

### Same Network (192.168.x.x)
```
http://192.168.1.100        # Frontend
http://192.168.1.100:8000   # Backend API
```

### WiFi Network (10.100.10.x)
```
http://10.100.10.50         # Frontend
http://10.100.10.50:8000    # Backend API
```

## Troubleshooting Commands

### Check if ports are open
```bash
# macOS/Linux
netstat -an | grep LISTEN | grep -E '(80|3000|8000)'

# Windows
netstat -an | findstr "LISTENING" | findstr "80 3000 8000"
```

### Test backend health
```bash
curl http://localhost:8000/api/health/
curl http://YOUR_IP:8000/api/health/
```

### View real-time logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart specific service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Complete reset
```bash
docker-compose down -v  # Remove volumes (WARNING: deletes data)
docker-compose up -d --build
```

## Production Checklist

Before deploying on iMac for production use:

- [ ] Apply all migrations: `docker-compose exec backend python manage.py migrate`
- [ ] Create superuser: `docker-compose exec backend python manage.py createsuperuser`
- [ ] Seed categories: `docker-compose exec backend python manage.py seed_categories`
- [ ] Test registration from another device
- [ ] Test login from another device
- [ ] Verify profile creation for new users
- [ ] Check firewall allows ports 80, 3000, 8000
- [ ] Test access from both 192.168.x.x and 10.100.10.x networks

## Support

If issues persist:
1. Check logs: `docker-compose logs -f`
2. Verify migrations: `docker-compose exec backend python manage.py showmigrations`
3. Test backend directly: `curl http://YOUR_IP:8000/api/health/`
4. Check browser console for frontend errors
