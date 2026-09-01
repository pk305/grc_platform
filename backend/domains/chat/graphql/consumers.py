"""The WebSocket entry point for chat's realtime GraphQL subscriptions.

A thin subclass of strawberry's own `GraphQLWSConsumer` — the GraphQL
protocol handling (both the `graphql-ws` and `graphql-transport-ws`
subprotocols) is entirely theirs; this only adds the connect/disconnect
hooks that turn a socket's lifecycle into presence (see `domains/chat/realtime.py`).
"""

from strawberry.channels import GraphQLWSConsumer

from domains.chat import realtime


class ChatGraphQLWSConsumer(GraphQLWSConsumer):
    async def connect(self) -> None:
        await super().connect()
        user = self.scope.get("user")
        if user is not None and user.is_authenticated:
            await realtime.mark_connected(user.pk)

    async def disconnect(self, code: int) -> None:
        user = self.scope.get("user")
        # Wait for strawberry's own run loop (and every subscription's
        # cleanup) to finish first, so a subscription's `finally` block never
        # races the presence broadcast below.
        await super().disconnect(code)
        if user is not None and user.is_authenticated:
            await realtime.mark_disconnected(user.pk)
