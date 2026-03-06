# Performance Optimization Guide

This guide explains the performance optimizations implemented in the AIU Media Hub system to handle high concurrent student usage.

## Overview

The system has been optimized to handle hundreds of concurrent students with the following improvements:

- **8 Gunicorn workers** with threading support
- **MySQL connection pooling** with 500 max connections
- **Resource limits** for all containers
- **Optimized database settings** for high throughput
- **Frontend caching** with Nginx

## Backend Optimization

### Gunicorn Configuration

The backend uses Gunicorn with the following optimized settings:

```bash
gunicorn aiu_backend.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 8 \                      # 8 worker processes
  --threads 4 \                      # 4 threads per worker = 32 total
  --worker-class gthread \           # Threaded worker class
  --worker-connections 1000 \        # Max connections per worker
  --max-requests 1000 \              # Restart workers after 1000 requests
  --max-requests-jitter 50 \         # Add randomness to prevent all workers restarting at once
  --timeout 120 \                    # 120 second timeout
  --keep-alive 5                     # Keep connections alive for 5 seconds
```

**Capacity Calculation:**
- 8 workers × 4 threads = 32 concurrent requests
- With keep-alive and efficient processing, can handle 100-200 students simultaneously

### Resource Allocation

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '4.0'      # Maximum 4 CPU cores
        memory: 4G       # Maximum 4GB RAM
      reservations:
        cpus: '1.0'      # Minimum 1 CPU core
        memory: 1G       # Minimum 1GB RAM
```

## Database Optimization

### MySQL Configuration

```yaml
db:
  command:
    --max_connections=500                    # Support 500 concurrent connections
    --innodb_buffer_pool_size=512M          # Cache frequently accessed data
    --innodb_log_file_size=128M             # Larger transaction logs
    --innodb_flush_log_at_trx_commit=2      # Faster writes (slight durability trade-off)
    --innodb_flush_method=O_DIRECT          # Bypass OS cache for better performance
    --query_cache_type=1                    # Enable query caching
    --query_cache_size=64M                  # 64MB query cache
```

### Resource Allocation

```yaml
db:
  deploy:
    resources:
      limits:
        cpus: '2.0'      # Maximum 2 CPU cores
        memory: 2G       # Maximum 2GB RAM
      reservations:
        cpus: '0.5'      # Minimum 0.5 CPU cores
        memory: 512M     # Minimum 512MB RAM
```

## Frontend Optimization

### Nginx Configuration

The frontend uses Nginx with:
- **Gzip compression** for faster page loads
- **Static file caching** for images, CSS, JS
- **Connection keep-alive** for reduced overhead

### Resource Allocation

```yaml
frontend:
  deploy:
    resources:
      limits:
        cpus: '1.0'      # Maximum 1 CPU core
        memory: 512M     # Maximum 512MB RAM
      reservations:
        cpus: '0.25'     # Minimum 0.25 CPU cores
        memory: 128M     # Minimum 128MB RAM
```

## System Requirements

### Minimum Requirements (50-100 students)
- **CPU**: 4 cores
- **RAM**: 8GB
- **Disk**: 20GB SSD
- **Network**: 100 Mbps

### Recommended Requirements (200-500 students)
- **CPU**: 8 cores
- **RAM**: 16GB
- **Disk**: 50GB SSD
- **Network**: 1 Gbps

### High-Load Requirements (500+ students)
- **CPU**: 16 cores
- **RAM**: 32GB
- **Disk**: 100GB SSD
- **Network**: 1 Gbps
- **Consider**: Load balancer with multiple backend instances

## Performance Monitoring

### Check Container Resource Usage

```bash
# View real-time resource usage
docker stats

# View specific container
docker stats aiu_backend

# View logs for performance issues
docker compose logs -f backend
```

### Monitor Database Performance

```bash
# Access MySQL shell
docker compose exec db mysql -u aiu -paiu123 aiu_mediahub

# Check connection count
SHOW STATUS LIKE 'Threads_connected';

# Check max connections
SHOW VARIABLES LIKE 'max_connections';

# View slow queries
SHOW FULL PROCESSLIST;
```

### Monitor Backend Performance

```bash
# View backend logs
docker compose logs -f backend

