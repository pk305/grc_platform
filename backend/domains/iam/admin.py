from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import IamAuditEvent, LoginAttempt, MfaRecoveryCode, Permission, Role, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "username",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
        "auth_provider",
        "department",
        "mfa_enabled",
        "mfa_required",
    )
    list_filter = (
        *DjangoUserAdmin.list_filter,
        "auth_provider",
        "department",
        "mfa_enabled",
        "mfa_required",
    )
    filter_horizontal = (*DjangoUserAdmin.filter_horizontal, "roles")
    fieldsets = (
        *DjangoUserAdmin.fieldsets,
        ("Roles", {"fields": ("roles",)}),
        ("SSO", {"fields": ("auth_provider", "entra_object_id")}),
        (
            "Identity governance",
            {
                "fields": (
                    "department",
                    "mfa_enabled",
                    "mfa_required",
                    "next_access_review_date",
                )
            },
        ),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ("email", "user", "success", "created_at")
    list_filter = ("success",)
    readonly_fields = ("email", "user", "success", "created_at")


@admin.register(MfaRecoveryCode)
class MfaRecoveryCodeAdmin(admin.ModelAdmin):
    """Codes are hashed at rest — this view is for auditing usage, not lookup."""

    list_display = ("user", "used_at", "created_at")
    list_filter = ("used_at",)
    readonly_fields = ("user", "code_hash", "used_at", "created_at")


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("resource", "action", "iso_clause")
    list_filter = ("resource", "action")
    filter_horizontal = ("roles",)


@admin.register(IamAuditEvent)
class IamAuditEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "actor", "target_user", "detail", "created_at")
    list_filter = ("event_type",)
    readonly_fields = ("event_type", "actor", "target_user", "detail", "created_at")
