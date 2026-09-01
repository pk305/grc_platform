import datetime

import strawberry
import strawberry_django
from strawberry import auto

from domains.iam.images import to_data_url
from domains.iam.models import Permission, Role, User, UserAvatar


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

    @strawberry_django.field(only=["id"])
    def mfa_recovery_codes_remaining(root: User) -> int:  # noqa: N805
        """Unused one-time recovery codes left on the account (A.8.5)."""
        return root.mfa_recovery_codes.filter(used_at__isnull=True).count()

    @strawberry_django.field(only=["id"])
    def avatar_url(root: User) -> str | None:  # noqa: N805
        """The profile photo, or null when the account has none.

        Currently a `data:` URL carrying the stored bytes; consumers should
        treat it as an opaque image source so it can become a real URL if
        avatars ever move to object storage.
        """
        avatar = UserAvatar.objects.filter(user=root).first()
        return to_data_url(avatar.image, avatar.content_type) if avatar else None


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
class MyProfileInput:
    """Self-service profile edit.

    Deliberately narrower than `UserUpdateInput`: attributes that govern access
    — email, username, roles, MFA requirement — stay administrator-owned so the
    account holder cannot re-identify themselves (ISO/IEC 27001:2022 A.5.16).
    """

    first_name: str = ""
    last_name: str = ""
    department: str = ""


@strawberry.input
class AssignRoleInput:
    user_id: strawberry.ID
    role_name: str


@strawberry.input
class RolePermissionInput:
    role_name: str
    permission_id: strawberry.ID


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
    ip_address: str | None = None


@strawberry.type
class MfaSetupType:
    """Enrollment material for a pending (unconfirmed) TOTP setup."""

    secret: str
    provisioning_uri: str


@strawberry.type
class MfaRecoveryCodesType:
    """A freshly issued set of recovery codes — shown once, never retrievable again."""

    recovery_codes: list[str]


@strawberry.type
class MfaConfirmedType:
    """Returned once on successful enrollment — recovery codes are never retrievable again."""

    user: UserType
    recovery_codes: list[str]
