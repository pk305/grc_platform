"""Realtime chat plumbing: channel-layer broadcast and connection-based
presence.

Everything a socket needs to announce — "a message arrived", "someone is now
online" — funnels through here, so `graphql/consumers.py` and
`graphql/subscriptions.py` don't each reinvent group naming or the presence
counter's grace-period logic. `service.py` calls into this after a message
is committed; it never needs to know about channel layers or caches itself.

Presence counters live in the `"chat_presence"` cache alias (Redis in dev/
prod, in-process in tests — see `core/settings/*.py`) rather than a raw Redis
client, so the counting logic is exercised by the ordinary test suite instead
of needing a live Redis to run at all.
"""

import asyncio

from asgiref.sync import async_to_sync, sync_to_async
from channels.layers import get_channel_layer
from django.core.cache import caches
from django.core.cache.backends.base import BaseCache
from django.utils import timezone

from .models import Presence

# How long to wait, after a socket drops, before treating the user as
# offline. A reconnect (network blip, hot reload, closing one of several open
# tabs) within this window cancels the "went offline" broadcast rather than
# flickering the dot.
PRESENCE_GRACE_SECONDS = 5

# A day is long enough to outlive any realistic connection, short enough that
# a counter orphaned by a crashed worker (skipped its decrement) doesn't
# stick forever.
PRESENCE_KEY_TTL_SECONDS = 24 * 60 * 60

PRESENCE_GROUP = "chat.presence"


def _cache() -> BaseCache:
    return caches["chat_presence"]


def _presence_key(user_id: int) -> str:
    return f"chat:presence:{user_id}"


def conversation_group(conversation_id: int | str) -> str:
    return f"chat.conversation.{conversation_id}"


def rail_group(user_id: int | str) -> str:
    return f"chat.rail.{user_id}"


def is_online(user_id: int) -> bool:
    """Whether `user_id` currently has at least one open chat socket."""
    value = _cache().get(_presence_key(user_id))
    return bool(value) and int(value) > 0


def _group_send(group: str, message: dict) -> None:  # type: ignore[type-arg]
    async_to_sync(get_channel_layer().group_send)(group, message)


def broadcast_new_message(
    *, conversation_id: int, message_id: int, sender_id: int, recipient_id: int
) -> None:
    """Tell the conversation's subscribers a message landed, and nudge the
    recipient's rail. Called synchronously from `service.send_message` after
    its transaction commits."""
    _group_send(
        conversation_group(conversation_id),
        {"type": "chat.message", "message_id": message_id},
    )
    _group_send(
        rail_group(recipient_id),
        {"type": "chat.rail.update", "contact_id": sender_id},
    )


def broadcast_typing(*, conversation_id: int, user_id: int, typing: bool) -> None:
    """Tell the conversation's other participant someone is (or isn't)
    typing. Purely ephemeral — nothing is persisted, and a client that
    vanishes mid-type without sending the "stopped" signal is handled by the
    *receiving* side timing the indicator out on its own, not by anything
    here."""
    _group_send(
        conversation_group(conversation_id),
        {"type": "chat.typing", "user_id": user_id, "typing": typing},
    )


async def mark_connected(user_id: int) -> None:
    """Called when a user's chat socket opens. Broadcasts "online" only on
    the transition from zero to one open sockets — a second tab doesn't
    re-announce someone who's already showing as online."""
    cache = _cache()
    key = _presence_key(user_id)
    await cache.aadd(key, 0, timeout=PRESENCE_KEY_TTL_SECONDS)
    count = await cache.aincr(key)
    if count == 1:
        await _broadcast_presence(user_id, online=True)


async def mark_disconnected(user_id: int) -> None:
    """Called when a user's chat socket closes. See `PRESENCE_GRACE_SECONDS`
    for why "offline" isn't broadcast immediately."""
    cache = _cache()
    key = _presence_key(user_id)
    try:
        count = await cache.adecr(key)
    except ValueError:
        # No key at all (e.g. a stray disconnect with no matching connect) —
        # nothing to do.
        return
    if count < 0:
        # Defensive: shouldn't happen outside a lost increment, but a
        # negative counter would never recover on its own.
        await cache.aset(key, 0, timeout=PRESENCE_KEY_TTL_SECONDS)
        count = 0
    if count > 0:
        return

    await asyncio.sleep(PRESENCE_GRACE_SECONDS)
    # Re-check: a reconnect during the grace window already bumped this back
    # up, in which case the disconnect we're handling is stale.
    current = await cache.aget(key)
    if current is not None and int(current) > 0:
        return

    await _broadcast_presence(user_id, online=False)
    await sync_to_async(_touch_last_seen)(user_id)


async def _broadcast_presence(user_id: int, *, online: bool) -> None:
    layer = get_channel_layer()
    await layer.group_send(
        PRESENCE_GROUP,
        {"type": "chat.presence", "user_id": user_id, "online": online},
    )


def _touch_last_seen(user_id: int) -> None:
    Presence.objects.update_or_create(user_id=user_id, defaults={"last_seen_at": timezone.now()})
