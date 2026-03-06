# AIU Media Hub - Quick Reference Card

## 🚀 Quick Deploy

### Windows
```cmd
deploy.bat
```

### Mac/Linux
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost | Student accounts |
| Admin Panel | http://localhost:8000/admin | admin / admin123 |
| Backend API | http://localhost:8000 | - |

## 📊 Essential Commands

### Check Status
```bash
docker compose ps                    # List all containers
docker stats                         # Resource usage
docker compose logs -f               # View all logs
docker compose logs -f backend       # View backend logs
```

### Control Services
```bash
docker compose up -d                 # Start all services
docker compose down                  # Stop all services
docker compose restart               # Restart all services
docker compose restart backend       # Restart backend only
```

### Verify Deployment
```bash
# Linux/Mac
./verify-deployment.sh

# Windows
verify-deployment.bat
```

## 🔧 Troubleshooting

### Services Won't Start
```bash
docker compose down
docker compose up -d --build
```

### View Errors
```bash
docker compose logs --tail=100 | grep -i error
```

### Reset Everything (⚠️ Deletes all data!)
```bash
docker compose down -v
docker compose up -d --build
```

### Port Already in Use
Edit `docker-compose.yml` and change ports:
```yaml
frontend:
  ports:
    - "3000:80"  # Change 80 to 3000
```

## 💾 Backup & Restore

### Backup Database
```bash
docker compose exec db mysqldump -u aiu -paiu123 aiu_mediahub > backup.sql
```

### Restore Database
```bash
docker compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < backup.sql
```

### Backup Media Files
```bash
tar -czf media_backup.tar.gz media/
```

## 📈 Performance Monitoring

### Check Resource Usage
```bash
docker stats --no-stream
```

### Check Database Connections
```bash
docker compose exec db mysql -u aiu -paiu123 -e "SHOW STATUS LIKE 'Threads_connected';"
```

### Check Backend Workers
```bash
docker compose exec backend ps aux | grep gunicorn
```

## 🎯 Current Performance Settings

- **Backend**: 8 workers × 4 threads = 32 concurrent requests
- **Database**: 500 max connections
- **Capacity**: 100-200 concurrent students

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| README.md | Quick start guide |
| PERFORMANCE_OPTIMIZATION.md | Complete tuning guide |
| DOCKER_DEPLOYMENT_GUIDE.md | Detailed deployment |
| OPTIMIZATION_SUMMARY.md | What was optimized |
| QUICK_REFERENCE.md | This file |

## 🔒 Security Checklist

Before production:
- [ ] Change admin password
- [ ] Change database passwords in .env
- [ ] Generate new Django secret key
- [ ] Set DEBUG=False in .env
- [ ] Set ALLOWED_HOSTS in .env
- [ ] Enable HTTPS
- [ ] Set up regular backups

## 🆘 Common Issues

### "Docker is not running"
→ Start Docker Desktop

### "Port already in use"
→ Change ports in docker-compose.yml

### "Database connection failed"
→ Wait 30 seconds, check: `docker compose logs db`

### "Frontend not loading"
→ Check: `docker compose logs frontend`

### "Backend errors"
→ Check: `docker compose logs backend`

## 📞 Quick Help

```bash
# Full system check
./verify-deployment.sh  # or .bat on Windows

# View all logs
docker compose logs -f

# Restart everything
docker compose restart

# Check what's using resources
docker stats
```

---

**Need more help?** See README.md or DOCKER_DEPLOYMENT_GUIDE.md
