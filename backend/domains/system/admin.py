from django.contrib import admin
from django.http import HttpRequest

from .models import SystemSetting


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    """Read/edit the singleton — never add or delete it."""

    list_display = ("organisation_name", "allowed_login_domain", "updated_at", "updated_by")
    readonly_fields = ("updated_at", "updated_by")

    def has_add_permission(self, request: HttpRequest) -> bool:
        return not SystemSetting.objects.exists()

    def has_delete_permission(self, request: HttpRequest, obj: SystemSetting | None = None) -> bool:
        return False
