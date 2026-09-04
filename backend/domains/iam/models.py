"""Identity & access — users, roles, RBAC (ISO 27001 A.5.15-A.5.18, A.8.2-A.8.5)."""

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class Role(models.Model):
    class Name(models.TextChoices):
        ADMIN = "admin", "Admin"
        CISO = "ciso", "CISO"
        RISK_MANAGER = "risk_manager", "Risk Manager"
        AUDITOR = "auditor", "Auditor"
        CONTROL_OWNER = "control_owner", "Control Owner"
        VIEWER = "viewer", "Viewer"

    name = models.CharField(max_length=32, choices=Name.choices, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    """Application user. Email is the login identifier."""

    class AuthProvider(models.TextChoices):
        LOCAL = "local", "Local"
        ENTRA_ID = "entra_id", "Microsoft Entra ID"

    email = models.EmailField("email address", unique=True)
    roles = models.ManyToManyField(Role, related_name="users", blank=True)
    auth_provider = models.CharField(
        max_length=16, choices=AuthProvider.choices, default=AuthProvider.LOCAL
    )
    entra_object_id = models.CharField(
        "Entra object ID", max_length=64, blank=True, null=True, unique=True
    )
    department = models.CharField(max_length=128, blank=True, default="")
    # A.8.5 — secure authentication. `mfa_enabled` is only ever set True once
    # a TOTP secret has been verified (see confirm_mfa_setup); `mfa_required`
    # is the administrative flag that an account must complete enrollment.
    mfa_enabled = models.BooleanField("MFA enabled", default=False)
    mfa_required = models.BooleanField("MFA setup required", default=False)
    mfa_secret = models.CharField("Encrypted TOTP secret", max_length=255, blank=True, default="")
    next_access_review_date = models.DateField(blank=True, null=True)
    must_change_password = models.BooleanField("Must change password at next login", default=False)
    # A.8.5 — limitation of concurrent sessions: the session_key of this
    # user's one allowed active session. A new sign-in overwrites it and
    # deletes the Django session row it used to point at, so any other
    # browser/device holding the old sessionid cookie is logged out on its
    # next request. See IamMutation.login / verify_mfa_code.
    current_session_key = models.CharField(max_length=40, blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self) -> str:
        return self.email

    def clean(self) -> None:
        super().clean()
        if "@" in self.username:
            raise ValidationError({"username": "Username cannot be an email address."})

    def has_role(self, *names: str) -> bool:
        """Segregation-of-duties check: does this user hold any of these roles."""
        return self.roles.filter(name__in=names).exists()


class MfaRecoveryCode(models.Model):
    """One-time MFA recovery codes, hashed at rest like passwords (A.8.5)."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="mfa_recovery_codes")
    code_hash = models.CharField(max_length=128)
    used_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"recovery code for {self.user.email} ({'used' if self.used_at else 'unused'})"


class UserAvatar(models.Model):
    """A user's profile photo, re-encoded server-side and held in the database.

    Kept off the `User` row so listing users never drags image bytes along, and
    stored as bytes rather than on a filesystem so the app needs no separate
    media volume to back up, restore or protect.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="avatar")
    image = models.BinaryField()
    content_type = models.CharField(max_length=32, default="image/jpeg")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"avatar for {self.user.email}"


class LoginAttempt(models.Model):
    """Audit trail of sign-in attempts, successful or not."""

    email = models.EmailField()
    user = models.ForeignKey(
        User, blank=True, null=True, on_delete=models.SET_NULL, related_name="login_attempts"
    )
    success = models.BooleanField()
    # A.8.15 — logging: the connecting client's address, for spotting
    # brute-force/credential-stuffing patterns across attempts.
    ip_address = models.GenericIPAddressField("IP address", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        outcome = "success" if self.success else "failure"
        return f"{self.email} ({outcome})"


class Permission(models.Model):
    """Resource/action grants held by roles — the access-control catalog (A.5.15)."""

    class Resource(models.TextChoices):
        IAM_USERS = "iam_users", "Users"
        IAM_ROLES = "iam_roles", "Roles"
        RISK = "risk", "Risk register"
        CONTROLS = "controls", "Controls"
        AUDIT = "audit", "Audit findings"
        INCIDENTS = "incidents", "Incidents"
        OBLIGATIONS = "obligations", "Obligations"

    class Action(models.TextChoices):
        VIEW = "view", "View"
        CREATE = "create", "Create"
        EDIT = "edit", "Edit"
        DELETE = "delete", "Delete"
        APPROVE = "approve", "Approve"
        ASSIGN = "assign", "Assign"

    resource = models.CharField(max_length=32, choices=Resource.choices)
    action = models.CharField(max_length=16, choices=Action.choices)
    iso_clause = models.CharField(max_length=16, blank=True)
    roles = models.ManyToManyField(Role, related_name="permissions", blank=True)

    class Meta:
        ordering = ["resource", "action"]
        constraints = [
            models.UniqueConstraint(
                fields=["resource", "action"], name="unique_permission_resource_action"
            )
        ]

    def __str__(self) -> str:
        return f"{self.resource}:{self.action}"


class IamAuditEvent(models.Model):
    """Immutable log of identity/access administration actions (A.5.18)."""

    class EventType(models.TextChoices):
        USER_CREATED = "user.created", "User created"
        USER_UPDATED = "user.updated", "User updated"
        USER_ACTIVATED = "user.activated", "User activated"
        USER_DEACTIVATED = "user.deactivated", "User deactivated"
        USER_DELETED = "user.deleted", "User deleted"
        ROLE_GRANTED = "role.granted", "Role granted"
        ROLE_REVOKED = "role.revoked", "Role revoked"
        PERMISSION_GRANTED = "permission.granted", "Permission granted"
        PERMISSION_REVOKED = "permission.revoked", "Permission revoked"
        MFA_ENABLED = "mfa.enabled", "MFA enabled"
        MFA_DISABLED = "mfa.disabled", "MFA disabled"
        MFA_RESET = "mfa.reset", "MFA reset by admin"
        MFA_CODES_REGENERATED = "mfa.codes_regenerated", "MFA recovery codes regenerated"
        PROFILE_UPDATED = "profile.updated", "Profile updated by the account holder"
        PASSWORD_RESET_REQUESTED = "password.reset_requested", "Password reset requested by admin"
        SETTINGS_UPDATED = "settings.updated", "System settings updated"

    event_type = models.CharField(max_length=32, choices=EventType.choices)
    actor = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    target_user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    detail = models.TextField(blank=True)
    # A.8.15 — logging: the actor's connecting address at the time of the
    # action. Null for events with no request behind them (e.g. none today,
    # but the column stays optional for any that end up system-initiated).
    ip_address = models.GenericIPAddressField("IP address", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.event_type} @ {self.created_at:%Y-%m-%d %H:%M}"
