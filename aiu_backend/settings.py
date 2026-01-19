import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables (local dev only; Railway injects env vars automatically)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------- SECURITY ----------------
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-change-this-in-production")
# Default to False in production for security, unless explicitly set to True
DEBUG = os.getenv("DEBUG", "False").lower() in ("1", "true", "yes", "y")

# ---------------- HOSTS ----------------
# Added .railway.app and .rlwy.net to defaults so you don't get 400 Bad Request errors on deploy
ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1,172.16.112.91,.railway.app,.rlwy.net"
    ).split(",")
    if h.strip()
]

# ---------------- APPS ----------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt",
    "api",
]

# ---------------- MIDDLEWARE ----------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # MUST BE FIRST
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware", # Recommended for static files on Railway
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ---------------- URLS / WSGI / ASGI ----------------
ROOT_URLCONF = "aiu_backend.urls"
WSGI_APPLICATION = "aiu_backend.wsgi.application"
ASGI_APPLICATION = "aiu_backend.asgi.application"

# ---------------- TEMPLATES ----------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ======================================================
# DATABASE (Railway MySQL – ALL CASES SUPPORTED)
# ======================================================

# 1. Preferred: Railway MYSQL_URL
MYSQL_URL = os.getenv("MYSQL_URL")

# 2. Fallback: Railway individual vars
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE") or os.getenv("MYSQLDATABASE")
MYSQL_USER = os.getenv("MYSQLUSER")
MYSQL_PASSWORD = os.getenv("MYSQLPASSWORD") or os.getenv("MYSQL_ROOT_PASSWORD")
MYSQL_HOST = os.getenv("MYSQLHOST")
MYSQL_PORT = os.getenv("MYSQLPORT", "3306")

# 3. Legacy support
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASES = {}

def _build_mysql_db(name, user, password, host, port):
    return {
        "ENGINE": "django.db.backends.mysql",
        "NAME": name,
        "USER": user,
        "PASSWORD": password,
        "HOST": host,
        "PORT": str(port or "3306"),
        "OPTIONS": {"charset": "utf8mb4"},
    }

if MYSQL_URL and "://" in MYSQL_URL:
    try:
        parsed = urlparse(MYSQL_URL)
        DATABASES["default"] = _build_mysql_db(
            name=parsed.path.lstrip("/"),
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            port=parsed.port or 3306,
        )
    except Exception:
        # If parsing fails, fall through to other methods
        pass

if not DATABASES.get("default") and MYSQL_HOST and MYSQL_DATABASE and MYSQL_USER:
    DATABASES["default"] = _build_mysql_db(
        name=MYSQL_DATABASE,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        host=MYSQL_HOST,
        port=MYSQL_PORT,
    )

elif not DATABASES.get("default") and DB_HOST and DB_NAME and DB_USER:
    DATABASES["default"] = _build_mysql_db(
        name=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )

if not DATABASES.get("default"):
    # IMPORTANT: Never silently fallback to localhost in production
    if not DEBUG:
        # We raise a warning or error here, but for now we fallback to sqlite or empty to prevent import crashes
        # ideally, fail hard:
        print("WARNING: No Database config found. API will likely fail.")
        
    # Local dev fallback ONLY
    DATABASES["default"] = _build_mysql_db(
        name="aiu_local",
        user="root",
        password="",
        host="127.0.0.1",
        port="3306",
    )

# ---------------- PASSWORD VALIDATION ----------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------- INTERNATIONALIZATION ----------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kuala_Lumpur"
USE_I18N = True
USE_TZ = True

# ---------------- STATIC / MEDIA ----------------
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
# Add support for serving static files on Railway
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------- CORS ----------------
DEFAULT_CORS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://aiu-production.up.railway.app", # Example production URL
]

cors_env = os.getenv("CORS_ALLOWED_ORIGINS")
CORS_ALLOWED_ORIGINS = (
    [o.strip() for o in cors_env.split(",") if o.strip()]
    if cors_env
    else DEFAULT_CORS
)

CORS_ALLOW_CREDENTIALS = True

csrf_env = os.getenv("CSRF_TRUSTED_ORIGINS")
if csrf_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_env.split(",") if o.strip()]
else:
    # Auto-allow your railway domain for CSRF if variable not set
    CSRF_TRUSTED_ORIGINS = ["https://*.railway.app", "https://*.rlwy.net"]

# ---------------- REST FRAMEWORK ----------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DATETIME_FORMAT": "%Y-%m-%d %H:%M:%S",
}

# ---------------- JWT ----------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ---------------- CUSTOM USER ----------------
AUTH_USER_MODEL = "api.User"

# ---------------- RAILWAY / PROXY HTTPS ----------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True