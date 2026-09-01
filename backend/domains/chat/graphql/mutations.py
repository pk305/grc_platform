import strawberry
import strawberry_django
from strawberry.types import Info

from domains.chat import realtime
from domains.chat.calls import CallsNotConfigured, create_online_meeting
from domains.chat.service import (
    direct_conversation,
    display_name,
    mark_read,
    send_message,
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
class ChatCallResult:
    join_url: str


@strawberry.type
class ChatMutation:
    # These mutations report failure by raising, so the client gets a plain
    # GraphQL error rather than an OperationInfo union to unpack.
    @strawberry_django.mutation(handle_django_errors=False)
    def send_chat_message(
        self,
        info: Info,
        body: str | None = None,
        conversation_id: strawberry.ID | None = None,
        recipient_id: strawberry.ID | None = None,
        photos: list[str] | None = None,
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

        message = send_message(
            user, body, conversation=conversation, recipient=recipient, photos=photos
        )
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
    def set_chat_typing(
        self, info: Info, conversation_id: strawberry.ID, typing: bool
    ) -> bool:
        """Tell the other participant in `conversation_id` whether the caller
        is currently typing. Nothing is stored — this only broadcasts."""
        user = info.context.request.user
        if not user.is_authenticated:
            return False
        conversation = visible_conversation(user, int(conversation_id))
        if conversation is None:
            raise ValueError("That conversation is not available.")
        realtime.broadcast_typing(
            conversation_id=conversation.pk, user_id=user.pk, typing=typing
        )
        return True

    @strawberry_django.mutation(handle_django_errors=False)
    def start_chat_call(
        self, info: Info, recipient_id: strawberry.ID, video: bool
    ) -> ChatCallResult:
        """Create a Teams meeting with `recipient_id` and return its join link.

        Opens (or reuses) the direct thread the same way sending a message
        does, so a call can be started before any message has been sent.
        """
        user = info.context.request.user
        if not user.is_authenticated:
            raise ValueError("Sign in to start a call.")
        recipient = User.objects.filter(pk=int(recipient_id), is_active=True).first()
        if recipient is None or recipient.pk == user.pk:
            raise ValueError("That person is not available.")

        direct_conversation(user, recipient)

        kind = "Video" if video else "Voice"
        subject = f"{kind} call: {display_name(user)} and {display_name(recipient)}"
        try:
            join_url = create_online_meeting(user.email, subject)
        except CallsNotConfigured as exc:
            raise ValueError(
                "Calling isn't set up yet. Ask your admin to configure Microsoft Graph."
            ) from exc

        return ChatCallResult(join_url=join_url)
