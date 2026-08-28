from django.contrib import admin

from .models import Obligation


@admin.register(Obligation)
class ObligationAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "next_review_date")
    list_filter = ("status",)
    search_fields = ("title",)
