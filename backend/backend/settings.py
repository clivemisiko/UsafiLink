import os
from pathlib import Path
from decouple import config
from datetime import timedelta
from django.core.management.utils import get_random_secret_key

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-usafilink-secret-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,usafi.onrender.com,usafi-backend.onrender.com,usafilink-backend.onrender.com').split(',')

CSRF_TRUSTED_ORIGINS = [
    "https://*.loca.lt",
    "http://localhost:5173",
    "https://usafi-frontend.onrender.com",
    "https://usafi-backend.onrender.com",
    "https://usafilink-backend.onrender.com",
]

# Application definition
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
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'django_celery_beat',
    
    # Local apps
    'users',
    'users.admin_panel',
    'bookings',
    'payments',
    'tracking',
    'vehicles.apps.VehiclesConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Duplicate corsheaders entries removed (handled earlier)
CORS_ALLOW_ALL_ORIGINS = True   # quick dev mode
# or restrict:
# CORS_ALLOWED_ORIGINS = [
#     "http://10.0.2.2:8000",
#     "http://localhost:8000",
# ]


ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

import dj_database_url

# Prioritize REAL environment variables (os.environ) over .env file for sensitive production settings
# Render sets the 'RENDER' environment variable
IS_PRODUCTION = os.environ.get('RENDER') or os.environ.get('RAILWAY_ENVIRONMENT')

# Use OS environment directly for DATABASE_URL to avoid being misled by committed .env files
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=config('DB_SSL_REQUIRE', default=False, cast=bool)
        )
    }
    if DATABASES['default'].get('ENGINE') == 'django.db.backends.mysql':
        DATABASES['default'].setdefault('OPTIONS', {})
        DATABASES['default']['OPTIONS'].update({
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        })
elif config('DB_HOST', default='').strip() and not (IS_PRODUCTION and config('DB_HOST') == 'localhost'):
    # Manual MySQL configuration (only use if not accidentally 'localhost' in production)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': config('DB_NAME'),
            'USER': config('DB_USER'),
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': config('DB_HOST'),
            'PORT': config('DB_PORT', default='3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                'charset': 'utf8mb4',
            }
        }
    }
else:
    # Local development with SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Africa/Nairobi'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []  # Backend service is separate from frontend service

# Ensure build.sh can run collectstatic even if dirs are empty
if not (BASE_DIR / 'static').exists():
    os.makedirs(BASE_DIR / 'static', exist_ok=True)

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'users.User'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

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
    'Bypass-Tunnel-Reminder',
]

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# Google Auth Configuration
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')

# IntaSend Configuration
INTASEND_PUBLIC_KEY = config('INTASEND_PUBLIC_KEY', default='')
INTASEND_SECRET_KEY = config('INTASEND_SECRET_KEY', default='')
INTASEND_ENV = config('INTASEND_ENV', default='sandbox')  # 'sandbox', 'live', or 'production'
INTASEND_CALLBACK_URL = config('INTASEND_CALLBACK_URL', default='http://localhost:8000/api/payments/intasend/callback/')

# IntaSend API endpoints
INTASEND_BASE_URL = 'https://sandbox.intasend.com' if INTASEND_ENV == 'sandbox' else 'https://payment.intasend.com'
INTASEND_API_URL = f'{INTASEND_BASE_URL}/api/v1'

# Log Intasend configuration
print(f"INTASEND CONFIG: ENV={INTASEND_ENV}, BASE_URL={INTASEND_BASE_URL}")
if INTASEND_ENV != 'sandbox' and not INTASEND_PUBLIC_KEY:
    print("WARNING: Using LIVE Intasend API but INTASEND_PUBLIC_KEY is not set!")

# Africa's Talking SMS Configuration
AFRICASTALKING_USERNAME = config('AFRICASTALKING_USERNAME', default='Usafilink')
AFRICASTALKING_API_KEY = config('AFRICASTALKING_API_KEY', default='atsk_59e148d226157f27a6c7141c6574ca332662dece7be9a7e4c47dcdc1e4eafb3764a5ff52')
AFRICASTALKING_SENDER_ID = config('AFRICASTALKING_SENDER_ID', default=None)

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)

# Support both standard Django and user-provided names
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default=config('MAIL_USERNAME', default=''))
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default=config('MAIL_PASSWORD', default=''))
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=config('MAIL_DEFAULT_SENDER', default=''))

# If no explicit sender was configured, use the authenticated SMTP user.
if not DEFAULT_FROM_EMAIL and EMAIL_HOST_USER:
    DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Startup check (Masked password)
if EMAIL_HOST_USER:
    print(f"EMAIL CONFIG: Attempting to use {EMAIL_HOST_USER} for SMTP")
    print(f"DEFAULT_FROM_EMAIL={DEFAULT_FROM_EMAIL}")
else:
    print("WARNING: No EMAIL_HOST_USER or MAIL_USERNAME found in .env")

# Email verification settings
EMAIL_VERIFICATION_REQUIRED = True
EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = 24


# Celery Configuration
# Priority: explicit CELERY_TASK_ALWAYS_EAGER env var > broker URL > production detection
IS_PRODUCTION = os.environ.get('RENDER') or os.environ.get('RAILWAY_ENVIRONMENT')
PROD_BROKER_URL = config('CELERY_BROKER_URL', default=None)
PROD_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default=None)
EAGER_MODE_ENV = os.environ.get('CELERY_TASK_ALWAYS_EAGER', '').lower() in ('true', '1', 'yes')

if EAGER_MODE_ENV:
    # Explicitly set to eager mode
    CELERY_BROKER_URL = 'memory://'
    CELERY_RESULT_BACKEND = 'cache+memory://'
    CELERY_TASK_ALWAYS_EAGER = True
elif PROD_BROKER_URL:
    # Use real Redis broker (e.g., from Upstash)
    CELERY_BROKER_URL = PROD_BROKER_URL
    CELERY_RESULT_BACKEND = PROD_RESULT_BACKEND or PROD_BROKER_URL
    CELERY_TASK_ALWAYS_EAGER = False
elif IS_PRODUCTION:
    # Production without broker and no eager mode set = use eager mode (synchronous)
    CELERY_BROKER_URL = 'memory://'
    CELERY_RESULT_BACKEND = 'cache+memory://'
    CELERY_TASK_ALWAYS_EAGER = True
else:
    # Local development = use local Redis
    CELERY_BROKER_URL = 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
    CELERY_TASK_ALWAYS_EAGER = False

REDIS_URL = CELERY_BROKER_URL

# Base URL for redirects
BASE_URL = config('BASE_URL', default='http://localhost:8000')

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Windows compatibility: Use solo pool instead of prefork
# This avoids billiard process pool issues on Windows
import platform
if platform.system() == 'Windows':
    CELERY_WORKER_POOL = 'solo'
    CELERY_WORKER_PREFETCH_MULTIPLIER = 1
    CELERY_WORKER_MAX_TASKS_PER_CHILD = 1

# Celery Beat Schedule
from celery.schedules import crontab
CELERY_BEAT_SCHEDULE = {
    'check_driver_timeouts': {
        'task': 'bookings.tasks.check_driver_timeouts',
        'schedule': 10.0, # Every 10 seconds
    },
    'cleanup_old_bookings': {
        'task': 'bookings.tasks.cleanup_old_bookings',
        'schedule': crontab(hour=0, minute=0), # Daily at midnight
    },
    'auto_cancel_pending_bookings': {
        'task': 'bookings.tasks.auto_cancel_pending_bookings',
        'schedule': crontab(hour='*/1', minute=0), # Every hour
    },
}
