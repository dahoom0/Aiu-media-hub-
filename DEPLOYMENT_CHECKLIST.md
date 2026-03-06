# Deployment Checklist

## Pre-Deployment

### System Requirements
- [ ] Docker Desktop installed and running
- [ ] At least 4GB RAM available
- [ ] At least 10GB disk space free
- [ ] Ports 80, 8000, 3306 are available

### Files Ready
- [ ] Repository cloned
- [ ] `.env` file created (from `.env.example`)
- [ ] Environment variables configured
- [ ] Deployment script is executable (Mac/Linux: `chmod +x deploy.sh`)

## Deployment Steps

### 1. Initial Setup
- [ ] Navigate to project directory
- [ ] Review `.env` file settings
- [ ] Ensure Docker Desktop is running

### 2. Run Deployment
**Windows:**
```cmd
deploy.bat
```

**Mac/Linux:**
```bash
./deploy.sh
```

### 3. Verify Services
- [ ] All containers are running: `docker-compose ps`
- [ ] No error messages in logs: `docker-compose logs`
- [ ] Database is healthy
- [ ] Backend is responding
- [ ] Frontend is accessible

### 4. Test Access
- [ ] Frontend loads: http://localhost
- [ ] Backend API responds: http://localhost:8000
- [ ] Admin panel accessible: http://localhost:8000/admin
- [ ] Can login with admin/admin123

### 5. Test Functionality
- [ ] Student can register
- [ ] Student can login
- [ ] Admin can login
- [ ] Lab booking works
- [ ] Equipment rental works
- [ ] CV generator works
- [ ] Tutorials load
- [ ] File uploads work

## Post-Deployment

### Security (Production Only)
- [ ] Changed default admin password
- [ ] Updated MySQL passwords in `.env`
- [ ] Generated new Django secret key
- [ ] Set `DEBUG=False` in `.env`
- [ ] Configured `ALLOWED_HOSTS` properly
- [ ] Enabled HTTPS (if applicable)

### Backup Setup
- [ ] Database backup script configured
- [ ] Media files backup configured
- [ ] Backup schedule set up
- [ ] Backup restoration tested

### Monitoring
- [ ] Log monitoring set up
- [ ] Health check endpoints tested
- [ ] Resource usage monitored
- [ ] Error alerting configured (optional)

## Troubleshooting Checklist

### If services won't start:
- [ ] Check Docker Desktop is running
- [ ] Check ports are not in use
- [ ] Review logs: `docker-compose logs`
- [ ] Try rebuilding: `docker-compose up -d --build`

### If database connection fails:
- [ ] Wait 30 seconds for MySQL to initialize
- [ ] Check database logs: `docker-compose logs db`
- [ ] Verify credentials in `.env`
- [ ] Restart database: `docker-compose restart db`

### If frontend doesn't load:
- [ ] Check frontend logs: `docker-compose logs frontend`
- [ ] Verify backend is running
- [ ] Check `VITE_API_URL` in `.env`
- [ ] Rebuild frontend: `docker-compose up -d --build frontend`

### If backend has errors:
- [ ] Check backend logs: `docker-compose logs backend`
- [ ] Run migrations: `docker-compose exec backend python manage.py migrate`
- [ ] Check database connection
- [ ] Verify environment variables

## Maintenance Checklist

### Daily
- [ ] Check service status: `docker-compose ps`
- [ ] Review error logs
- [ ] Monitor disk space

### Weekly
- [ ] Backup database
- [ ] Backup media files
- [ ] Review system resources
- [ ] Check for updates

### Monthly
- [ ] Update dependencies
- [ ] Review security settings
- [ ] Test backup restoration
- [ ] Clean up old logs

## Deployment Verification

### Automated Tests
```bash
# Check all services are running
docker-compose ps | grep "Up"

# Test backend health
curl http://localhost:8000/api/health/

# Test frontend
curl http://localhost/

# Test database connection
docker-compose exec backend python manage.py dbshell
```

### Manual Tests
1. Open http://localhost in browser
2. Register new student account
3. Login as student
4. Create lab booking
5. Rent equipment
6. Generate CV
7. Watch tutorial
8. Logout
9. Login as admin (admin/admin123)
10. Approve booking
11. Approve rental
12. Review CV
13. Upload tutorial

## Success Criteria

### All Green ✅
- [ ] All containers running
- [ ] No errors in logs
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] Database connected
- [ ] Admin panel working
- [ ] Student features working
- [ ] Admin features working
- [ ] File uploads working
- [ ] Data persisting after restart

## Rollback Plan

### If deployment fails:
```bash
# Stop all services
docker-compose down

# Remove volumes (if needed)
docker-compose down -v

# Restore from backup
docker-compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < backup.sql

# Restart services
docker-compose up -d
```

## Contact Information

### Support Resources
- **Documentation**: DOCKER_DEPLOYMENT_GUIDE.md
- **Quick Reference**: DOCKER_README.md
- **Docker Logs**: `docker-compose logs -f`
- **Service Status**: `docker-compose ps`

## Notes

### Deployment Date: _______________
### Deployed By: _______________
### Environment: [ ] Development [ ] Production
### Issues Encountered: _______________
### Resolution: _______________

---

## Quick Command Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Status
docker-compose ps

# Rebuild
docker-compose up -d --build

# Backup
docker-compose exec db mysqldump -u aiu -paiu123 aiu_mediahub > backup.sql

# Restore
docker-compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < backup.sql
```

---

**Deployment Complete!** ✅

Access your application at: http://localhost
