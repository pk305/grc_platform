from .base import *  # noqa: F403

SECRET_KEY = "test-key"
DEBUG = False
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# No Redis in the test environment — the in-memory layer is sufficient for a
# single-process test run and needs nothing external.
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
CACHES["chat_presence"] = {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}  # noqa: F405
