"""Chat over GraphQL — who can see what, and what sending a message does."""

import datetime

import pytest
from django.test import Client
from django.utils import timezone
from strawberry.django.test import GraphQLTestClient

from domains.chat.models import Conversation, Message, Participation, Presence
from domains.chat.service import ONLINE_WINDOW, direct_conversation
from domains.iam.tests.factories import UserFactory

pytestmark = pytest.mark.django_db

CONTACTS = """
  query($search: String) {
    chatContacts(search: $search) {
      id
      conversationId
      unreadCount
      lastMessagePreview
      participant { id name email online }
    }
  }
"""

MESSAGES = """
  query($conversationId: ID!) {
    chatMessages(conversationId: $conversationId) { id body mine sender { name } }
  }
"""

UNREAD_TOTAL = """
  query { chatUnreadTotal }
"""

SEND = """
  mutation($body: String!, $conversationId: ID, $recipientId: ID) {
    sendChatMessage(body: $body, conversationId: $conversationId, recipientId: $recipientId) {
      id body mine conversationId sender { name }
    }
  }
"""

OPEN = """
  mutation($recipientId: ID!) {
    openChatConversation(recipientId: $recipientId) { conversationId unreadTotal }
  }
"""

MARK_READ = """
  mutation($conversationId: ID!) {
    markChatRead(conversationId: $conversationId) { conversationId unreadTotal }
  }
"""

HEARTBEAT = """
  mutation { chatHeartbeat }
"""


@pytest.fixture
def gql_client(client: Client) -> GraphQLTestClient:
    return GraphQLTestClient(client, url="/api/v1/")


def _sign_in(client: Client, **kwargs):
    user = UserFactory(**kwargs)
    client.force_login(user)
    return user


def _thread(user_a, user_b, *bodies_from):
    """A thread between two people, seeded with `(sender, body)` messages."""
    conversation = direct_conversation(user_a, user_b)
    for sender, body in bodies_from:
        Message.objects.create(conversation=conversation, sender=sender, body=body)
    return conversation


def test_anonymous_callers_see_no_contacts(gql_client: GraphQLTestClient) -> None:
    UserFactory()

    result = gql_client.query(CONTACTS)

    assert result.errors is None
    assert result.data["chatContacts"] == []


def test_contacts_list_colleagues_but_not_yourself(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client)
    colleague = UserFactory(first_name="Grace", last_name="Hopper")

    result = gql_client.query(CONTACTS)

    ids = [row["participant"]["id"] for row in result.data["chatContacts"]]
    assert ids == [str(colleague.pk)]
    assert str(me.pk) not in ids


