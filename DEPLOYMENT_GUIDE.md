# AIU Media Hub - Deployment Guide

## Local Development with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git (already initialized)

### Setup

1. **Clone the repository** (if needed):
   ```bash
   git clone <your-repo-url>
   cd aiu_media_hub
   ```

2. **Create `.env` file** from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

4. **Verify services**:
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:80
   - MySQL: localhost:3306

5. **Create superuser** (optional):
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

6. **Stop services**:
   ```bash
   docker-compose down
   ```

---

## Railway Deployment

### Prerequisites
1. Railway account (https://railway.app)
2. GitHub repository connected to Railway
3. MySQL plugin added in Railway

### Deployment Steps

1. **Create a new Railway project**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"

2. **Add MySQL Plugin**
   - In your Railway project, click "Add Service" → "MySQL"
   - Railway will auto-generate MySQL variables

3. **Set Environment Variables** (in Railway dashboard):
   ```
   DJANGO_SECRET_KEY=<generate-a-secure-key>
   DEBUG=False
   ALLOWED_HOSTS=your-railway-domain.up.railway.app
   FRONTEND_URL=https://your-frontend-domain.com
   ```

4. **Database Connection**
   - Railway automatically provides `MYSQL_URL` and individual MySQL variables
   - Your `settings.py` will auto-detect these

5. **Deploy**
   - Push your code to GitHub:
     ```bash
     git add .
     git commit -m "Dockerized and ready for deployment"
     git push origin main
     ```
   - Railway will automatically build and deploy from your Dockerfile

6. **Verify Deployment**
   - Check Railway dashboard for build logs
   - Visit your Railway domain to test

---

## Project Structure

```
aiu_media_hub/
├── aiu_backend/
│   ├── Dockerfile          # Backend container definition
│   ├── settings.py         # Django settings (production-ready)
│   ├── wsgi.py
│   ├── urls.py
│   └── ...
├── api/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   └── ...
├── frontend/
│   ├── Dockerfile          # Frontend container definition
│   ├── nginx.conf          # Nginx proxy configuration
│   ├── src/
│   └── ...
├── docker-compose.yml      # Local development setup
├── Procfile                # Railway deployment configuration
├── requirements.txt        # Python dependencies
├── .dockerignore           # Files to ignore in Docker build
├── .env.example            # Environment variables template
└── manage.py
```

---

## Key Components Verified ✅

- ✅ **Backend Dockerfile**: Correctly references `aiu_backend.wsgi`
- ✅ **Frontend Dockerfile**: Multi-stage build with Nginx
- ✅ **docker-compose.yml**: MySQL + Backend + Frontend with health checks
- ✅ **settings.py**: WhiteNoise for static files, production-ready
- ✅ **nginx.conf**: Proper proxy to backend, SPA routing
- ✅ **requirements.txt**: All dependencies including gunicorn, whitenoise
- ✅ **Procfile**: Railway deployment command
- ✅ **.dockerignore**: Optimized Docker builds
- ✅ **.env.example**: Clear environment variable documentation

---

## Troubleshooting

### Docker Issues
- **MySQL not connecting**: Check `MYSQL_HOST` is `db` in docker-compose
- **Port already in use**: Change ports in docker-compose.yml
- **Permission denied**: Use `sudo docker-compose` or add user to docker group

### Railway Issues
- **Build fails**: Check `build.logs` in Railway dashboard
- **Database connection fails**: Verify MySQL plugin is added
- **Static files not loading**: Ensure `collectstatic` runs in Procfile

### Database Issues
- **Migration errors**: Delete `mysql_data` volume and rebuild
- **Schema mismatch**: Run `python manage.py migrate` manually

---

## Next Steps

1. Test locally: `docker-compose up`
2. Fix any issues in logs
3. Commit all changes to git
4. Push to GitHub
5. Deploy to Railway

Good luck! 🚀
