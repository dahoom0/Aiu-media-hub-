"""
AIU Media Hub - Django Settings Configuration Snippets

This file contains example configuration snippets for your Django project's settings.py file.
Copy and paste the relevant sections into your aiu_backend/settings.py file.

IMPORTANT: This is a reference file, not a complete settings.py file.
"""

# =============================================================================
# SECURITY WARNING: Keep the secret key used in production secret!
# Generate a new one for production using: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
# =============================================================================

SECRET_KEY = 'django-insecure-your-secret-key-here-change-in-production'

# =============================================================================
# DEBUG SETTING
# =============================================================================

DEBUG = True  # Set to False in production

# =============================================================================
# ALLOWED HOSTS
# =============================================================================

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    # Add your production domain here, e.g.:
    # 'api.aiu.edu.my',
    # 'aiu-media-hub.com',
]

# =============================================================================
# INSTALLED APPS
# =============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',  # For JWT authentication
    
    # Your apps
    'api',  # Main API app
]

# =============================================================================
# MIDDLEWARE
# =============================================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware - must be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =============================================================================
# DATABASE CONFIGURATION - MySQL
# =============================================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'aiu_media_hub',           # Database name
        'USER': 'aiu_user',                # Database user
        'PASSWORD': 'your_secure_password', # Database password - CHANGE THIS!
        'HOST': 'localhost',               # Database server (localhost for local dev)
        'PORT': '3306',                    # MySQL default port
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}

# Alternative: SQLite for development/testing
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# =============================================================================
# CORS CONFIGURATION
# =============================================================================

# Allow requests from your React frontend
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',      # Vite default dev server
    'http://localhost:3000',      # Alternative React dev server
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    # Add your production frontend URL here, e.g.:
    # 'https://aiu-media-hub.com',
    # 'https://www.aiu-media-hub.com',
]

# Alternative: Allow all origins (NOT recommended for production)
# CORS_ALLOW_ALL_ORIGINS = True

# Allow credentials (cookies, authorization headers, etc.)
CORS_ALLOW_CREDENTIALS = True

# Allowed HTTP methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Allowed headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# =============================================================================
# REST FRAMEWORK CONFIGURATION
# =============================================================================

REST_FRAMEWORK = {
    # Default authentication classes
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    
    # Default permission classes
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    
    # Pagination
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    
    # Filtering
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    
    # Datetime format
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
}

# =============================================================================
# JWT AUTHENTICATION SETTINGS
# =============================================================================

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# =============================================================================
# STATIC FILES (CSS, JavaScript, Images)
# =============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # For production (collectstatic)

STATICFILES_DIRS = [
    BASE_DIR / 'static',  # Additional static files directory
]

# =============================================================================
# MEDIA FILES (User Uploads)
# =============================================================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# =============================================================================
# CUSTOM USER MODEL (Optional - if you want to extend the User model)
# =============================================================================

# If you create a custom user model, uncomment and adjust:
# AUTH_USER_MODEL = 'api.CustomUser'

# =============================================================================
# PASSWORD VALIDATION
# =============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# =============================================================================
# INTERNATIONALIZATION
# =============================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kuala_Lumpur'  # Malaysia timezone
USE_I18N = True
USE_TZ = True

# =============================================================================
# DEFAULT PRIMARY KEY FIELD TYPE
# =============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# LOGGING CONFIGURATION (Optional but recommended)
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
import os
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# =============================================================================
# SECURITY SETTINGS FOR PRODUCTION
# =============================================================================

# Uncomment these settings when deploying to production:

# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_BROWSER_XSS_FILTER = True
# SECURE_CONTENT_TYPE_NOSNIFF = True
# SECURE_HSTS_SECONDS = 31536000  # 1 year
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

# =============================================================================
# EMAIL CONFIGURATION (for password reset, notifications, etc.)
# =============================================================================

# Development: Console backend (prints emails to console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Production: SMTP backend (example with Gmail)
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = 'your-email@gmail.com'
# EMAIL_HOST_PASSWORD = 'your-app-password'
# DEFAULT_FROM_EMAIL = 'AIU Media Hub <noreply@aiu.edu.my>'

# =============================================================================
# FILE UPLOAD SETTINGS
# =============================================================================

# Maximum upload size (in bytes) - 100MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB

# Allowed file extensions for uploads
ALLOWED_UPLOAD_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'gif', 'pdf', 
    'mp4', 'mov', 'avi', 'mkv',  # Video files
    'doc', 'docx', 'ppt', 'pptx',  # Documents
]

# =============================================================================
# ADDITIONAL NOTES
# =============================================================================

"""
ENVIRONMENT VARIABLES (Recommended for Production):

Instead of hardcoding sensitive values, use environment variables:

1. Install python-decouple:
   pip install python-decouple

2. Create a .env file in your project root:
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   DB_NAME=aiu_media_hub
   DB_USER=aiu_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=3306

3. In settings.py, use:
   from decouple import config
   
   SECRET_KEY = config('SECRET_KEY')
   DEBUG = config('DEBUG', default=False, cast=bool)
   
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.mysql',
           'NAME': config('DB_NAME'),
           'USER': config('DB_USER'),
           'PASSWORD': config('DB_PASSWORD'),
           'HOST': config('DB_HOST', default='localhost'),
           'PORT': config('DB_PORT', default='3306'),
       }
   }
"""
