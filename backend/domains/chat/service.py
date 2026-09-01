"""Chat business rules: who you can talk to, what you can read, what you send.

Every function here takes the acting user and enforces membership itself, so a
caller can never read or post into a thread they don't belong to by guessing an
id. The GraphQL layer above is a thin translation of these functions.

`contacts()` still resolves in a fixed handful of queries regardless of how
many colleagues or threads exist — it no longer needs to survive being polled
every few seconds, but a page load still shouldn't cost a query per row.
Realtime delivery (new messages, presence) is `realtime.py`'s job; this module
only calls into it, and never touches a channel layer directly.
"""

import datetime
from dataclasses import dataclass

from django.db import transaction
from django.db.models import Count, OuterRef, Q, QuerySet, Subquery
from django.utils import timezone

from domains.iam.models import User

from . import realtime
from .images import decode_chat_photo
from .models import Conversation, Message, MessageAttachment, Participation, Presence

# One window's worth of scrollback. The dock's windows are small; anything
# older is history nobody is reading in a 20-line box.
MESSAGE_PAGE_SIZE = 50

MAX_MESSAGE_LENGTH = 4000

MAX_ATTACHMENTS_PER_MESSAGE = 10

# Longest preview the contacts rail will show, before the client's own
# truncation. Keeps the payload small when someone pastes an essay.
PREVIEW_LENGTH = 120


@dataclass(frozen=True)
class Contact:
    """A colleague as the contacts rail shows them.

    Carries the thread with them when one exists, so the rail can render an
    unread badge and a preview without a request per row.
    """

    user: User
    online: bool
    last_seen_at: datetime.datetime | None
    conversation_id: int | None
    unread_count: int
    last_message_preview: str
    last_message_at: datetime.datetime | None


def display_name(user: User) -> str:
    """What to print above a message. Falls back to the login identifier."""
    return f"{user.first_name} {user.last_name}".strip() or user.email


def _conversation_ids_for(user: User) -> QuerySet[Participation]:
    """Ids of every thread `user` belongs to, as a subquery."""
    return Participation.objects.filter(user=user).values("conversation_id")


def _direct_threads(user: User) -> dict[int, tuple[Conversation, Participation]]:
    """Every two-person thread `user` belongs to, keyed by the other person's id.

    Annotated with the newest message so the caller gets previews without a
    query per thread.
    """
    newest = Message.objects.filter(conversation=OuterRef("pk")).order_by("-created_at", "-id")
    # Membership is narrowed with a subquery rather than a join: joining on
    # `participations__user` would constrain the same join the count below
    # aggregates over, and every thread would look like it had one member.
    conversations = (
        Conversation.objects.filter(pk__in=_conversation_ids_for(user))
        .annotate(participant_count=Count("participations", distinct=True))
        .filter(participant_count=2)
        .annotate(preview=Subquery(newest.values("body")[:1]))
        .prefetch_related("participations")
    )

    threads: dict[int, tuple[Conversation, Participation]] = {}
    for conversation in conversations:
        participations = list(conversation.participations.all())
        mine = next((p for p in participations if p.user_id == user.pk), None)
        other = next((p for p in participations if p.user_id != user.pk), None)
        if mine is None or other is None:
            continue
        threads[other.user_id] = (conversation, mine)
    return threads


def _unread_counts(
    user: User, threads: dict[int, tuple[Conversation, Participation]]
) -> dict[int, int]:
    """Unread message counts per conversation id, in a single query.

    "Unread" is anything someone else sent after this user last opened the
    thread; a thread never opened counts everything.
    """
    if not threads:
        return {}

    unread = Q()
    for conversation, participation in threads.values():
        condition = Q(conversation_id=conversation.pk)
        if participation.last_read_at is not None:
            condition &= Q(created_at__gt=participation.last_read_at)
        unread |= condition

    rows = (
        Message.objects.filter(unread)
        .exclude(sender_id=user.pk)
        .values("conversation_id")
        .annotate(total=Count("id"))
    )
    return {row["conversation_id"]: row["total"] for row in rows}


def _build_contact(
    user: User,
    person: User,
    threads: dict[int, tuple[Conversation, Participation]],
    unread: dict[int, int],
    seen: dict[int, datetime.datetime | None],
) -> Contact:
    thread = threads.get(person.pk)
    conversation = thread[0] if thread else None
    return Contact(
        user=person,
        online=realtime.is_online(person.pk),
        last_seen_at=seen.get(person.pk),
        conversation_id=conversation.pk if conversation else None,
        unread_count=unread.get(conversation.pk, 0) if conversation else 0,
        last_message_preview=((conversation.preview or "") if conversation else "")[
            :PREVIEW_LENGTH
        ],
        last_message_at=conversation.last_message_at if conversation else None,
    )


def contacts(user: User, search: str = "", limit: int | None = None) -> list[Contact]:
    """The colleagues `user` can message, ordered the way the rail shows them.

    Deactivated accounts are left out: a thread with someone whose access has
    been revoked is not a conversation anyone can have.
    """
    if not user.is_authenticated:
        return []

    people: QuerySet[User] = User.objects.filter(is_active=True).exclude(pk=user.pk)
    if search:
        people = people.filter(
            Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(email__icontains=search)
            | Q(department__icontains=search)
        )
    people = people.order_by("first_name", "last_name", "email")

    threads = _direct_threads(user)
    unread = _unread_counts(user, threads)
    seen: dict[int, datetime.datetime | None] = dict(
        Presence.objects.filter(user__in=people).values_list("user_id", "last_seen_at")
    )

    results = [_build_contact(user, person, threads, unread, seen) for person in people]

    # Unread first — that is what the rail exists to surface — then whoever
    # spoke most recently, then everyone else alphabetically, online or not.
    # `people` is already alphabetical, and Python's sort is stable, so the
    # tail keeps that order without a tiebreak key.
    results.sort(
        key=lambda contact: (
            0 if contact.unread_count else 1,
            -(contact.last_message_at.timestamp() if contact.last_message_at else 0),
        )
    )
    return results[:limit] if limit else results


