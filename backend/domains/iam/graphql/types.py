import strawberry
import strawberry_django
from strawberry import auto

from domains.iam.models import Role, User


@strawberry_django.type(Role, fields=["id", "name"])
class RoleType:
    pass


@strawberry_django.order_type(Role)
class RoleOrder:
    name: auto


@strawberry_django.filter_type(Role, lookups=True)
class RoleFilter:
    name: auto


@strawberry_django.type(
    User,
    fields=["id", "email", "username", "first_name", "last_name", "is_active", "auth_provider"],
)
class UserType:
    roles: list[RoleType]


@strawberry.type
class AccessSummary:
    active_users_count: int
    deactivated_users_count: int
    sso_users_count: int
    successful_sign_ins_24h: int
    sign_in_failures_24h: int


@strawberry_django.order_type(User)
class UserOrder:
    email: auto
    last_name: auto


@strawberry_django.filter_type(User, lookups=True)
class UserFilter:
    email: auto
    last_name: auto


@strawberry.input
class UserCreateInput:
    """Hand-written input: password must never be a model-derived field."""

    email: str
    username: str
    password: str
    first_name: str = ""
    last_name: str = ""


@strawberry_django.partial(User)
class UserUpdateInput:
    id: auto
    first_name: auto
    last_name: auto


@strawberry.input
class AssignRoleInput:
    user_id: strawberry.ID
    role_name: str
