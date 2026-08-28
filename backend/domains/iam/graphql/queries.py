import strawberry
import strawberry_django
from strawberry.types import Info

from .types import RoleFilter, RoleOrder, RoleType, UserFilter, UserOrder, UserType


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
