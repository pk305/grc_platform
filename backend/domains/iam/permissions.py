"""Role-gated field extension for GraphQL resolvers.

Use to enforce segregation of duties: give the mutations that create and
approve the same record disjoint role sets, so no single role can do both.
"""

from collections.abc import Callable
from typing import Any, ClassVar

from strawberry.types import Info
from strawberry_django.permissions import DjangoNoPermission, DjangoPermissionExtension
from strawberry_django.resolvers import django_resolver

from domains.iam.models import User


class RequireRoles(DjangoPermissionExtension):
    """Restrict a field to authenticated users holding at least one of `roles`."""

    DEFAULT_ERROR_MESSAGE: ClassVar[str] = "User does not have the required role."

    def __init__(self, *roles: str, **kwargs: Any) -> None:
        if not roles:
            raise TypeError("require_roles() needs at least one role name")
        self.roles = roles
        super().__init__(**kwargs)

    @django_resolver(qs_hook=None)
    def resolve_for_user(
        self,
        resolver: Callable[..., Any],
        user: Any,
        *,
        info: Info,
        source: Any,
    ) -> Any:
        if (
            not isinstance(user, User)
            or not user.is_authenticated
            or not user.is_active
            or not user.roles.filter(name__in=self.roles).exists()
        ):
            raise DjangoNoPermission

        return resolver()


def require_roles(*roles: str, **kwargs: Any) -> RequireRoles:
    """Field extension: `extensions=[require_roles("admin", "ciso")]`."""
    return RequireRoles(*roles, **kwargs)
