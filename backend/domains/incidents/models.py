"""Security/operational incident register."""

from django.db import models


class Incident(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    title = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-detected_at"]

    def __str__(self) -> str:
        return self.title
