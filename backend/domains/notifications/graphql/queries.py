import strawberry
import strawberry_django
from strawberry.types import Info

from domains.notifications.service import build_notifications

from .types import NotificationType, to_notification_types


@strawberry.type
class NotificationsQuery:
    @strawberry_django.field
    def notifications(self, info: Info) -> list[NotificationType]:
        """Alerts facing the signed-in user, excluding the ones they've cleared.

        Empty for anonymous callers: every alert describes the caller's own
        account or the registers they work in, and none of it is public.
        """
        return to_notification_types(build_notifications(info.context.request.user))
