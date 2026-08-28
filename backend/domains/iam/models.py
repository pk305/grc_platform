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

    email = models.EmailField("email address", unique=True)
    roles = models.ManyToManyField(Role, related_name="users", blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self) -> str:
        return self.email

    def has_role(self, *names: str) -> bool:
        """Segregation-of-duties check: does this user hold any of these roles."""
        return self.roles.filter(name__in=names).exists()
