"""Notification feed — what it surfaces, and what clearing one persists."""

import datetime

import pytest
from django.test import Client
from django.utils import timezone
from strawberry.django.test import GraphQLTestClient

from domains.audit.models import AuditFinding, CorrectiveAction
from domains.iam.models import Role
from domains.iam.tests.factories import LoginAttemptFactory, RoleFactory, UserFactory
from domains.notifications.models import NotificationDismissal
from domains.risk.tests.factories import RiskFactory

pytestmark = pytest.mark.django_db

NOTIFICATIONS = """
  query {
    notifications { key tone title detail href }
  }
"""

CLEAR_NOTIFICATION = """
  mutation($key: String!) {
    clearNotification(key: $key) { key }
  }
"""

CLEAR_ALL = """
  mutation {
    clearAllNotifications { key }
  }
"""


@pytest.fixture
def gql_client(client: Client) -> GraphQLTestClient:
    return GraphQLTestClient(client, url="/api/v1/")


def _sign_in(client: Client, *role_names: str, mfa_enabled: bool = True):
    """A signed-in user with MFA on, so the MFA alert doesn't crowd the tests."""
    user = UserFactory(mfa_enabled=mfa_enabled)
    for name in role_names:
        user.roles.add(RoleFactory(name=name))
    client.force_login(user)
    return user


def _overdue_risk():
    return RiskFactory(next_review_date=timezone.localdate() - datetime.timedelta(days=1))


def _keys(result) -> list[str]:
    return [n["key"] for n in result.data["notifications"]]


def test_anonymous_callers_get_nothing(gql_client: GraphQLTestClient) -> None:
    _overdue_risk()

    result = gql_client.query(NOTIFICATIONS)

    assert result.errors is None
    assert result.data["notifications"] == []


def test_overdue_risks_raise_an_alert(gql_client: GraphQLTestClient, client: Client) -> None:
    _overdue_risk()
    _sign_in(client)

    result = gql_client.query(NOTIFICATIONS)

    assert "risks-overdue" in _keys(result)
    alert = next(n for n in result.data["notifications"] if n["key"] == "risks-overdue")
    assert alert["title"] == "1 risk overdue for review"
    assert alert["href"] == "/risk-register"
    assert alert["tone"] == "danger"


def test_mfa_alert_only_for_accounts_without_it(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _sign_in(client, mfa_enabled=False)

    assert "mfa" in _keys(gql_client.query(NOTIFICATIONS))


def test_overdue_corrective_actions_raise_an_alert(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    finding = AuditFinding.objects.create(title="Missing evidence")
    CorrectiveAction.objects.create(
        finding=finding,
        description="Collect evidence",
        due_date=timezone.localdate() - datetime.timedelta(days=3),
    )
    _sign_in(client)

    assert "actions-overdue" in _keys(gql_client.query(NOTIFICATIONS))


def test_sign_in_failures_are_admin_only(gql_client: GraphQLTestClient, client: Client) -> None:
    LoginAttemptFactory(success=False)

    _sign_in(client, Role.Name.VIEWER)
    assert "sign-in-failures" not in _keys(gql_client.query(NOTIFICATIONS))

    client.logout()
    _sign_in(client, Role.Name.ADMIN)
    assert "sign-in-failures" in _keys(gql_client.query(NOTIFICATIONS))


def test_clearing_persists_and_hides_the_alert(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _overdue_risk()
    user = _sign_in(client)

    remaining = gql_client.query(CLEAR_NOTIFICATION, variables={"key": "risks-overdue"})

    assert [n["key"] for n in remaining.data["clearNotification"]] == []
    # Persisted, not just filtered for this response.
    dismissal = NotificationDismissal.objects.get(user=user, key="risks-overdue")
    assert dismissal.signature == "1"
    assert _keys(gql_client.query(NOTIFICATIONS)) == []


def test_a_cleared_alert_returns_when_the_situation_changes(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _overdue_risk()
    _sign_in(client)
    gql_client.query(CLEAR_NOTIFICATION, variables={"key": "risks-overdue"})
    assert _keys(gql_client.query(NOTIFICATIONS)) == []

    # A second overdue risk changes what the alert says, so it comes back.
    _overdue_risk()

    result = gql_client.query(NOTIFICATIONS)
    alert = next(n for n in result.data["notifications"] if n["key"] == "risks-overdue")
    assert alert["title"] == "2 risks overdue for review"


def test_clearing_is_per_user(gql_client: GraphQLTestClient, client: Client) -> None:
    _overdue_risk()
    _sign_in(client)
    gql_client.query(CLEAR_NOTIFICATION, variables={"key": "risks-overdue"})

    client.logout()
    _sign_in(client)

    assert "risks-overdue" in _keys(gql_client.query(NOTIFICATIONS))


def test_clearing_an_unknown_key_changes_nothing(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _overdue_risk()
    user = _sign_in(client)

    result = gql_client.query(CLEAR_NOTIFICATION, variables={"key": "not-a-real-alert"})

    assert [n["key"] for n in result.data["clearNotification"]] == ["risks-overdue"]
    assert not NotificationDismissal.objects.filter(user=user).exists()


def test_clear_all_clears_every_current_alert(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    _overdue_risk()
    user = _sign_in(client, Role.Name.ADMIN, mfa_enabled=False)
    LoginAttemptFactory(success=False)
    assert len(_keys(gql_client.query(NOTIFICATIONS))) == 3

    result = gql_client.query(CLEAR_ALL)

    assert result.data["clearAllNotifications"] == []
    assert NotificationDismissal.objects.filter(user=user).count() == 3
    assert _keys(gql_client.query(NOTIFICATIONS)) == []


def test_clearing_requires_a_signed_in_user(gql_client: GraphQLTestClient) -> None:
    _overdue_risk()

    result = gql_client.query(CLEAR_NOTIFICATION, variables={"key": "risks-overdue"})

    assert result.errors is None
    assert result.data["clearNotification"] == []
    assert not NotificationDismissal.objects.exists()
