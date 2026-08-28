"""Compliance obligations register (legal, regulatory, and contractual)."""

from django.db import models


class Obligation(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        RETIRED = "retired", "Retired"

    title = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    next_review_date = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title
