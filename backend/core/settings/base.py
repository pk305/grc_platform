"""Settings shared by every environment."""

import base64
import hashlib
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
    CORS_ALLOWED_ORIGINS=(list, []),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Fernet key encrypting MFA (TOTP) secrets at rest. Falls back to a key
# derived from SECRET_KEY for convenience — production deployments should
# set an explicit MFA_ENCRYPTION_KEY so rotating SECRET_KEY doesn't also
# invalidate every enrolled user's MFA secret.
MFA_ENCRYPTION_KEY = env(
    "MFA_ENCRYPTION_KEY",
    default=base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode()).digest()),
)

INSTALLED_APPS = [
    # Must be first: this is what makes `runserver` patch itself into an
    # ASGI+WebSocket server in dev, instead of plain WSGI.
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "corsheaders",
    "strawberry_django",
    "channels",
    # local
    "domains.iam",
    "domains.risk",
    "domains.controls",
    "domains.audit",
    "domains.incidents",
    "domains.obligations",
    "domains.notifications",
    "domains.chat",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {"default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "iam.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
# The frontend calls the GraphQL API with fetch credentials: 'include' so the
# session cookie round-trips; that only works if credentialed requests are allowed.
CORS_ALLOW_CREDENTIALS = True

# Sign-in is restricted to this email domain, plus any explicit exceptions
# (e.g. a break-glass admin account). Enforced server-side in the login
# mutation — the frontend's own check is UX only and isn't a security boundary.
ALLOWED_LOGIN_DOMAIN = env("ALLOWED_LOGIN_DOMAIN", default="acentriagroup.com")
ALLOWED_LOGIN_EMAILS = env.list("ALLOWED_LOGIN_EMAILS", default=["pknuek@gmail.com"])

# Base URL of the frontend app — used to build links (e.g. password reset) sent by email.
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="no-reply@acentriagroup.com")
# Defaults to printing emails to the console; set a real backend via env in production.
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")

# Microsoft Graph app registration used to create Teams meetings for chat
# calls (domains.chat.calls). Left unset in dev — calling fails with a clear
# "not configured" error rather than a broken button. See .env.example.
MS_GRAPH_TENANT_ID = env("MS_GRAPH_TENANT_ID", default="")
MS_GRAPH_CLIENT_ID = env("MS_GRAPH_CLIENT_ID", default="")
MS_GRAPH_CLIENT_SECRET = env("MS_GRAPH_CLIENT_SECRET", default="")

# Backs the Channels layer that carries chat's realtime events (new messages,
# rail updates, presence) between ASGI workers — see domains/chat/realtime.py.
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/1")
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            # `socket_timeout` must exceed RedisChannelLayer.brpop_timeout
            # (5s, hardcoded): channels_redis polls with a 5s blocking Redis
            # read and treats an empty reply as "nothing yet, poll again" —
            # but with no explicit socket_timeout, newer redis-py versions
            # default to a *shorter* client-side socket read timeout, so the
            # client's own socket gives up before Redis's 5s blocking call
            # even returns, surfacing as a `redis.exceptions.TimeoutError`
            # that kills the socket's dispatch loop on every idle cycle.
            "hosts": [{"address": REDIS_URL, "socket_timeout": 20}],
        },
    }
}

# The "is someone online" counters realtime.py keeps, one connection-count
# per user. A separate cache alias (rather than reusing "default") so the
# test settings can swap it for an in-process backend without affecting
# anything else that might use caching later.
CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    "chat_presence": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    },
}

# https://strawberry.rocks/docs/django/guide/settings
STRAWBERRY_DJANGO = {
    "FIELD_DESCRIPTION_FROM_HELP_TEXT": True,
    "TYPE_DESCRIPTION_FROM_MODEL_DOCSTRING": True,
    "MUTATIONS_DEFAULT_HANDLE_ERRORS": True,
    "GENERATE_ENUMS_FROM_CHOICES": True,
    "MAP_AUTO_ID_AS_GLOBAL_ID": False,
}
