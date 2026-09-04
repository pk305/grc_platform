"""Accessors that apply the configured settings to the rest of the platform.

Everything that reads `SystemSetting` outside this domain goes through here, so
the fallbacks (and the fact that there are any) live in one place.
"""

import datetime
from typing import TYPE_CHECKING

from django.conf import settings

from .models import SystemSetting

if TYPE_CHECKING:
    from domains.iam.models import User


def effective_login_domain(setting: SystemSetting | None = None) -> str:
    """The email domain sign-in is restricted to, lowercased.

    Falls back to `ALLOWED_LOGIN_DOMAIN` while the field is blank: sign-in has
    to keep working on a fresh database, and an administrator who clears the
    field is asking to hand the decision back to the deployment.
    """
    configured = (setting or SystemSetting.load()).allowed_login_domain.strip()
    return (configured or settings.ALLOWED_LOGIN_DOMAIN).lower()


def mfa_required_for_new_user(requested: bool) -> bool:
    """Whether a new account must enroll in MFA — per-user, or platform-wide."""
    return requested or SystemSetting.load().require_mfa_for_all_users


def apply_global_mfa_requirement(user: "User") -> None:
    """Flag an account that predates the platform-wide MFA rule.

    Sign-in itself still succeeds; the flag is what makes the client hold the
    user on the enrollment screen until they finish (A.8.5).
    """
    if user.mfa_enabled or user.mfa_required:
        return
    if SystemSetting.load().require_mfa_for_all_users:
        type(user).objects.filter(pk=user.pk).update(mfa_required=True)
        user.mfa_required = True


def session_expiry_seconds() -> int:
    """How long a fresh sign-in stays valid, as a Django session expiry (A.8.5)."""
    return SystemSetting.load().session_expiry_minutes * 60


def next_access_review_date(today: datetime.date) -> datetime.date:
    """When an account created today is next due for recertification (A.5.18)."""
    return today + datetime.timedelta(days=SystemSetting.load().access_review_interval_days)


def audit_log_cutoff(now: datetime.datetime) -> datetime.datetime:
    """Anything logged before this is past its retention period (A.8.15)."""
    return now - datetime.timedelta(days=SystemSetting.load().audit_log_retention_days)
