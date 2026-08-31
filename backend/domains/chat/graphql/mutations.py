import strawberry
import strawberry_django
from strawberry.types import Info

from domains.chat.service import (
    direct_conversation,
    mark_read,
    send_message,
    touch_presence,
    unread_total,
    visible_conversation,
)
from domains.iam.models import User

from .types import ChatMessageType, to_message_types


@strawberry.type
class ChatOpenResult:
    """The thread to show after clicking a name, and what's waiting in it."""

    conversation_id: strawberry.ID
    unread_total: int


@strawberry.type
class ChatReadResult:
    conversation_id: strawberry.ID
    unread_total: int


@strawberry.type
class ChatMutation:
    # These mutations report failure by raising, so the client gets a plain
    # GraphQL error rather than an OperationInfo union to unpack.
    @strawberry_django.mutation(handle_django_errors=False)
    def send_chat_message(
        self,
        info: Info,
        body: str,
        conversation_id: strawberry.ID | None = None,
        recipient_id: strawberry.ID | None = None,
    ) -> ChatMessageType:
        """Post a message, opening the thread with `recipient_id` if it's new.

        Taking a recipient instead of an id is what lets a window be opened and
        used in one action — the thread is created by its first message, so
        opening a chat and thinking better of it leaves nothing behind.
        """
        user = info.context.request.user
        if not user.is_authenticated:
            raise ValueError("Sign in to send messages.")

        conversation = None
        recipient = None
        if conversation_id is not None:
            conversation = visible_conversation(user, int(conversation_id))
            if conversation is None:
                raise ValueError("That conversation is not available.")
        elif recipient_id is not None:
            recipient = User.objects.filter(pk=int(recipient_id)).first()
            if recipient is None:
                raise ValueError("That person is not available.")
        else:
            raise ValueError("Specify a conversation or a recipient.")

        message = send_message(user, body, conversation=conversation, recipient=recipient)
        return to_message_types([message], user)[0]

    @strawberry_django.mutation(handle_django_errors=False)
    def open_chat_conversation(self, info: Info, recipient_id: strawberry.ID) -> ChatOpenResult:
        """Get (or start) the thread with someone, and mark it read.

        Called when a chat window is opened, so the unread badge clears at the
        moment the messages actually come into view.
        """
        user = info.context.request.user
        if not user.is_authenticated:
            raise ValueError("Sign in to use chat.")
        recipient = User.objects.filter(pk=int(recipient_id), is_active=True).first()
        if recipient is None or recipient.pk == user.pk:
            raise ValueError("That person is not available.")

        conversation = direct_conversation(user, recipient)
        mark_read(user, conversation)
        return ChatOpenResult(
            conversation_id=strawberry.ID(str(conversation.pk)),
            unread_total=unread_total(user),
        )

    @strawberry_django.mutation(handle_django_errors=False)
    def mark_chat_read(self, info: Info, conversation_id: strawberry.ID) -> ChatReadResult:
        """Mark a thread read up to now, returning the badge's new total."""
        user = info.context.request.user
        conversation = visible_conversation(user, int(conversation_id))
        if conversation is None:
            raise ValueError("That conversation is not available.")
        mark_read(user, conversation)
        return ChatReadResult(conversation_id=conversation_id, unread_total=unread_total(user))

    @strawberry_django.mutation(handle_django_errors=False)
    def chat_heartbeat(self, info: Info) -> bool:
        """Record that the caller is active, so colleagues see them online.

        A mutation rather than a side effect of the contacts query: presence is
        a write, and a query that quietly writes is a query nobody can cache.
        """
        user = info.context.request.user
        if not user.is_authenticated:
            return False
        touch_presence(user)
        return True
