from django.contrib import admin

from .models import Risk


@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "title",
        "status",
        "inherent_level",
        "residual_level",
        "next_review_date",
        "owner",
    )
    list_filter = ("status",)
    search_fields = ("reference", "title")
    readonly_fields = ("reference",)
