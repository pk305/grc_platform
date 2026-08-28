from django.contrib import admin

from .models import AuditFinding, CorrectiveAction


class CorrectiveActionInline(admin.TabularInline):
    model = CorrectiveAction
    extra = 0


@admin.register(AuditFinding)
class AuditFindingAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("title",)
    inlines = [CorrectiveActionInline]


@admin.register(CorrectiveAction)
class CorrectiveActionAdmin(admin.ModelAdmin):
    list_display = ("description", "finding", "due_date", "status")
    list_filter = ("status",)
