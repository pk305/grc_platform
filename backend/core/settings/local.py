from .base import *  # noqa: F403
from .base import env

DEBUG = env("DJANGO_DEBUG", default=True)
ALLOWED_HOSTS = ["*"]
SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-local-key")
CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
