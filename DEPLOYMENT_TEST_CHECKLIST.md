# Deployment Testing Checklist

Use this checklist to verify your deployment is working correctly.

## Pre-Deployment Checks

- [ ] Docker Desktop is installed and running
- [ ] At least 8GB RAM available
- [ ] At least 20GB disk space available
- [ ] Ports 80, 8000, 3306 are not in use
- [ ] Internet connection available (for first-time image downloads)

## Deployment Steps

- [ ] Run deployment script (`./deploy.sh` or `deploy.bat`)
- [ ] Wait for "Deployment Complete" message
- [ ] All containers show "Up" status
- [ ] No error messages in deployment output

## Service Verification

### 1. Docker Containers
```bash
docker compose ps
```
- [ ] aiu_mysql - Up (healthy)
- [ ] aiu_backend - Up (healthy)
- [ ] aiu_frontend - Up (healthy)

### 2. Frontend (http://localhost)
- [ ] Landing page loads
- [ ] No console errors (F12 → Console)
- [ ] Images load correctly
- [ ] Navigation works
- [ ] Login page accessible

### 3. Backend API (http://localhost:8000)
- [ ] API root page loads
- [ ] Health endpoint works: http://localhost:8000/api/health/
- [ ] No 500 errors

### 4. Admin Panel (http://localhost:8000/admin)
- [ ] Admin login page loads
- [ ] Can login with admin/admin123
- [ ] Dashboard loads
- [ ] Can view users, equipment, tutorials

## Functional Testing

### Student Registration & Login
- [ ] Can access signup page
- [ ] Can create new student account
- [ ] Receives validation errors for invalid input
- [ ] Can login with new account
- [ ] Redirects to student dashboard

### Lab Booking
- [ ] Can view lab booking page
- [ ] Can select date and time slot
- [ ] Can select iMac number
- [ ] Can submit booking request
- [ ] Booking appears in "My Bookings"
- [ ] Status shows as "Pending"

### Equipment Rental
- [ ] Can view equipment catalog
- [ ] Can filter by category
- [ ] Can view equipment details
- [ ] Can request equipment rental
- [ ] Request appears in "My Rentals"
- [ ] Status shows as "Pending"

### CV Generator
- [ ] Can access CV generator
- [ ] Can fill in personal information
- [ ] Can add education, experience, skills
- [ ] Can upload profile photo
- [ ] Can preview CV
- [ ] Can download CV as PDF

### Tutorials
- [ ] Can view tutorial list
- [ ] Can filter by category
- [ ] Can search tutorials
- [ ] Can play video
- [ ] Progress is tracked

### Admin Functions
- [ ] Can view pending bookings
- [ ] Can approve/reject bookings
- [ ] Can view pending rentals
- [ ] Can approve/reject rentals
- [ ] Can view submitted CVs
- [ ] Can review/flag CVs
- [ ] Can manage equipment
- [ ] Can upload tutorials
- [ ] Can view system usage stats
- [ ] Can export usage report (Excel)

## Performance Testing

### Resource Usage
```bash
docker stats --no-stream
```
- [ ] Backend CPU < 50% at idle
- [ ] Backend Memory < 2GB at idle
- [ ] Database CPU < 30% at idle
- [ ] Database Memory < 1GB at idle
- [ ] Frontend CPU < 10% at idle
- [ ] Frontend Memory < 256MB at idle

### Response Times
- [ ] Frontend loads in < 2 seconds
- [ ] API responses in < 500ms
- [ ] Database queries in < 100ms
- [ ] No timeout errors

### Database Connections
```bash
docker compose exec db mysql -u aiu -paiu123 -e "SHOW STATUS LIKE 'Threads_connected';"
```
- [ ] Connection count < 50 at idle
- [ ] No "too many connections" errors

## Load Testing (Optional)

### Light Load (10 concurrent users)
```bash
ab -n 100 -c 10 http://localhost:8000/api/health/
```
- [ ] All requests successful
- [ ] Average response time < 200ms
- [ ] No errors

### Medium Load (50 concurrent users)
```bash
ab -n 500 -c 50 http://localhost:8000/api/health/
```
- [ ] All requests successful
- [ ] Average response time < 500ms
- [ ] No errors

### High Load (100 concurrent users)
```bash
ab -n 1000 -c 100 http://localhost:8000/api/health/
```
- [ ] > 95% requests successful
- [ ] Average response time < 1000ms
- [ ] System remains stable

## Security Checks

### Default Credentials
- [ ] Admin password changed from default
- [ ] Database passwords changed in .env
- [ ] Django secret key generated
- [ ] DEBUG=False in .env (for production)

### Access Control
- [ ] Students cannot access admin panel
- [ ] Unauthenticated users redirected to login
- [ ] API requires authentication
- [ ] CORS configured correctly

### Data Protection
- [ ] Uploaded files stored securely
- [ ] Database backups configured
- [ ] SSL/HTTPS enabled (for production)

## Backup & Recovery

### Backup
- [ ] Can backup database
- [ ] Can backup media files
- [ ] Backup files are valid

### Restore
- [ ] Can restore database from backup
- [ ] Can restore media files
- [ ] System works after restore

## Monitoring & Logging

### Logs
```bash
docker compose logs --tail=100
```
- [ ] No critical errors
- [ ] No repeated warnings
- [ ] Request logging working

### Health Checks
- [ ] All containers pass health checks
- [ ] Health endpoint returns 200 OK
- [ ] Database connection successful

## Documentation

- [ ] README.md reviewed
- [ ] QUICK_REFERENCE.md accessible
- [ ] PERFORMANCE_OPTIMIZATION.md reviewed
- [ ] Deployment scripts work correctly
- [ ] Verification scripts work correctly

## Final Checks

- [ ] All services running smoothly
- [ ] No error messages in logs
- [ ] Resource usage within limits
- [ ] All features working as expected
- [ ] Performance meets requirements
- [ ] Security measures in place
- [ ] Backups configured
- [ ] Documentation complete

## Sign-Off

**Tested By:** ___________________

**Date:** ___________________

**Environment:** 
- [ ] Development
- [ ] Staging
- [ ] Production

**System Specs:**
- CPU Cores: ___
- RAM: ___ GB
- Disk: ___ GB
- OS: ___________

**Test Results:**
- [ ] All tests passed
- [ ] Some tests failed (see notes below)
- [ ] Major issues found (deployment not ready)

**Notes:**
```
[Add any issues, observations, or recommendations here]
```

**Deployment Status:**
- [ ] ✅ Ready for use
- [ ] ⚠️ Ready with minor issues
- [ ] ❌ Not ready - needs fixes

---

## Troubleshooting Common Issues

### Issue: Containers won't start
**Solution:** 
```bash
docker compose down
docker compose up -d --build
```

### Issue: Port already in use
**Solution:** Change ports in docker-compose.yml

### Issue: Database connection failed
**Solution:** Wait 30 seconds, check logs:
```bash
docker compose logs db
```

### Issue: Frontend shows blank page
**Solution:** Check browser console (F12), check logs:
```bash
docker compose logs frontend
```

### Issue: Backend errors
**Solution:** Check logs:
```bash
docker compose logs backend
```

### Issue: High resource usage
**Solution:** See PERFORMANCE_OPTIMIZATION.md

---

**For detailed troubleshooting, see:**
- DOCKER_DEPLOYMENT_GUIDE.md
- PERFORMANCE_OPTIMIZATION.md
- QUICK_REFERENCE.md
