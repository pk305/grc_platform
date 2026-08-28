import datetime

import strawberry
import strawberry_django
from django.utils import timezone
from strawberry.types import Info

from domains.iam.models import IamAuditEvent, LoginAttempt, User

from .types import (
    AccessSummary,
    AuditEventType,
    PermissionOrder,
    PermissionType,
    RoleFilter,
    RoleOrder,
    RoleType,
    UserFilter,
    UserOrder,
    UserType,
)


@strawberry.type
class IamQuery:
    users: list[UserType] = strawberry_django.field(
        filters=UserFilter, order=UserOrder, pagination=True
    )
    roles: list[RoleType] = strawberry_django.field(filters=RoleFilter, order=RoleOrder)
    permissions: list[PermissionType] = strawberry_django.field(order=PermissionOrder)

    @strawberry_django.field
    def me(self, info: Info) -> UserType | None:
        user = info.context.request.user
        return user if user.is_authenticated else None

    @strawberry_django.field
    def audit_events(self, limit: int = 50) -> list[AuditEventType]:
        admin_events = [
            AuditEventType(
                id=f"iam-{event.pk}",
                event_type=event.event_type,
                actor=event.actor.email if event.actor else "System",
                detail=event.detail,
                created_at=event.created_at,
            )
            for event in IamAuditEvent.objects.select_related("actor", "target_user").order_by(
                "-created_at"
            )[:limit]
        ]
        login_events = [
            AuditEventType(
                id=f"login-{attempt.pk}",
                event_type="sso.sign_in" if attempt.success else "login.failed",
                actor=attempt.email,
                detail=(
                    "Entra ID · new device"
                    if attempt.user and attempt.user.auth_provider == User.AuthProvider.ENTRA_ID
                    else "Local"
                ),
                created_at=attempt.created_at,
            )
            for attempt in LoginAttempt.objects.select_related("user").order_by("-created_at")[
                :limit
            ]
        ]
        merged = sorted(
            admin_events + login_events, key=lambda event: event.created_at, reverse=True
        )
        return merged[:limit]

    @strawberry_django.field
    def access_summary(self) -> AccessSummary:
        since = timezone.now() - datetime.timedelta(hours=24)
        return AccessSummary(
            active_users_count=User.objects.filter(is_active=True).count(),
            deactivated_users_count=User.objects.filter(is_active=False).count(),
            sso_users_count=User.objects.filter(auth_provider=User.AuthProvider.ENTRA_ID).count(),
            successful_sign_ins_24h=LoginAttempt.objects.filter(
                success=True, created_at__gte=since
            ).count(),
            sign_in_failures_24h=LoginAttempt.objects.filter(
                success=False, created_at__gte=since
            ).count(),
        )
