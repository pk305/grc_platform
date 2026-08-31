import datetime

import strawberry
import strawberry_django
from strawberry import auto

from domains.iam.models import Permission, Role, User


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
    fields=[
        "id",
        "email",
        "username",
        "first_name",
        "last_name",
        "is_active",
        "is_superuser",
        "auth_provider",
        "entra_object_id",
        "department",
        "mfa_enabled",
        "mfa_required",
        "must_change_password",
        "next_access_review_date",
        "last_login",
        "date_joined",
    ],
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
    role_name: str
    first_name: str = ""
    last_name: str = ""
    department: str = ""
    require_mfa: bool = False
    send_welcome_email: bool = False


@strawberry.input
class UserUpdateInput:
    email: str
    username: str
    first_name: str = ""
    last_name: str = ""
    department: str = ""


@strawberry.input
class AssignRoleInput:
    user_id: strawberry.ID
    role_name: str


@strawberry_django.type(Permission, fields=["id", "resource", "action", "iso_clause"])
class PermissionType:
    roles: list[RoleType]


@strawberry_django.order_type(Permission)
class PermissionOrder:
    resource: auto
    action: auto


@strawberry.type
class AuditEventType:
    id: str
    event_type: str
    actor: str
    detail: str
    created_at: datetime.datetime


@strawberry.type
class MfaSetupType:
    """Enrollment material for a pending (unconfirmed) TOTP setup."""

    secret: str
    provisioning_uri: str


@strawberry.type
class MfaConfirmedType:
    """Returned once on successful enrollment — recovery codes are never retrievable again."""

    user: UserType
    recovery_codes: list[str]