def test_deactivated_accounts_are_not_offered(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _sign_in(client)
    UserFactory(is_active=False)

    result = gql_client.query(CONTACTS)

    assert result.data["chatContacts"] == []


def test_contacts_can_be_searched_by_name_or_department(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _sign_in(client)
    UserFactory(first_name="Grace", last_name="Hopper", department="Engineering")
    UserFactory(first_name="Alan", last_name="Turing", department="Research")

    result = gql_client.query(CONTACTS, variables={"search": "engineer"})

    names = [row["participant"]["name"] for row in result.data["chatContacts"]]
    assert names == ["Grace Hopper"]


def test_a_contact_carries_its_thread_and_unread_count(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client)
    colleague = UserFactory()
    conversation = _thread(me, colleague, (colleague, "morning"), (colleague, "you around?"))

    row = gql_client.query(CONTACTS).data["chatContacts"][0]

    assert row["conversationId"] == str(conversation.pk)
    assert row["unreadCount"] == 2
    assert row["lastMessagePreview"] == "you around?"


def test_your_own_messages_are_never_unread(gql_client: GraphQLTestClient, client: Client) -> None:
    me = _sign_in(client)
    colleague = UserFactory()
    _thread(me, colleague, (me, "hello"))

    assert gql_client.query(UNREAD_TOTAL).data["chatUnreadTotal"] == 0


def test_contacts_with_unread_messages_sort_first(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client)
    UserFactory(first_name="Aaron", last_name="Early")
    noisy = UserFactory(first_name="Zoe", last_name="Late")
    _thread(me, noisy, (noisy, "ping"))

    result = gql_client.query(CONTACTS)

    assert [row["participant"]["name"] for row in result.data["chatContacts"]] == [
        "Zoe Late",
        "Aaron Early",
    ]


def test_messages_are_returned_oldest_first_and_sided(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client, first_name="Ada", last_name="Lovelace")
    colleague = UserFactory(first_name="Grace", last_name="Hopper")
    conversation = _thread(me, colleague, (colleague, "hi"), (me, "hello back"))

    result = gql_client.query(MESSAGES, variables={"conversationId": str(conversation.pk)})

    messages = result.data["chatMessages"]
    assert [m["body"] for m in messages] == ["hi", "hello back"]
    assert [m["mine"] for m in messages] == [False, True]
    assert messages[0]["sender"]["name"] == "Grace Hopper"


def test_a_thread_you_are_not_in_reads_as_empty(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _sign_in(client)
    others = [UserFactory(), UserFactory()]
    conversation = _thread(others[0], others[1], (others[0], "private"))

    result = gql_client.query(MESSAGES, variables={"conversationId": str(conversation.pk)})

    assert result.errors is None
    assert result.data["chatMessages"] == []


def test_sending_to_a_recipient_starts_the_thread(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client)
    colleague = UserFactory()

    result = gql_client.query(
        SEND, variables={"body": "first contact", "recipientId": str(colleague.pk)}
    )

    sent = result.data["sendChatMessage"]
    assert sent["body"] == "first contact"
    assert sent["mine"] is True
    conversation = Conversation.objects.get(pk=int(sent["conversationId"]))
    assert set(conversation.participants.all()) == {me, colleague}


def test_messaging_the_same_person_twice_reuses_one_thread(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _sign_in(client)
    colleague = UserFactory()

    first = gql_client.query(SEND, variables={"body": "one", "recipientId": str(colleague.pk)})
    second = gql_client.query(SEND, variables={"body": "two", "recipientId": str(colleague.pk)})

    assert (
        first.data["sendChatMessage"]["conversationId"]
        == second.data["sendChatMessage"]["conversationId"]
    )
    assert Conversation.objects.count() == 1


def test_sending_bumps_the_thread_for_ordering(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client)
    colleague = UserFactory()
    conversation = direct_conversation(me, colleague)
    before = conversation.last_message_at

    gql_client.query(SEND, variables={"body": "later", "conversationId": str(conversation.pk)})

    conversation.refresh_from_db()
    assert conversation.last_message_at > before


def test_an_empty_message_is_rejected(gql_client: GraphQLTestClient, client: Client) -> None:
    _sign_in(client)
    colleague = UserFactory()

    result = gql_client.query(
        SEND, variables={"body": "   ", "recipientId": str(colleague.pk)}, assert_no_errors=False
    )

    assert result.errors
    assert Message.objects.count() == 0


def test_you_cannot_post_into_someone_elses_thread(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _sign_in(client)
    others = [UserFactory(), UserFactory()]
    conversation = _thread(others[0], others[1], (others[0], "private"))

    result = gql_client.query(
        SEND,
        variables={"body": "intruding", "conversationId": str(conversation.pk)},
        assert_no_errors=False,
    )

    assert result.errors
    assert conversation.messages.count() == 1


def test_you_cannot_message_yourself(gql_client: GraphQLTestClient, client: Client) -> None:
    me = _sign_in(client)

    result = gql_client.query(
        SEND, variables={"body": "hi me", "recipientId": str(me.pk)}, assert_no_errors=False
    )

    assert result.errors


def test_opening_a_conversation_clears_its_unread_count(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client)
    colleague = UserFactory()
    _thread(me, colleague, (colleague, "unread one"), (colleague, "unread two"))

    result = gql_client.query(OPEN, variables={"recipientId": str(colleague.pk)})

    assert result.data["openChatConversation"]["unreadTotal"] == 0
    assert gql_client.query(UNREAD_TOTAL).data["chatUnreadTotal"] == 0


def test_a_reply_after_reading_becomes_unread_again(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client)
    colleague = UserFactory()
    conversation = _thread(me, colleague, (colleague, "first"))
    gql_client.query(MARK_READ, variables={"conversationId": str(conversation.pk)})

    Message.objects.create(conversation=conversation, sender=colleague, body="second")

    assert gql_client.query(UNREAD_TOTAL).data["chatUnreadTotal"] == 1


def test_marking_a_thread_you_are_not_in_is_refused(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _sign_in(client)
    others = [UserFactory(), UserFactory()]
    conversation = _thread(others[0], others[1], (others[0], "private"))

    result = gql_client.query(
        MARK_READ, variables={"conversationId": str(conversation.pk)}, assert_no_errors=False
    )

    assert result.errors
    assert not Participation.objects.filter(
        conversation=conversation, last_read_at__isnull=False
    ).exists()


def test_a_heartbeat_puts_you_online_for_colleagues(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    colleague = UserFactory()
    Presence.objects.create(user=colleague)
    _sign_in(client)

    row = gql_client.query(CONTACTS).data["chatContacts"][0]

    assert row["participant"]["online"] is True


def test_a_stale_heartbeat_reads_as_offline(gql_client: GraphQLTestClient, client: Client) -> None:
    colleague = UserFactory()
    presence = Presence.objects.create(user=colleague)
    Presence.objects.filter(pk=presence.pk).update(
        last_seen_at=timezone.now() - ONLINE_WINDOW - datetime.timedelta(minutes=1)
    )
    _sign_in(client)

    row = gql_client.query(CONTACTS).data["chatContacts"][0]

    assert row["participant"]["online"] is False


def test_heartbeat_records_presence_for_the_caller(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    me = _sign_in(client)

    assert gql_client.query(HEARTBEAT).data["chatHeartbeat"] is True
    assert Presence.objects.filter(user=me).exists()


def test_anonymous_heartbeats_record_nothing(gql_client: GraphQLTestClient) -> None:
    assert gql_client.query(HEARTBEAT).data["chatHeartbeat"] is False
    assert Presence.objects.count() == 0
