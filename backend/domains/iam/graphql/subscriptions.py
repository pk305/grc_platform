"""IAM's one realtime subscription — session eviction"""

from collections.abc import AsyncGenerator
from typing import Any

import strawberry
from strawberry.types import Info

from domains.iam import realtime


def _consumer(info: Info[Any, Any]) -> Any:
    return info.context["request"]


@strawberry.type
class IamSubscription:
    @strawberry.subscription
    async def session_invalidated(self, info: Info[Any, Any]) -> AsyncGenerator[bool, None]:
        consumer = _consumer(info)
        user = consumer.scope.get("user")
        session = consumer.scope.get("session")
        if user is None or not user.is_authenticated or session is None:
            return
        session_key = session.session_key
        if not session_key:
            return

        async with consumer.listen_to_channel(
            type="iam.session_invalidated",
            groups=[realtime.session_group(session_key)],
        ) as events:
            async for _event in events:
                yield True
                return
