"""Messaging between colleagues — threads, their messages, and who is online."""

from django.conf import settings
from django.db import models


class Conversation(models.Model):
    """A thread between two or more people.

    Two-person threads are the common case, and are found by their pair of
    participants rather than by id (see `service.direct_conversation`) so that
    opening a chat with the same colleague twice continues one history instead
    of forking a second empty thread.
    """

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="Participation", related_name="conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    # Denormalised from the newest message so the contacts rail can order
    # threads by recency without aggregating over the message table on every
    # poll. Kept current by `service.send_message`.
    last_message_at = models.DateTimeField(db_index=True, auto_now_add=True)

    class Meta:
        ordering = ["-last_message_at"]

    def __str__(self) -> str:
        return f"conversation {self.pk}"


class Participation(models.Model):
    """One person's membership of a thread, and how far they have read.

    Read state is a single timestamp per person per thread rather than a row
    per message: unread counts are always "messages since you last looked",
    which is what the badge means, and the table stays the size of the
    membership list instead of the message log.
    """

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="participations"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_participations"
    )
    last_read_at = models.DateTimeField("last read", blank=True, null=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "user"], name="unique_chat_participation"
            )
        ]

    def __str__(self) -> str:
        return f"{self.user} in {self.conversation}"


class Message(models.Model):
    """One message in a thread. Immutable once sent."""

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_messages"
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self) -> str:
        return f"{self.sender}: {self.body[:40]}"


class Presence(models.Model):
    """When someone was last seen with the app open.

    Chat owns this rather than IAM: it exists only to decide whether a name in
    the contacts rail gets a green dot, and the identity domain shouldn't grow
    a column for a cosmetic detail of another domain. `last_seen_at` is
    refreshed by the client's heartbeat, so "online" means recently active
    rather than merely signed in.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_presence"
    )
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_seen_at"]

    def __str__(self) -> str:
        return f"{self.user} last seen {self.last_seen_at:%Y-%m-%d %H:%M}"
