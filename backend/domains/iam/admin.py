from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import LoginAttempt, Role, User


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
    )
    list_filter = (*DjangoUserAdmin.list_filter, "auth_provider")
    filter_horizontal = (*DjangoUserAdmin.filter_horizontal, "roles")
    fieldsets = (
        *DjangoUserAdmin.fieldsets,
        ("Roles", {"fields": ("roles",)}),
        ("SSO", {"fields": ("auth_provider",)}),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ("email", "user", "success", "created_at")
    list_filter = ("success",)
    readonly_fields = ("email", "user", "success", "created_at")
