# Docker Deployment - Quick Start

## Deploy on iMac for Network Access

### Step 1: Deploy
```bash
docker-compose up -d --build
```

### Step 2: Wait for Services (30 seconds)
The system automatically:
- ✓ Waits for MySQL
- ✓ Runs migrations
- ✓ Fixes missing profiles
- ✓ Creates superuser (admin/admin123)
- ✓ Starts services

### Step 3: Find Your IP
```bash
ifconfig | grep "inet "
```
Look for your network IP (e.g., 192.168.1.100 or 10.100.10.50)

### Step 4: Access from Any Device
```
http://YOUR_IP          # Frontend
http://YOUR_IP:8000     # Backend API
```

## Common Commands

### View Logs
```bash
docker-compose logs -f backend    # Backend logs
docker-compose logs -f frontend   # Frontend logs
```

### Fix Missing Profiles (if needed)
```bash
docker-compose exec backend python manage.py fix_missing_profiles
```

### Apply New Migrations
```bash
docker-compose exec backend python manage.py migrate
```

### Restart Services
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Stop Everything
```bash
docker-compose down
```

### Complete Reset (WARNING: Deletes all data)
```bash
docker-compose down -v
docker-compose up -d --build
```

## Troubleshooting

### Students can register but profile not showing?
```bash
docker-compose exec backend python manage.py fix_missing_profiles
```

### Can't access from other devices?
1. Check firewall settings
2. Verify IP address: `ifconfig` or `ipconfig`
3. Test: `curl http://YOUR_IP:8000/api/health/`

### 400 errors on dashboard?
```bash
docker-compose exec backend python manage.py migrate
docker-compose restart backend
```

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@aiu.edu.my`

**Change password after first login!**
