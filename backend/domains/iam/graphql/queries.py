import datetime

import strawberry
import strawberry_django
from django.db.models import Q
from django.utils import timezone
from strawberry.types import Info

from domains.iam.models import IamAuditEvent, LoginAttempt, Role, User
from domains.iam.permissions import require_roles

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

MAX_AUDIT_EVENT_LIMIT = 500


def _admin_event(event: IamAuditEvent) -> AuditEventType:
    return AuditEventType(
        id=f"iam-{event.pk}",
        event_type=event.event_type,
        actor=event.actor.email if event.actor else "System",
        detail=event.detail,
        created_at=event.created_at,
    )


def _login_event(attempt: LoginAttempt) -> AuditEventType:
    return AuditEventType(
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


def _merge_events(
    admin_events: list[AuditEventType], login_events: list[AuditEventType], limit: int
) -> list[AuditEventType]:
    merged = sorted(admin_events + login_events, key=lambda event: event.created_at, reverse=True)
    return merged[:limit]


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

    @strawberry_django.field(extensions=[require_roles(Role.Name.ADMIN)])
    def username_available(self, username: str) -> bool:
        return not User.objects.filter(username=username).exists()

    @strawberry_django.field
    def audit_events(self, limit: int = 50) -> list[AuditEventType]:
        limit = max(1, min(limit, MAX_AUDIT_EVENT_LIMIT))
        admin_events = [
            _admin_event(event)
            for event in IamAuditEvent.objects.select_related("actor", "target_user").order_by(
                "-created_at"
            )[:limit]
        ]
        login_events = [
            _login_event(attempt)
            for attempt in LoginAttempt.objects.select_related("user").order_by("-created_at")[
                :limit
            ]
        ]
        return _merge_events(admin_events, login_events, limit)

    @strawberry_django.field
    def my_audit_events(self, info: Info, limit: int = 25) -> list[AuditEventType]:
        """The signed-in user's own account trail.

        Scoped to events the caller is the actor or the subject of, plus their
        own sign-in attempts — so the account holder can see what is recorded
        about them (A.5.34) without being granted the tenant-wide log (A.8.15).
        """
        user = info.context.request.user
        if not user.is_authenticated:
            return []

        limit = max(1, min(limit, MAX_AUDIT_EVENT_LIMIT))
        admin_events = [
            _admin_event(event)
            for event in IamAuditEvent.objects.filter(Q(actor=user) | Q(target_user=user))
            .select_related("actor", "target_user")
            .order_by("-created_at")[:limit]
        ]
        login_events = [
            _login_event(attempt)
            for attempt in LoginAttempt.objects.filter(user=user)
            .select_related("user")
            .order_by("-created_at")[:limit]
        ]
        return _merge_events(admin_events, login_events, limit)

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
