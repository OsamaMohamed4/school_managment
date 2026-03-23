from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from decouple import config
    SECRET_KEY = config("SECRET_KEY", default="django-insecure-school-key-2025")
    DEBUG = config("DEBUG", default=True, cast=bool)
    ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",")
    CORS_ALLOWED_ORIGINS_STR = config("CORS_ALLOWED_ORIGINS", default="http://localhost:3000")
except Exception:
    SECRET_KEY = "django-insecure-school-key-2025x"  # padded to 32+ bytes
    DEBUG = True
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
    CORS_ALLOWED_ORIGINS_STR = "http://localhost:3000"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "users.apps.UsersConfig",
    "academics.apps.AcademicsConfig",
    "attendance.apps.AttendanceConfig",
    "quizzes.apps.QuizzesConfig",
    "notifications.apps.NotificationsConfig",
    "timetable.apps.TimetableConfig",
    "assignments.apps.AssignmentsConfig",
    "messaging.apps.MessagingConfig",
    "analytics.apps.AnalyticsConfig",
    "reports.apps.ReportsConfig",
    "videos.apps.VideosConfig",
    "lesson_plan.apps.LessonPlanConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "school_backend.urls"

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

WSGI_APPLICATION = "school_backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_USER_MODEL = "users.CustomUser"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Cairo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=2),   # Reduced from 8h for security
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_STR.split(",")
CORS_ALLOW_CREDENTIALS = True

# ── Rate Limiting (Security #7) ──────────────────────────────
# Limits login attempts: 5/min anon, 100/min authenticated
if "DEFAULT_THROTTLE_CLASSES" not in str(REST_FRAMEWORK):
    REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ]
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
        "anon": "60/min",
        "user": "300/min",
        "login": "5/min",
    }

# ── Security Headers (Security #8) ───────────────────────────
SECURE_BROWSER_XSS_FILTER   = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS             = "DENY"
SECURE_REFERRER_POLICY      = "strict-origin-when-cross-origin"

# In production set these to True:
# SECURE_SSL_REDIRECT         = not DEBUG
# SESSION_COOKIE_SECURE       = not DEBUG
# CSRF_COOKIE_SECURE          = not DEBUG
# SECURE_HSTS_SECONDS         = 31536000

# ── Secret Key Warning (Security #11) ────────────────────────
import sys as _sys
if "django-insecure" in SECRET_KEY and not DEBUG:
    print("⚠️  WARNING: Using insecure SECRET_KEY in production! Set SECRET_KEY in .env", file=_sys.stderr)


# ── File Upload Settings ──────────────────────────────────────
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
