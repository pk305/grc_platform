from django.contrib import admin

from .models import Conversation, Message, Participation, Presence


class ParticipationInline(admin.TabularInline):
    model = Participation
    extra = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "last_message_at", "created_at"]
    inlines = [ParticipationInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["id", "conversation", "sender", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["body"]


@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ["user", "last_seen_at"]
