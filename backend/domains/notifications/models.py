"""Per-user record of which alerts have been cleared."""

from django.conf import settings
from django.db import models


class NotificationDismissal(models.Model):
    """A notification the user has cleared, and the state it was cleared at.

    Notifications themselves are derived from live data rather than stored (see
    `service.build_notifications`), so what persists is the *dismissal*, not the
    alert. `signature` records what the notification said at the moment it was
    cleared; once the underlying situation changes the signature no longer
    matches and the notification returns. Clearing "3 risks overdue" therefore
    silences that alert until the number of overdue risks actually changes,
    rather than hiding the problem permanently.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_dismissals",
    )
    key = models.CharField("notification key", max_length=64)
    signature = models.CharField(
        "state when cleared", max_length=128, blank=True, default=""
    )
    dismissed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-dismissed_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "key"], name="unique_notification_dismissal_per_user"
            )
        ]

    def __str__(self) -> str:
        return f"{self.user} cleared {self.key}"
