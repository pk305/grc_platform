import strawberry
import strawberry_django
from strawberry.types import Info

from domains.chat.service import (
    MESSAGE_PAGE_SIZE,
    contacts,
    messages,
    unread_total,
    visible_conversation,
)

from .types import ChatContactType, ChatMessageType, to_contact_types, to_message_types


@strawberry.type
class ChatQuery:
    @strawberry_django.field
    def chat_contacts(
        self, info: Info, search: str | None = None, limit: int | None = None
    ) -> list[ChatContactType]:
        """The colleagues the caller can message, with their threads' state.

        One request backs the whole contacts rail — unread badges, previews and
        status dots included — because the client repeats it on a timer.
        """
        return to_contact_types(
            contacts(info.context.request.user, search=(search or "").strip(), limit=limit)
        )

    @strawberry_django.field
    def chat_messages(
        self, info: Info, conversation_id: strawberry.ID, limit: int | None = None
    ) -> list[ChatMessageType]:
        """A thread's recent messages, oldest first.

        Empty rather than an error when the caller isn't in the thread: an id
        that isn't yours should look like an id that doesn't exist.
        """
        user = info.context.request.user
        conversation = visible_conversation(user, int(conversation_id))
        if conversation is None:
            return []
        return to_message_types(messages(conversation, limit=limit or MESSAGE_PAGE_SIZE), user)

    @strawberry_django.field
    def chat_unread_total(self, info: Info) -> int:
        """Unread messages across every thread — the navbar badge's number."""
        return unread_total(info.context.request.user)
