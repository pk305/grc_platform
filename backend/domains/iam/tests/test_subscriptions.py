"""IAM's one realtime subscription: a socket evicted by a concurrent sign-in
finds out immediately, over the same websocket route chat's own
subscriptions use (see core/asgi.py — one route serves the whole schema).
"""

import asyncio
from dataclasses import dataclass

import pytest
from asgiref.sync import sync_to_async
from strawberry.channels.testing import GraphQLWebsocketCommunicator

from core.schema import schema
from domains.chat.graphql.consumers import ChatGraphQLWSConsumer
from domains.iam import realtime
from domains.iam.tests.factories import UserFactory

pytestmark = [pytest.mark.django_db(transaction=True), pytest.mark.asyncio]

SESSION_INVALIDATED = "subscription { sessionInvalidated }"


@dataclass
class _FakeSession:
    """Stands in for Channels' real session object — only `.session_key` is
    read by the resolver under test."""

    session_key: str


async def test_session_invalidated_fires_for_the_evicted_sockets_own_session() -> None:
    user = await sync_to_async(UserFactory)()
    communicator = GraphQLWebsocketCommunicator(
        ChatGraphQLWSConsumer.as_asgi(schema=schema), path="/ws/graphql"
    )
    communicator.scope["user"] = user
    communicator.scope["session"] = _FakeSession(session_key="test-session-key")
    await communicator.gql_init()

    try:
        subscription = communicator.subscribe(SESSION_INVALIDATED)
        result_task = asyncio.create_task(subscription.__anext__())  # type: ignore[union-attr,arg-type]
        await asyncio.sleep(0.1)

        await sync_to_async(realtime.broadcast_session_invalidated)("test-session-key")

        result = await result_task
        assert result.errors is None
        assert result.data == {"sessionInvalidated": True}
    finally:
        await communicator.disconnect()


async def test_session_invalidated_ignores_other_sessions() -> None:
    user = await sync_to_async(UserFactory)()
    communicator = GraphQLWebsocketCommunicator(
        ChatGraphQLWSConsumer.as_asgi(schema=schema), path="/ws/graphql"
    )
    communicator.scope["user"] = user
    communicator.scope["session"] = _FakeSession(session_key="test-session-key")
    await communicator.gql_init()

    try:
        subscription = communicator.subscribe(SESSION_INVALIDATED)
        result_task = asyncio.create_task(subscription.__anext__())  # type: ignore[union-attr,arg-type]
        await asyncio.sleep(0.1)

        await sync_to_async(realtime.broadcast_session_invalidated)("someone-elses-session-key")

        with pytest.raises(TimeoutError):
            await asyncio.wait_for(asyncio.shield(result_task), timeout=0.5)
    finally:
        result_task.cancel()
        await asyncio.gather(result_task, return_exceptions=True)
        await communicator.disconnect()
