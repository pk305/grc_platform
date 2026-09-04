import strawberry
import strawberry_django

from domains.system.models import SystemSetting
from domains.system.service import effective_login_domain

# The fields an administrator may change. Order is the order the settings page
# lists them in, and `update_system_settings` walks this tuple.
EDITABLE_FIELDS = (
    "organisation_name",
    "primary_contact_email",
    "allowed_login_domain",
    "require_mfa_for_all_users",
    "session_expiry_minutes",
    "password_min_length",
    "access_review_interval_days",
    "audit_log_retention_days",
)


@strawberry_django.type(SystemSetting, fields=["id", *EDITABLE_FIELDS, "updated_at"])
class SystemSettingType:
    @strawberry_django.field(only=["allowed_login_domain"])
    def effective_login_domain(root: SystemSetting) -> str:  # noqa: N805
        """The domain sign-in actually enforces, once the environment fallback applies."""
        return effective_login_domain(root)

    @strawberry_django.field(only=["updated_by"])
    def updated_by_email(root: SystemSetting) -> str | None:  # noqa: N805
        """Who last changed the configuration, or null if no one has since deployment."""
        return root.updated_by.email if root.updated_by else None


@strawberry.input
class SystemSettingInput:
    """A partial update: every field left unset keeps its stored value."""

    organisation_name: str | None = strawberry.UNSET
    primary_contact_email: str | None = strawberry.UNSET
    allowed_login_domain: str | None = strawberry.UNSET
    require_mfa_for_all_users: bool | None = strawberry.UNSET
    session_expiry_minutes: int | None = strawberry.UNSET
    password_min_length: int | None = strawberry.UNSET
    access_review_interval_days: int | None = strawberry.UNSET
    audit_log_retention_days: int | None = strawberry.UNSET
