"""Realtime chat subscriptions — messages, rail updates, and presence, each
riding one of the channel-layer groups `domains/chat/realtime.py` broadcasts
to.

The GraphQL WS context is a plain dict (`{"request": consumer, "ws": consumer}`,
set by strawberry's `GraphQLWSConsumer.get_context`) rather than the
attribute-style context the HTTP view builds — hence `info.context["request"]`
below instead of the `info.context.request` used by queries/mutations.
"""

from collections.abc import AsyncGenerator
from typing import Any

import strawberry
from asgiref.sync import sync_to_async
from strawberry.types import Info

from domains.chat import realtime
from domains.chat.models import Message
from domains.chat.service import contact as contact_row
from domains.chat.service import visible_conversation
from domains.iam.models import User

from .types import ChatContactType, ChatMessageType, to_contact_types, to_message_types


@strawberry.type
class ChatPresenceEvent:
    user_id: strawberry.ID
    online: bool


@strawberry.type
class ChatTypingEvent:
    user_id: strawberry.ID
    typing: bool


def _consumer(info: Info[Any, Any]) -> Any:
    return info.context["request"]


def _user(info: Info[Any, Any]) -> User:
    return _consumer(info).scope["user"]  # type: ignore[no-any-return]


def _message_for(message_id: int, viewer: User) -> ChatMessageType | None:
    message = (
        Message.objects.filter(pk=message_id)
        .select_related("sender")
        .prefetch_related("attachments")
        .first()
    )
    return to_message_types([message], viewer)[0] if message else None


def _contact_for(viewer: User, other_id: int) -> ChatContactType | None:
    row = contact_row(viewer, other_id)
    return to_contact_types([row])[0] if row else None


@strawberry.type
class ChatSubscription:
    @strawberry.subscription
    async def chat_message_received(
        self, info: Info[Any, Any], conversation_id: strawberry.ID
    ) -> AsyncGenerator[ChatMessageType, None]:
        """Every new message posted to `conversation_id`, for as long as the
        caller is actually a participant in it."""
        user = _user(info)
        if not user.is_authenticated:
            return
        conversation = await sync_to_async(visible_conversation)(user, int(conversation_id))
        if conversation is None:
            return

        consumer = _consumer(info)
        async with consumer.listen_to_channel(
            type="chat.message",
            groups=[realtime.conversation_group(conversation_id)],
        ) as events:
            async for event in events:
                message = await sync_to_async(_message_for)(event["message_id"], user)
                if message is not None:
                    yield message

    @strawberry.subscription
    async def chat_contact_updated(
        self, info: Info[Any, Any]
    ) -> AsyncGenerator[ChatContactType, None]:
        """The caller's own contacts-rail rows, one at a time, whenever a
        message from that colleague changes it."""
        user = _user(info)
        if not user.is_authenticated:
            return

        consumer = _consumer(info)
        async with consumer.listen_to_channel(
            type="chat.rail.update",
            groups=[realtime.rail_group(user.pk)],
        ) as events:
            async for event in events:
                row = await sync_to_async(_contact_for)(user, event["contact_id"])
                if row is not None:
                    yield row

    @strawberry.subscription
    async def chat_typing_changed(
        self, info: Info[Any, Any], conversation_id: strawberry.ID
    ) -> AsyncGenerator[ChatTypingEvent, None]:
        """Whether the other participant in `conversation_id` is currently
        typing. Only reaches actual participants, same guard as
        `chat_message_received`."""
        user = _user(info)
        if not user.is_authenticated:
            return
        conversation = await sync_to_async(visible_conversation)(user, int(conversation_id))
        if conversation is None:
            return

        consumer = _consumer(info)
        async with consumer.listen_to_channel(
            type="chat.typing",
            groups=[realtime.conversation_group(conversation_id)],
        ) as events:
            async for event in events:
                # Don't echo the typist's own signal back to themselves —
                # everyone in the conversation shares this one group.
                if event["user_id"] == user.pk:
                    continue
                yield ChatTypingEvent(
                    user_id=strawberry.ID(str(event["user_id"])),
                    typing=event["typing"],
                )

    @strawberry.subscription
    async def chat_presence_changed(
        self, info: Info[Any, Any]
    ) -> AsyncGenerator[ChatPresenceEvent, None]:
        """Every online/offline transition, for every colleague — small
        enough at this org's scale that it doesn't need per-viewer scoping."""
        user = _user(info)
        if not user.is_authenticated:
            return

        consumer = _consumer(info)
        async with consumer.listen_to_channel(
            type="chat.presence",
            groups=[realtime.PRESENCE_GROUP],
        ) as events:
            async for event in events:
                yield ChatPresenceEvent(
                    user_id=strawberry.ID(str(event["user_id"])),
                    online=event["online"],
                )
