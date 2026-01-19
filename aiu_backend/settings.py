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
DEBUG = os.getenv("DEBUG", "True").lower() in ("1", "true", "yes", "y")

# ---------------- HOSTS ----------------
ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1,172.16.112.91"
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

# 1️⃣ Preferred: Railway MYSQL_URL (Recommended)
MYSQL_URL = os.getenv("MYSQL_URL")

# 2️⃣ Fallback: Railway individual vars
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE") or os.getenv("MYSQLDATABASE")
MYSQL_USER = os.getenv("MYSQLUSER")
MYSQL_PASSWORD = os.getenv("MYSQLPASSWORD") or os.getenv("MYSQL_ROOT_PASSWORD")
MYSQL_HOST = os.getenv("MYSQLHOST")
MYSQL_PORT = os.getenv("MYSQLPORT", "3306")

# 3️⃣ Legacy support (your DB_* vars)
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASES = {}

if MYSQL_URL:
    # Railway native connection string
    parsed = urlparse(MYSQL_URL)
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.mysql",
        "NAME": parsed.path.lstrip("/"),
        "USER": parsed.username,
        "PASSWORD": parsed.password,
        "HOST": parsed.hostname,
        "PORT": parsed.port or "3306",
        "OPTIONS": {"charset": "utf8mb4"},
    }

elif MYSQL_HOST and MYSQL_DATABASE and MYSQL_USER and MYSQL_PASSWORD:
    # Railway individual vars
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.mysql",
        "NAME": MYSQL_DATABASE,
        "USER": MYSQL_USER,
        "PASSWORD": MYSQL_PASSWORD,
        "HOST": MYSQL_HOST,
        "PORT": MYSQL_PORT,
        "OPTIONS": {"charset": "utf8mb4"},
    }

elif DB_HOST and DB_NAME and DB_USER and DB_PASSWORD:
    # Legacy DB_* support
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.mysql",
        "NAME": DB_NAME,
        "USER": DB_USER,
        "PASSWORD": DB_PASSWORD,
        "HOST": DB_HOST,
        "PORT": DB_PORT,
        "OPTIONS": {"charset": "utf8mb4"},
    }

else:
    # Local dev fallback ONLY
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "aiu_local",
        "USER": "root",
        "PASSWORD": "",
        "HOST": "127.0.0.1",
        "PORT": "3306",
        "OPTIONS": {"charset": "utf8mb4"},
    }

# Fail fast in production if DB is misconfigured (prevents mysqld.sock / localhost crash)
if not DEBUG and DATABASES["default"]["HOST"] in ("localhost", "127.0.0.1"):
    raise RuntimeError(
        "Production DB misconfiguration: using localhost. "
        "Set MYSQL_URL (recommended) or MYSQLHOST / MYSQLDATABASE / MYSQLUSER / MYSQLPASSWORD."
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

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------- CORS ----------------
DEFAULT_CORS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://172.16.112.91:5173",
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

# ---------------- RAILWAY / PROXY HTTPS (important when DEBUG=False) ----------------
# Railway runs behind a proxy (HTTPS -> your app). Helps CSRF/cookies/admin.
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
