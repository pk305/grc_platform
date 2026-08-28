"""Internal/external audit findings and their corrective actions."""

from django.db import models


class AuditFinding(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    title = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class CorrectiveAction(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    finding = models.ForeignKey(
        AuditFinding, on_delete=models.CASCADE, related_name="corrective_actions"
    )
    description = models.CharField(max_length=255)
    due_date = models.DateField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)

    class Meta:
        ordering = ["due_date"]

    def __str__(self) -> str:
        return self.description