def contact(user: User, other_id: int) -> Contact | None:
    """One colleague as the rail would show them.

    The realtime path's per-row equivalent of `contacts()` — a
    `chatContactUpdated` event names only the row that changed, so there's no
    need to rebuild the whole list to refresh one of them.
    """
    person = User.objects.filter(pk=other_id, is_active=True).exclude(pk=user.pk).first()
    if person is None:
        return None
    threads = _direct_threads(user)
    unread = _unread_counts(user, threads)
    seen: dict[int, datetime.datetime | None] = dict(
        Presence.objects.filter(user=person).values_list("user_id", "last_seen_at")
    )
    return _build_contact(user, person, threads, unread, seen)


def unread_total(user: User) -> int:
    """Unread messages across every thread — the number on the navbar badge."""
    if not user.is_authenticated:
        return 0
    threads = _direct_threads(user)
    return sum(_unread_counts(user, threads).values())


def visible_conversation(user: User, conversation_id: int) -> Conversation | None:
    """The thread with that id, but only if `user` is in it."""
    if not user.is_authenticated:
        return None
    return Conversation.objects.filter(pk=conversation_id, participations__user=user).first()


def direct_conversation(user: User, other: User) -> Conversation:
    """The two-person thread between `user` and `other`, created if new.

    Looked up by participant pair so a thread is never duplicated, even if two
    people happen to open a chat with each other at the same moment.
    """
    existing = (
        Conversation.objects.filter(pk__in=_conversation_ids_for(user))
        .filter(pk__in=_conversation_ids_for(other))
        .annotate(participant_count=Count("participations", distinct=True))
        .filter(participant_count=2)
        .order_by("pk")
        .first()
    )
    if existing is not None:
        return existing

    with transaction.atomic():
        conversation = Conversation.objects.create()
        Participation.objects.bulk_create(
            [
                Participation(conversation=conversation, user=user),
                Participation(conversation=conversation, user=other),
            ]
        )
    return conversation


def messages(conversation: Conversation, limit: int = MESSAGE_PAGE_SIZE) -> list[Message]:
    """The newest `limit` messages in `conversation`, oldest first.

    The slice is taken from the newest end and then reversed, so a long thread
    opens on the most recent exchange rather than on its first ever message.
    """
    newest_first = (
        Message.objects.filter(conversation=conversation)
        .select_related("sender")
        .prefetch_related("attachments")
        .order_by("-created_at", "-id")[: max(1, min(limit, MESSAGE_PAGE_SIZE))]
    )
    return list(reversed(list(newest_first)))


def send_message(
    sender: User,
    body: str | None,
    conversation: Conversation | None = None,
    recipient: User | None = None,
    photos: list[str] | None = None,
) -> Message:
    """Post `body` (and/or `photos`) into an existing thread, or a new one with
    `recipient`.

    Accepting a recipient is what lets the UI open a chat window and send in
    one action: the thread comes into existence with its first message, so
    clicking a name and changing your mind leaves nothing behind.
    """
    text = (body or "").strip()
    photos = photos or []
    if not text and not photos:
        raise ValueError("A message cannot be empty.")
    if len(text) > MAX_MESSAGE_LENGTH:
        raise ValueError(f"A message cannot be longer than {MAX_MESSAGE_LENGTH} characters.")
    if len(photos) > MAX_ATTACHMENTS_PER_MESSAGE:
        raise ValueError(f"A message can carry at most {MAX_ATTACHMENTS_PER_MESSAGE} photos.")

    if conversation is None:
        if recipient is None:
            raise ValueError("Specify a conversation or a recipient.")
        if recipient.pk == sender.pk:
            raise ValueError("You cannot message yourself.")
        if not recipient.is_active:
            raise ValueError("That account is deactivated.")
        conversation = direct_conversation(sender, recipient)

    # Decoded before the transaction opens: image processing is CPU work, not
    # something to do while holding row locks.
    decoded = [decode_chat_photo(photo) for photo in photos]

    with transaction.atomic():
        message = Message.objects.create(conversation=conversation, sender=sender, body=text)
        if decoded:
            MessageAttachment.objects.bulk_create(
                [
                    MessageAttachment(
                        message=message,
                        image=image_bytes,
                        content_type="image/jpeg",
                        width=width,
                        height=height,
                    )
                    for image_bytes, width, height in decoded
                ]
            )
        # Sending is also reading: the sender's own message must never come
        # back to them as unread.
        Participation.objects.filter(conversation=conversation, user=sender).update(
            last_read_at=message.created_at
        )
        Conversation.objects.filter(pk=conversation.pk).update(last_message_at=message.created_at)

    recipient_id = (
        Participation.objects.filter(conversation=conversation)
        .exclude(user=sender)
        .values_list("user_id", flat=True)
        .first()
    )
    if recipient_id is not None:
        realtime.broadcast_new_message(
            conversation_id=conversation.pk,
            message_id=message.pk,
            sender_id=sender.pk,
            recipient_id=recipient_id,
        )
    return message


def mark_read(user: User, conversation: Conversation) -> None:
    """Move `user`'s read marker in `conversation` up to now."""
    Participation.objects.filter(conversation=conversation, user=user).update(
        last_read_at=timezone.now()
    )
