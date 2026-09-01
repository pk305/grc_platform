import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.production")

# Must run — and must run before anything below imports a Django model —
# since this is what calls django.setup().
from django.core.asgi import get_asgi_application  # noqa: E402

django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from django.urls import path  # noqa: E402

from core.schema import schema  # noqa: E402
from domains.chat.graphql.consumers import ChatGraphQLWSConsumer  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        # Session-cookie auth, same as the HTTP endpoint (core/urls.py) — the
        # WS handshake is a normal same-origin HTTP request, so the
        # `sessionid` cookie rides along and AuthMiddlewareStack reads it the
        # same way Django's session middleware does for the HTTP view.
        "websocket": AuthMiddlewareStack(
            URLRouter(
                [path("ws/graphql", ChatGraphQLWSConsumer.as_asgi(schema=schema))]
            )
        ),
    }
)
