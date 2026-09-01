import datetime

import strawberry

from domains.chat.service import Contact, display_name
from domains.iam.images import to_data_url
from domains.iam.models import User, UserAvatar


@strawberry.type
class ChatParticipantType:
    """A person as they appear in chat: a name, a face, and a status dot.

    Deliberately narrower than IAM's `UserType` — a chat window has no business
    exposing an account's roles or MFA state.
    """

    id: strawberry.ID
    name: str
    email: str
    department: str
    avatar_url: str | None
    online: bool
    last_seen_at: datetime.datetime | None


@strawberry.type
class ChatAttachmentType:
    id: strawberry.ID
    url: str
    width: int
    height: int


@strawberry.type
class ChatMessageType:
    id: strawberry.ID
    conversation_id: strawberry.ID
    body: str
    created_at: datetime.datetime
    sender: ChatParticipantType
    # Which side of the window the bubble goes on. Decided here rather than by
    # comparing ids in the client, so every client agrees.
    mine: bool
    attachments: list[ChatAttachmentType]


@strawberry.type
class ChatContactType:
    """One row of the contacts rail.

    `id` is the colleague's user id, which makes the row stable in the client's
    cache: a reply arriving, or the thread being read, updates the row in place
    rather than replacing the list.
    """

    id: strawberry.ID
    participant: ChatParticipantType
    conversation_id: strawberry.ID | None
    unread_count: int
    last_message_preview: str
    last_message_at: datetime.datetime | None


def _avatar_url(user: User, avatars: dict[int, UserAvatar]) -> str | None:
    avatar = avatars.get(user.pk)
    return to_data_url(avatar.image, avatar.content_type) if avatar else None


def _avatars_for(users: list[User]) -> dict[int, UserAvatar]:
    """Avatars for `users`, in one query — a rail of 50 rows shouldn't make 50."""
    if not users:
        return {}
    return {
        avatar.user_id: avatar
        for avatar in UserAvatar.objects.filter(user__in=[u.pk for u in users])
    }


def to_participant_type(
    user: User,
    *,
    online: bool = False,
    last_seen_at: datetime.datetime | None = None,
    avatars: dict[int, UserAvatar] | None = None,
) -> ChatParticipantType:
    return ChatParticipantType(
        id=strawberry.ID(str(user.pk)),
        name=display_name(user),
        email=user.email,
        department=user.department,
        avatar_url=_avatar_url(user, avatars if avatars is not None else _avatars_for([user])),
        online=online,
        last_seen_at=last_seen_at,
    )


def to_contact_types(contacts: list[Contact]) -> list[ChatContactType]:
    avatars = _avatars_for([contact.user for contact in contacts])
    return [
        ChatContactType(
            id=strawberry.ID(str(contact.user.pk)),
            participant=to_participant_type(
                contact.user,
                online=contact.online,
                last_seen_at=contact.last_seen_at,
                avatars=avatars,
            ),
            conversation_id=(
                strawberry.ID(str(contact.conversation_id)) if contact.conversation_id else None
            ),
            unread_count=contact.unread_count,
            last_message_preview=contact.last_message_preview,
            last_message_at=contact.last_message_at,
        )
        for contact in contacts
    ]


def to_message_types(messages: list, viewer: User) -> list[ChatMessageType]:
    senders = list({message.sender.pk: message.sender for message in messages}.values())
    avatars = _avatars_for(senders)
    return [
        ChatMessageType(
            id=strawberry.ID(str(message.pk)),
            conversation_id=strawberry.ID(str(message.conversation_id)),
            body=message.body,
            created_at=message.created_at,
            sender=to_participant_type(message.sender, avatars=avatars),
            mine=message.sender_id == viewer.pk,
            attachments=[
                ChatAttachmentType(
                    id=strawberry.ID(str(attachment.pk)),
                    url=to_data_url(attachment.image, attachment.content_type),
                    width=attachment.width,
                    height=attachment.height,
                )
                for attachment in message.attachments.all()
            ],
        )
        for message in messages
    ]
