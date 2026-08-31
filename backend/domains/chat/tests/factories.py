import factory

from domains.chat.models import Conversation, Message, Participation, Presence


class ConversationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Conversation


class ParticipationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Participation

    conversation = factory.SubFactory(ConversationFactory)


class MessageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Message

    conversation = factory.SubFactory(ConversationFactory)
    body = factory.Sequence(lambda n: f"message {n}")


class PresenceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Presence
