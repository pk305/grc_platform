from django.contrib import admin

from .models import Control


@admin.register(Control)
class ControlAdmin(admin.ModelAdmin):
    list_display = ("reference", "title", "in_scope", "implementation_status")
    list_filter = ("in_scope", "implementation_status")
    search_fields = ("reference", "title")
