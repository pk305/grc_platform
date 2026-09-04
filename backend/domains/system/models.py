"""Platform-wide configuration an administrator can change without a redeploy."""

from typing import Any

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SystemSetting(models.Model):
    """The single row of platform configuration (ISO/IEC 27001:2022 A.5.1).

    One row of typed columns rather than a key/value table, so every setting
    gets model validation, a help text the GraphQL schema publishes, and a
    migration when it changes. Read it through `load()` — it creates the row on
    first access, so callers never have to care whether it exists yet.

    A setting only lives here if something enforces it; see `service.py` for
    the accessors that apply these to sign-in, user creation and retention.
    """

    SINGLETON_PK = 1

    organisation_name = models.CharField(
        max_length=128,
        default="Acentria",
        help_text="Organisation this platform governs. Used in the emails the platform sends.",
    )
    primary_contact_email = models.EmailField(
        blank=True,
        default="",
        help_text="Where users are told to turn for access problems.",
    )
    allowed_login_domain = models.CharField(
        max_length=253,
        blank=True,
        default="",
        help_text=(
            "Email domain an account must belong to in order to sign in. "
            "Leave blank to keep using the ALLOWED_LOGIN_DOMAIN environment value."
        ),
    )
    require_mfa_for_all_users = models.BooleanField(
        "require MFA for all users",
        default=False,
        help_text=(
            "Every account without MFA is asked to enroll at its next sign-in "
            "and cannot use the platform until it does (A.8.5)."
        ),
    )
    session_expiry_minutes = models.PositiveIntegerField(
        default=480,
        validators=[MinValueValidator(5), MaxValueValidator(10080)],
        help_text="How long a sign-in stays valid before the user must authenticate again.",
    )
    password_min_length = models.PositiveSmallIntegerField(
        default=12,
        validators=[MinValueValidator(8), MaxValueValidator(128)],
        help_text="Minimum characters for a new password (A.5.17).",
    )
    access_review_interval_days = models.PositiveSmallIntegerField(
        default=90,
        validators=[MinValueValidator(1), MaxValueValidator(3650)],
        help_text=(
            "How far ahead a new account's first access recertification is scheduled (A.5.18)."
        ),
    )
    audit_log_retention_days = models.PositiveSmallIntegerField(
        default=365,
        validators=[MinValueValidator(30), MaxValueValidator(3650)],
        help_text=(
            "How long IAM audit events and sign-in attempts are kept before "
            "`purge_audit_log` deletes them (A.8.15)."
        ),
    )

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    class Meta:
        verbose_name = "system settings"
        verbose_name_plural = "system settings"

    def __str__(self) -> str:
        return f"System settings for {self.organisation_name}"

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Pin every write to the singleton row, so a second one can't appear."""
        self.pk = self.SINGLETON_PK
        super().save(*args, **kwargs)

    @classmethod
    def load(cls) -> "SystemSetting":
        """The configuration row, created with its defaults on first access."""
        setting, _ = cls.objects.get_or_create(pk=cls.SINGLETON_PK)
        return setting