# Check worker status
docker compose exec backend ps aux | grep gunicorn

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/health/
```

## Scaling Strategies

### Vertical Scaling (Single Server)

1. **Increase Resources**
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           cpus: '8.0'
           memory: 8G
   ```

2. **Increase Workers**
   ```bash
   --workers 16 \
   --threads 4
   ```

3. **Increase Database Connections**
   ```yaml
   --max_connections=1000
   --innodb_buffer_pool_size=1G
   ```

### Horizontal Scaling (Multiple Servers)

For very high loads (1000+ concurrent students):

1. **Load Balancer** (Nginx/HAProxy)
   - Distribute traffic across multiple backend instances

2. **Multiple Backend Instances**
   ```yaml
   backend_1:
     # Backend instance 1
   backend_2:
     # Backend instance 2
   backend_3:
     # Backend instance 3
   ```

3. **Separate Database Server**
   - Move MySQL to dedicated server
   - Use read replicas for read-heavy operations

4. **Redis Cache**
   - Add Redis for session storage
   - Cache frequently accessed data

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test 100 concurrent users, 1000 requests
ab -n 1000 -c 100 http://localhost:8000/api/health/

# Test with authentication
ab -n 1000 -c 100 -H "Authorization: Bearer <token>" http://localhost:8000/api/tutorials/
```

### Load Testing with wrk

```bash
# Test for 30 seconds with 100 connections
wrk -t12 -c100 -d30s http://localhost:8000/api/health/
```

## Optimization Checklist

### Before Deployment

- [ ] Set appropriate resource limits in docker-compose.yml
- [ ] Configure Gunicorn workers based on CPU cores (2-4 × CPU cores)
- [ ] Set MySQL max_connections based on expected load
- [ ] Enable query caching in MySQL
- [ ] Configure Nginx caching for static files
- [ ] Set up monitoring (Prometheus, Grafana, or similar)

### After Deployment

- [ ] Monitor resource usage with `docker stats`
- [ ] Check database connection count
- [ ] Review application logs for errors
- [ ] Test with load testing tools
- [ ] Monitor response times
- [ ] Set up alerts for high resource usage

### Ongoing Maintenance

- [ ] Review logs weekly for performance issues
- [ ] Monitor disk space usage
- [ ] Check for slow database queries
- [ ] Update dependencies regularly
- [ ] Backup database daily
- [ ] Test disaster recovery procedures

## Troubleshooting Performance Issues

### High CPU Usage

**Symptoms:**
- Slow response times
- High CPU usage in `docker stats`

**Solutions:**
1. Increase CPU limits in docker-compose.yml
2. Optimize database queries (add indexes)
3. Enable query caching
4. Add Redis for caching

### High Memory Usage

**Symptoms:**
- Out of memory errors
- Container restarts

**Solutions:**
1. Increase memory limits
2. Reduce number of Gunicorn workers
3. Optimize database buffer pool size
4. Check for memory leaks in application code

### Database Connection Errors

**Symptoms:**
- "Too many connections" errors
- Connection timeouts

**Solutions:**
1. Increase max_connections in MySQL
2. Reduce number of Gunicorn workers
3. Implement connection pooling
4. Close idle connections

### Slow Response Times

**Symptoms:**
- Pages load slowly
- API requests timeout

**Solutions:**
1. Add database indexes
2. Enable query caching
3. Optimize slow queries
4. Add Redis caching
5. Use CDN for static files

## Best Practices

1. **Monitor Everything**
   - Set up monitoring before issues occur
   - Track response times, error rates, resource usage

2. **Test Under Load**
   - Perform load testing before production
   - Test with realistic user scenarios

3. **Plan for Growth**
   - Start with conservative settings
   - Scale gradually based on actual usage

4. **Regular Maintenance**
   - Review logs weekly
   - Update dependencies monthly
   - Test backups regularly

5. **Document Changes**
   - Keep track of configuration changes
   - Document performance tuning decisions

## Additional Resources

- [Gunicorn Performance Tuning](https://docs.gunicorn.org/en/stable/design.html)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [Docker Resource Constraints](https://docs.docker.com/config/containers/resource_constraints/)
- [Nginx Performance Tuning](https://www.nginx.com/blog/tuning-nginx/)

---

**Last Updated:** March 2026

For questions or issues, refer to the main README.md or DOCKER_DEPLOYMENT_GUIDE.md
