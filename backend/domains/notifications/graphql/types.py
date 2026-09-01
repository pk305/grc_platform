from typing import TYPE_CHECKING

import strawberry

if TYPE_CHECKING:
    from domains.notifications.service import Notification


@strawberry.type
class NotificationType:
    """One alert in the notification bell.

    Flattened and pre-worded on the server so every client shows the same
    thing; the frontend only chooses an icon for the `key` and a colour for
    the `tone`.
    """

    key: str
    tone: str
    title: str
    detail: str
    href: str


def to_notification_types(
    notifications: "list[Notification]",
) -> list[NotificationType]:
    return [
        NotificationType(
            key=notification.key,
            tone=notification.tone,
            title=notification.title,
            detail=notification.detail,
            href=notification.href,
        )
        for notification in notifications
    ]
