# Quick Start - Deploy in 5 Minutes

## Prerequisites
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Make sure Docker Desktop is running

## Deployment Steps

### Windows Users
```cmd
1. Open Command Prompt or PowerShell
2. Navigate to project folder: cd path\to\aiu_media_hub
3. Run: deploy.bat
4. Wait 2-3 minutes
5. Open browser: http://localhost
```

### Mac/Linux Users
```bash
1. Open Terminal
2. Navigate to project folder: cd path/to/aiu_media_hub
3. Make script executable: chmod +x deploy.sh
4. Run: ./deploy.sh
5. Wait 2-3 minutes
6. Open browser: http://localhost
```

## Default Login

### Admin Account
- URL: http://localhost:8000/admin
- Username: `admin`
- Password: `admin123`

### Student Account
- Register at: http://localhost
- Or create via admin panel

## That's It!

Your AIU Media Hub is now running with:
- ✅ MySQL Database
- ✅ Django Backend
- ✅ React Frontend
- ✅ All features enabled

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Restart application
docker-compose restart

# Check status
docker-compose ps
```

## Need Help?

See detailed guides:
- **DOCKER_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **DOCKER_README.md** - Quick reference
- **DEPLOYMENT_CHECKLIST.md** - Deployment checklist

## Troubleshooting

### Port 80 already in use?
Edit `docker-compose.yml` and change:
```yaml
frontend:
  ports:
    - "3000:80"  # Change 80 to 3000
```
Then access at: http://localhost:3000

### Services not starting?
```bash
# Check Docker Desktop is running
# View logs for errors
docker-compose logs

# Try rebuilding
docker-compose down
docker-compose up -d --build
```

---

**Enjoy your AIU Media Hub!** 🚀
