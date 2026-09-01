"""Realtime plumbing for concurrent-session eviction (A.8.5).

`_enforce_single_session` (graphql/mutations.py) already deletes the evicted
browser's `Session` row, which is enough to log it out on its *next* HTTP
request. This module pushes that same fact over the chat websocket — which,
per `core/asgi.py`, serves this whole schema, not just chat's — so a socket
that's already open finds out immediately instead of waiting. Mirrors the
group-naming/broadcast style of `domains/chat/realtime.py`.
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def session_group(session_key: str) -> str:
    return f"iam.session.{session_key}"


def broadcast_session_invalidated(session_key: str) -> None:
    """Tell whatever socket is listening on `session_key`'s own group that
    its session has just been evicted by a sign-in elsewhere. Called
    synchronously, same as `chat.realtime.broadcast_new_message`."""
    async_to_sync(get_channel_layer().group_send)(
        session_group(session_key),
        {"type": "iam.session_invalidated"},
    )
