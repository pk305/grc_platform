import strawberry
import strawberry_django
from strawberry.types import Info

from domains.notifications.service import build_notifications, dismiss, dismiss_all

from .types import NotificationType, to_notification_types


@strawberry.type
class NotificationsMutation:
    # STRAWBERRY_DJANGO defaults mutations to an OperationInfo union; these
    # two report failure by returning the unchanged list, so opt out.
    @strawberry_django.mutation(handle_django_errors=False)
    def clear_notification(self, info: Info, key: str) -> list[NotificationType]:
        """Clear one alert for the caller, returning the alerts that remain.

        Stays cleared only while the situation it describes is unchanged — a
        count that moves brings the alert back, so clearing can quiet the bell
        without ever hiding a problem for good.

        Returning the remaining list rather than a status saves the client a
        follow-up round trip, and keeps the bell's badge in step with the panel.
        """
        user = info.context.request.user
        if not user.is_authenticated:
            return []
        dismiss(user, key)
        return to_notification_types(build_notifications(user))

    @strawberry_django.mutation(handle_django_errors=False)
    def clear_all_notifications(self, info: Info) -> list[NotificationType]:
        """Clear every alert currently facing the caller."""
        user = info.context.request.user
        if not user.is_authenticated:
            return []
        dismiss_all(user)
        return to_notification_types(build_notifications(user))
