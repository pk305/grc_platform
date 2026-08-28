"""Identity & access — users, roles, RBAC (ISO 27001 A.5.15-A.5.18, A.8.2-A.8.5)."""

from django.contrib.auth.models import AbstractUser
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

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self) -> str:
        return self.email

    def has_role(self, *names: str) -> bool:
        """Segregation-of-duties check: does this user hold any of these roles."""
        return self.roles.filter(name__in=names).exists()


class LoginAttempt(models.Model):
    """Audit trail of sign-in attempts, successful or not."""

    email = models.EmailField()
    user = models.ForeignKey(
        User, blank=True, null=True, on_delete=models.SET_NULL, related_name="login_attempts"
    )
    success = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        outcome = "success" if self.success else "failure"
        return f"{self.email} ({outcome})"
