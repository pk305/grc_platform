from django.contrib import admin

from .models import NotificationDismissal


@admin.register(NotificationDismissal)
class NotificationDismissalAdmin(admin.ModelAdmin):
    list_display = ("user", "key", "signature", "dismissed_at")
    list_filter = ("key",)
    search_fields = ("user__email", "key")
