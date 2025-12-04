# AIU Media Hub - Django Backend Setup Guide

This guide will walk you through setting up the Django REST Framework backend for the AIU Media Hub platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** (check with `python --version` or `python3 --version`)
- **pip** (Python package manager, usually comes with Python)
- **virtualenv** (install with `pip install virtualenv`)
- **MySQL Server 5.7+** (or MariaDB)
- **MySQL client development files** (required for Python MySQL connector)

### Installing MySQL client development files:

**Ubuntu/Debian:**
```bash
sudo apt-get install python3-dev default-libmysqlclient-dev build-essential
```

**macOS:**
```bash
brew install mysql
```

**Windows:**
- Download and install MySQL Connector/C from the official MySQL website

---

## Step 1: Create Project Directory

```bash
mkdir aiu-media-hub-backend
cd aiu-media-hub-backend
```

---

## Step 2: Create and Activate Virtual Environment

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt, indicating the virtual environment is active.

---

## Step 3: Install Django and Dependencies

```bash
pip install --upgrade pip
pip install django djangorestframework
pip install mysqlclient
pip install django-cors-headers
pip install pillow  # For image handling in portfolios
pip install djangorestframework-simplejwt  # For JWT authentication
```

---

## Step 4: Create Django Project and App

```bash
django-admin startproject aiu_backend .
python manage.py startapp api
```

Your project structure should now look like:
```
aiu-media-hub-backend/
├── venv/
├── aiu_backend/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── api/
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── tests.py
│   └── views.py
└── manage.py
```

---

## Step 5: Configure MySQL Database

### Create MySQL Database

Log into MySQL:
```bash
mysql -u root -p
```

Create the database and user:
```sql
CREATE DATABASE aiu_media_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aiu_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON aiu_media_hub.* TO 'aiu_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Update Django settings.py

Open `aiu_backend/settings.py` and update the `DATABASES` configuration:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'aiu_media_hub',
        'USER': 'aiu_user',
        'PASSWORD': 'your_secure_password',
        'HOST': 'localhost',  # Or '127.0.0.1'
        'PORT': '3306',       # Default MySQL port
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}
```

**Configuration Parameters:**
- **ENGINE**: Always `django.db.backends.mysql` for MySQL
- **NAME**: Database name (created above)
- **USER**: Database user (created above)
- **PASSWORD**: User's password (set above)
- **HOST**: Database server address (`localhost` for local development)
- **PORT**: MySQL port (default is `3306`)

---

## Step 6: Configure Django Settings for REST API

Refer to the `DJANGO_SETTINGS_SNIPPET.py` file in the project root for complete configuration examples including:

- INSTALLED_APPS with REST Framework and CORS
- CORS settings for React frontend
- ALLOWED_HOSTS configuration
- Static and media file settings
- JWT authentication settings

---

## Step 7: Run Initial Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

This will create all the necessary database tables for Django's built-in apps.

---

## Step 8: Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account:
- Username: (e.g., `admin`)
- Email: (e.g., `admin@aiu.edu.my`)
- Password: (create a secure password)

---

## Step 9: Test the Server

```bash
python manage.py runserver
```

Visit `http://localhost:8000/admin/` and log in with your superuser credentials.

---

## Step 10: Create Models for AIU Media Hub

Create models in `api/models.py` for:
- **User** (extend Django's User model or create custom)
- **Tutorial** (video title, description, category, video URL, etc.)
- **LabBooking** (student, lab room, date, time slot, status, admin approval)
- **Equipment** (name, type, QR code, location, availability status)
- **EquipmentRental** (student, equipment, checkout time, return time, status)
- **Portfolio** (student, auto-generated content, projects, media)

Example model structure:

```python
from django.db import models
from django.contrib.auth.models import User

class Tutorial(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    video_url = models.URLField()
    thumbnail = models.ImageField(upload_to='tutorials/')
    duration = models.IntegerField(help_text='Duration in seconds')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

# Add more models as needed...
```

After creating models, run:
```bash
python manage.py makemigrations api
python manage.py migrate
```

---

## Step 11: Create API Views and Serializers

Create `api/serializers.py`:
```python
from rest_framework import serializers
from .models import Tutorial

class TutorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tutorial
        fields = '__all__'
```

Create views in `api/views.py`:
```python
from rest_framework import viewsets
from .models import Tutorial
from .serializers import TutorialSerializer

class TutorialViewSet(viewsets.ModelViewSet):
    queryset = Tutorial.objects.all()
    serializer_class = TutorialSerializer
```

---

## Step 12: Configure URLs

Update `aiu_backend/urls.py`:
```python
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import TutorialViewSet

router = DefaultRouter()
router.register(r'tutorials', TutorialViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]
```

---

## Step 13: Run and Test

```bash
python manage.py runserver
```

Your API endpoints will be available at:
- `http://localhost:8000/api/tutorials/` - List/create tutorials
- `http://localhost:8000/api/tutorials/{id}/` - Retrieve/update/delete specific tutorial
- `http://localhost:8000/admin/` - Django admin panel

---

## Next Steps

1. **Connect Frontend**: Update the React frontend's `.env` file with `VITE_API_BASE_URL=http://localhost:8000`
2. **Add Authentication**: Implement JWT authentication for secure API access
3. **Create All Models**: Build out all required models for the complete system
4. **Add Permissions**: Set up role-based permissions (student vs. admin)
5. **File Uploads**: Configure media handling for tutorial videos, portfolio images, etc.
6. **Deployment**: Prepare for production deployment (Gunicorn, Nginx, etc.)

---

## Useful Commands

**Activate virtual environment:**
- macOS/Linux: `source venv/bin/activate`
- Windows: `venv\Scripts\activate`

**Deactivate virtual environment:**
```bash
deactivate
```

**Create new migrations after model changes:**
```bash
python manage.py makemigrations
```

**Apply migrations:**
```bash
python manage.py migrate
```

**Run development server:**
```bash
python manage.py runserver
```

**Run on different port:**
```bash
python manage.py runserver 8080
```

**Create app:**
```bash
python manage.py startapp app_name
```

**Collect static files:**
```bash
python manage.py collectstatic
```

---

## Troubleshooting

**mysqlclient installation fails:**
- Ensure MySQL client development files are installed
- On Windows, you might need to use `pip install pymysql` instead, then add to `settings.py`:
  ```python
  import pymysql
  pymysql.install_as_MySQLdb()
  ```

**CORS errors when connecting frontend:**
- Verify `django-cors-headers` is installed and configured in settings
- Check `CORS_ALLOWED_ORIGINS` includes your React dev server URL

**Database connection errors:**
- Verify MySQL is running: `sudo systemctl status mysql` (Linux)
- Check database credentials in `settings.py`
- Ensure the database exists: `SHOW DATABASES;` in MySQL

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [django-cors-headers Documentation](https://github.com/adamchainz/django-cors-headers)
