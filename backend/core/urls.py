from django.conf import settings
from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from strawberry.django.views import AsyncGraphQLView

from core.schema import schema

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/v1/",
        # Session-cookie auth without a token means there's no CSRF token to send on
        # the first request; the JSON-only content type already blocks classic
        # form-based CSRF, and CORS_ALLOWED_ORIGINS restricts which origins can talk
        # to this endpoint at all.
        csrf_exempt(
            AsyncGraphQLView.as_view(
                schema=schema, graphql_ide="graphiql" if settings.DEBUG else None
            )
        ),
    ),
]
