"""Derivation of the alerts shown in the navbar's notification bell.

Deliberately cross-domain: a notification feed exists to pull the few things
that need a person's attention out of every register at once, so this module
reads from risk, audit, obligations and IAM. The domains stay unaware of it —
the coupling points one way, inwards.

Alerts are computed from live data rather than written to a table as they
arise. That means there is no read/unread state to drift out of sync with
reality, and an alert disappears exactly when the underlying work is done. The
only thing persisted is a user's decision to clear one — see
`NotificationDismissal`.
"""

import datetime
from dataclasses import dataclass

from django.utils import timezone

from domains.audit.models import CorrectiveAction
from domains.iam.models import LoginAttempt, Role, User
from domains.obligations.models import Obligation
from domains.risk.models import Risk

from .models import NotificationDismissal

# Matches the window the obligations dashboard tile reports on, so the two
# never disagree about what "due soon" means.
OBLIGATION_REVIEW_HORIZON_DAYS = 30
SIGN_IN_FAILURE_WINDOW_HOURS = 24


@dataclass(frozen=True)
class Notification:
    """One alert, already shaped for display.

    `signature` captures what the alert currently says. Clearing it stores the
    signature, and the alert stays hidden only while it still matches — so a
    count that changes brings the alert back rather than leaving the user
    permanently blind to it.
    """

    key: str
    tone: str
    title: str
    detail: str
    href: str
    signature: str


def _plural(count: int, noun: str) -> str:
    return f"{count} {noun}{'' if count == 1 else 's'}"


def _is_admin(user: User) -> bool:
    return bool(user.is_superuser or user.roles.filter(name=Role.Name.ADMIN).exists())


def _candidates(user: User) -> list[Notification]:
    """Every alert that applies to `user`, before dismissals are subtracted."""
    today = timezone.localdate()
    notifications: list[Notification] = []

    if not user.mfa_enabled:
        notifications.append(
            Notification(
                key="mfa",
                tone="warning",
                title="Two-factor authentication is off",
                detail="Add a second factor to protect your account.",
                href="/profile#security",
                signature="off",
            )
        )

    overdue_risks = (
        Risk.objects.exclude(status=Risk.Status.CLOSED).filter(next_review_date__lt=today).count()
    )
    if overdue_risks:
        notifications.append(
            Notification(
                key="risks-overdue",
                tone="danger",
                title=f"{_plural(overdue_risks, 'risk')} overdue for review",
                detail="Past the scheduled review date in the register.",
                href="/risk-register",
                signature=str(overdue_risks),
            )
        )

    overdue_actions = CorrectiveAction.objects.filter(
        status=CorrectiveAction.Status.OPEN, due_date__lt=today
    ).count()
    if overdue_actions:
        notifications.append(
            Notification(
                key="actions-overdue",
                tone="danger",
                title=f"{_plural(overdue_actions, 'corrective action')} overdue",
                detail="Past the agreed completion date.",
                href="/",
                signature=str(overdue_actions),
            )
        )

    reviews_due = Obligation.objects.filter(
        status=Obligation.Status.ACTIVE,
        next_review_date__lte=today + datetime.timedelta(days=OBLIGATION_REVIEW_HORIZON_DAYS),
    ).count()
    if reviews_due:
        notifications.append(
            Notification(
                key="obligations-due",
                tone="warning",
                title=f"{_plural(reviews_due, 'obligation')} due for review",
                detail=(f"Scheduled within the next {OBLIGATION_REVIEW_HORIZON_DAYS} days."),
                href="/",
                signature=str(reviews_due),
            )
        )

    # Tenant-wide sign-in activity is only meaningful — and only visible — to
    # those who administer accounts (A.5.15, A.8.15).
    if _is_admin(user):
        since = timezone.now() - datetime.timedelta(hours=SIGN_IN_FAILURE_WINDOW_HOURS)
        failures = LoginAttempt.objects.filter(success=False, created_at__gte=since).count()
        if failures:
            notifications.append(
                Notification(
                    key="sign-in-failures",
                    tone="warning",
                    title=(
                        f"{_plural(failures, 'failed sign-in')} in "
                        f"{SIGN_IN_FAILURE_WINDOW_HOURS} hours"
                    ),
                    detail="Review the access log for unfamiliar activity.",
                    href="/iam/audit-log",
                    signature=str(failures),
                )
            )

    return notifications


def build_notifications(user: User) -> list[Notification]:
    """Alerts currently facing `user`, with the ones they've cleared removed."""
    if not user.is_authenticated:
        return []

    dismissed = set(NotificationDismissal.objects.filter(user=user).values_list("key", "signature"))
    return [
        notification
        for notification in _candidates(user)
        if (notification.key, notification.signature) not in dismissed
    ]


def dismiss(user: User, key: str) -> bool:
    """Clear one alert for `user`. Returns whether there was one to clear.

    The signature is taken from the server's own view of the alert rather than
    from the caller, so a client can't silence a notification by claiming it
    said something it didn't.
    """
    current = next((n for n in _candidates(user) if n.key == key), None)
    if current is None:
        return False

    NotificationDismissal.objects.update_or_create(
        user=user, key=key, defaults={"signature": current.signature}
    )
    return True


def dismiss_all(user: User) -> int:
    """Clear every alert currently facing `user`. Returns how many were cleared."""
    cleared = 0
    for notification in build_notifications(user):
        NotificationDismissal.objects.update_or_create(
            user=user,
            key=notification.key,
            defaults={"signature": notification.signature},
        )
        cleared += 1
    return cleared
