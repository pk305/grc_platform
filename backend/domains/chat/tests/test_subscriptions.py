"""Chat's realtime path — messages, rail updates and presence delivered over
a WebSocket instead of polled.

Uses strawberry's `GraphQLWebsocketCommunicator` for the message/rail
subscriptions (full stack: consumer, protocol, resolver) and drives
`domains.chat.realtime` directly for presence, since the grace-period timing
is `realtime`'s own logic regardless of which socket triggers it, and
exercising it that way keeps these tests fast.
"""

import asyncio
from collections.abc import Iterator
from unittest import mock

import pytest
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from django.core.cache import caches
from strawberry.channels.testing import GraphQLWebsocketCommunicator

from core.schema import schema
from domains.chat import realtime
from domains.chat.graphql.consumers import ChatGraphQLWSConsumer
from domains.chat.service import direct_conversation, send_message
from domains.iam.models import User
from domains.iam.tests.factories import UserFactory

pytestmark = [pytest.mark.django_db(transaction=True), pytest.mark.asyncio]


@pytest.fixture(autouse=True)
def _clear_presence_cache() -> Iterator[None]:
    # `transaction=True` tests truncate the DB between runs rather than
    # rolling back a transaction, so user pks can repeat across tests — the
    # presence cache would otherwise leak a stale counter from one test's
    # user into the next test's user of the same pk.
    caches["chat_presence"].clear()
    yield

MESSAGE_RECEIVED = """
  subscription($conversationId: ID!) {
    chatMessageReceived(conversationId: $conversationId) { body mine }
  }
"""

CONTACT_UPDATED = """
  subscription { chatContactUpdated { id lastMessagePreview } }
"""

TYPING_CHANGED = """
  subscription($conversationId: ID!) {
    chatTypingChanged(conversationId: $conversationId) { userId typing }
  }
"""


async def _connected(user: User) -> GraphQLWebsocketCommunicator:
    """An authenticated GraphQL-over-WS communicator for `user`.

    `AuthMiddlewareStack` is what reads the session cookie in the real app
    (see core/asgi.py); tests skip that and inject the user into the scope
    directly, same as Channels' own docs recommend for testing an
    authenticated consumer in isolation.
    """
    communicator = GraphQLWebsocketCommunicator(
        ChatGraphQLWSConsumer.as_asgi(schema=schema), path="/ws/graphql"
    )
    communicator.scope["user"] = user
    await communicator.gql_init()
    return communicator


async def test_a_sent_message_is_delivered_to_the_recipient() -> None:
    sender = await sync_to_async(UserFactory)()
    recipient = await sync_to_async(UserFactory)()
    conversation = await sync_to_async(direct_conversation)(sender, recipient)

    listener = await _connected(recipient)
    try:
        subscription = listener.subscribe(
            MESSAGE_RECEIVED, variables={"conversationId": str(conversation.pk)}
        )
        # `subscribe()` is a generator: nothing runs — including sending the
        # `subscribe` protocol message and the server registering the
        # channel-layer group — until it's actually iterated. Prime it and
        # give the server a moment to finish that registration before
        # publishing, or the broadcast fires into an empty group. (Its
        # declared return type is a union with a plain `ExecutionResult`,
        # even though a body with `yield` makes it unconditionally an async
        # generator at runtime — hence the ignore below.)
        result_task = asyncio.create_task(subscription.__anext__())  # type: ignore[union-attr,arg-type]
        await asyncio.sleep(0.1)

        await sync_to_async(send_message)(sender, "hello there", conversation=conversation)

        result = await result_task
        assert result.errors is None
        assert result.data == {"chatMessageReceived": {"body": "hello there", "mine": False}}
    finally:
        await listener.disconnect()


async def test_a_sent_message_updates_the_recipients_rail() -> None:
    sender = await sync_to_async(UserFactory)()
    recipient = await sync_to_async(UserFactory)()
    conversation = await sync_to_async(direct_conversation)(sender, recipient)

    listener = await _connected(recipient)
    try:
        subscription = listener.subscribe(CONTACT_UPDATED)
        # `subscribe()`'s declared return type is a union with a plain
        # `ExecutionResult` even though, since its body always contains a
        # `yield`, it's unconditionally an async generator at runtime.
        result_task = asyncio.create_task(subscription.__anext__())  # type: ignore[union-attr,arg-type]
        await asyncio.sleep(0.1)

        await sync_to_async(send_message)(sender, "ping", conversation=conversation)

        result = await result_task
        assert result.errors is None
        assert result.data == {
            "chatContactUpdated": {"id": str(sender.pk), "lastMessagePreview": "ping"}
        }
    finally:
        await listener.disconnect()


