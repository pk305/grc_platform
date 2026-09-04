"""Password validation driven by the configured policy rather than a constant."""

from typing import Any

from django.core.exceptions import ValidationError
from django.utils.translation import ngettext

from .models import SystemSetting


class ConfiguredMinimumLengthValidator:
    """Django password validator whose minimum comes from the settings row.

    Stands in for `django.contrib.auth.password_validation.MinimumLengthValidator`
    so an administrator can raise the floor without a redeploy (A.5.17).
    """

    def validate(self, password: str, user: Any = None) -> None:
        minimum = SystemSetting.load().password_min_length
        if len(password) < minimum:
            raise ValidationError(
                ngettext(
                    "This password is too short. It must contain at least "
                    "%(min_length)d character.",
                    "This password is too short. It must contain at least "
                    "%(min_length)d characters.",
                    minimum,
                ),
                code="password_too_short",
                params={"min_length": minimum},
            )

    def get_help_text(self) -> str:
        minimum = SystemSetting.load().password_min_length
        return ngettext(
            "Your password must contain at least %(min_length)d character.",
            "Your password must contain at least %(min_length)d characters.",
            minimum,
        ) % {"min_length": minimum}
