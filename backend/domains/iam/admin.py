from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Role, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "username", "first_name", "last_name", "is_staff")
    filter_horizontal = (*DjangoUserAdmin.filter_horizontal, "roles")
    fieldsets = (
        *DjangoUserAdmin.fieldsets,
        ("Roles", {"fields": ("roles",)}),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)
