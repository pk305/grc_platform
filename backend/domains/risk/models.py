"""Risk register (ISO 31000 — identification, analysis, and review of risk)."""

import datetime
from typing import Any

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .scoring import level_for_score

_LIKELIHOOD_IMPACT_VALIDATORS = [MinValueValidator(1), MaxValueValidator(5)]


class Risk(models.Model):
    class Status(models.TextChoices):
        IDENTIFIED = "identified", "Identified"
        ASSESSED = "assessed", "Assessed"
        TREATMENT_PLANNED = "treatment_planned", "Treatment Planned"
        TREATED = "treated", "Treated"
        ACCEPTED = "accepted", "Accepted"
        CLOSED = "closed", "Closed"

    reference = models.CharField(max_length=32, unique=True, editable=False, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # ISO 31000 decomposition: source -> event -> consequence.
    source = models.CharField(max_length=255, blank=True)
    event = models.CharField(max_length=255, blank=True)
    consequence = models.CharField(max_length=255, blank=True)

    status = models.CharField(max_length=32, choices=Status.choices, default=Status.IDENTIFIED)

    inherent_likelihood = models.PositiveSmallIntegerField(validators=_LIKELIHOOD_IMPACT_VALIDATORS)
    inherent_impact = models.PositiveSmallIntegerField(validators=_LIKELIHOOD_IMPACT_VALIDATORS)
    residual_likelihood = models.PositiveSmallIntegerField(
        blank=True, null=True, validators=_LIKELIHOOD_IMPACT_VALIDATORS
    )
    residual_impact = models.PositiveSmallIntegerField(
        blank=True, null=True, validators=_LIKELIHOOD_IMPACT_VALIDATORS
    )

    next_review_date = models.DateField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="owned_risks",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.reference} {self.title}"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.reference:
            self.reference = self._next_reference()
        super().save(*args, **kwargs)

    @classmethod
    def _next_reference(cls) -> str:
        prefix = f"RSK-{datetime.date.today().year}-"
        last = cls.objects.filter(reference__startswith=prefix).order_by("-reference").first()
        next_number = int(last.reference.rsplit("-", 1)[-1]) + 1 if last else 1
        return f"{prefix}{next_number:04d}"

    @property
    def effective_likelihood(self) -> int:
        if self.residual_likelihood and self.residual_impact:
            return self.residual_likelihood
        return self.inherent_likelihood

    @property
    def effective_impact(self) -> int:
        if self.residual_likelihood and self.residual_impact:
            return self.residual_impact
        return self.inherent_impact

    @property
    def inherent_level(self) -> str:
        return level_for_score(self.inherent_likelihood, self.inherent_impact)

    @property
    def residual_level(self) -> str | None:
        if not (self.residual_likelihood and self.residual_impact):
            return None
        return level_for_score(self.residual_likelihood, self.residual_impact)
