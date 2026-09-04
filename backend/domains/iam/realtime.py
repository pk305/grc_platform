"""Realtime plumbing for concurrent-session eviction"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def session_group(session_key: str) -> str:
    return f"iam.session.{session_key}"


def broadcast_session_invalidated(session_key: str) -> None:
    async_to_sync(get_channel_layer().group_send)(
        session_group(session_key),
        {"type": "iam.session_invalidated"},
    )
