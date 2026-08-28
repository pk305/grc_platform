import datetime

import strawberry
import strawberry_django
from django.utils import timezone
from strawberry.types import Info

from domains.iam.models import LoginAttempt, User

from .types import AccessSummary, RoleFilter, RoleOrder, RoleType, UserFilter, UserOrder, UserType


@strawberry.type
class IamQuery:
    users: list[UserType] = strawberry_django.field(
        filters=UserFilter, order=UserOrder, pagination=True
    )
    roles: list[RoleType] = strawberry_django.field(filters=RoleFilter, order=RoleOrder)

    @strawberry_django.field
    def me(self, info: Info) -> UserType | None:
        user = info.context.request.user
        return user if user.is_authenticated else None

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
