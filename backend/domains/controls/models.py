"""Controls & Statement of Applicability (ISO 27001 Annex A / SoA)."""

from django.db import models


class Control(models.Model):
    class ImplementationStatus(models.TextChoices):
        NOT_IMPLEMENTED = "not_implemented", "Not Implemented"
        PARTIAL = "partial", "Partial"
        IMPLEMENTED = "implemented", "Implemented"
        NOT_APPLICABLE = "not_applicable", "Not Applicable"

    reference = models.CharField(max_length=32)
    title = models.CharField(max_length=255)
    in_scope = models.BooleanField(default=True)
    implementation_status = models.CharField(
        max_length=32,
        choices=ImplementationStatus.choices,
        default=ImplementationStatus.NOT_IMPLEMENTED,
    )

    class Meta:
        ordering = ["reference"]

    def __str__(self) -> str:
        return f"{self.reference} {self.title}"