async def test_presence_broadcasts_online_then_offline_after_the_grace_period() -> None:
    user = await sync_to_async(UserFactory)()
    layer = get_channel_layer()
    channel = await layer.new_channel()
    await layer.group_add(realtime.PRESENCE_GROUP, channel)

    with mock.patch.object(realtime, "PRESENCE_GRACE_SECONDS", 0.05):
        await realtime.mark_connected(user.pk)
        online_event = await asyncio.wait_for(layer.receive(channel), timeout=1)
        assert online_event == {"type": "chat.presence", "user_id": user.pk, "online": True}

        await realtime.mark_disconnected(user.pk)
        offline_event = await asyncio.wait_for(layer.receive(channel), timeout=1)
        assert offline_event == {"type": "chat.presence", "user_id": user.pk, "online": False}

    assert realtime.is_online(user.pk) is False


async def test_a_reconnect_during_the_grace_period_cancels_the_offline_broadcast() -> None:
    user = await sync_to_async(UserFactory)()
    layer = get_channel_layer()
    channel = await layer.new_channel()
    await layer.group_add(realtime.PRESENCE_GROUP, channel)

    with mock.patch.object(realtime, "PRESENCE_GRACE_SECONDS", 0.2):
        await realtime.mark_connected(user.pk)
        await asyncio.wait_for(layer.receive(channel), timeout=1)  # the "online" event

        # A second tab opening covers the disconnect below before its grace
        # period elapses. The counter's 0→1 transition still re-broadcasts
        # "online" (harmless — the UI was already showing online) but the
        # point of the grace period is that "offline" never follows it.
        disconnect_task = asyncio.create_task(realtime.mark_disconnected(user.pk))
        await asyncio.sleep(0.05)
        await realtime.mark_connected(user.pk)
        await disconnect_task

        reconnect_online_event = await asyncio.wait_for(layer.receive(channel), timeout=1)
        assert reconnect_online_event == {
            "type": "chat.presence",
            "user_id": user.pk,
            "online": True,
        }

        with pytest.raises(TimeoutError):
            await asyncio.wait_for(layer.receive(channel), timeout=0.5)

    assert realtime.is_online(user.pk) is True


async def test_two_tabs_only_broadcast_online_once() -> None:
    user = await sync_to_async(UserFactory)()
    layer = get_channel_layer()
    channel = await layer.new_channel()
    await layer.group_add(realtime.PRESENCE_GROUP, channel)

    await realtime.mark_connected(user.pk)
    await asyncio.wait_for(layer.receive(channel), timeout=1)  # the first tab's "online"

    await realtime.mark_connected(user.pk)  # a second tab
    with pytest.raises(TimeoutError):
        await asyncio.wait_for(layer.receive(channel), timeout=0.3)


async def test_typing_is_delivered_to_the_other_participant() -> None:
    typist = await sync_to_async(UserFactory)()
    other = await sync_to_async(UserFactory)()
    conversation = await sync_to_async(direct_conversation)(typist, other)

    listener = await _connected(other)
    try:
        subscription = listener.subscribe(
            TYPING_CHANGED, variables={"conversationId": str(conversation.pk)}
        )
        result_task = asyncio.create_task(subscription.__anext__())  # type: ignore[union-attr,arg-type]
        await asyncio.sleep(0.1)

        await sync_to_async(realtime.broadcast_typing)(
            conversation_id=conversation.pk, user_id=typist.pk, typing=True
        )

        result = await result_task
        assert result.errors is None
        assert result.data == {
            "chatTypingChanged": {"userId": str(typist.pk), "typing": True}
        }
    finally:
        await listener.disconnect()


async def test_typing_is_not_echoed_back_to_the_typist() -> None:
    typist = await sync_to_async(UserFactory)()
    other = await sync_to_async(UserFactory)()
    conversation = await sync_to_async(direct_conversation)(typist, other)

    listener = await _connected(typist)
    try:
        subscription = listener.subscribe(
            TYPING_CHANGED, variables={"conversationId": str(conversation.pk)}
        )
        result_task = asyncio.create_task(subscription.__anext__())  # type: ignore[union-attr,arg-type]
        await asyncio.sleep(0.1)

        await sync_to_async(realtime.broadcast_typing)(
            conversation_id=conversation.pk, user_id=typist.pk, typing=True
        )

        with pytest.raises(TimeoutError):
            await asyncio.wait_for(asyncio.shield(result_task), timeout=0.5)
    finally:
        result_task.cancel()
        await asyncio.gather(result_task, return_exceptions=True)
        await listener.disconnect()
