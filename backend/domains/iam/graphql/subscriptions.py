"""IAM's one realtime subscription — session eviction (A.8.5).

Same GraphQL-over-WS context shape as chat's own subscriptions.py (a plain
dict rather than the attribute-style context the HTTP view builds), because
both are served off the one websocket route in core/asgi.py.
"""

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
        """Fires once and ends: the session this socket authenticated with
        got evicted by a sign-in elsewhere. The socket's session key is fixed
        for its lifetime (set at the WS handshake, same as the HTTP session
        cookie), so listening on that one group is enough."""
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
