"""IP address capture on the audit trail — ISO/IEC 27001:2022 A.8.15
(logging). Covers both halves of `auditEvents`/`myAuditEvents`: admin
actions (`IamAuditEvent`) and sign-ins (`LoginAttempt`).

Django's test `Client` defaults REMOTE_ADDR to 127.0.0.1 (see
django/test/client.py), so that's the address every assertion here expects.
"""

import pytest
from django.test import Client
from strawberry.django.test import GraphQLTestClient

from domains.iam.models import IamAuditEvent, LoginAttempt, Role
from domains.iam.tests.factories import RoleFactory, UserFactory

pytestmark = pytest.mark.django_db

PASSWORD = "Str0ng-pass!"
TEST_CLIENT_IP = "127.0.0.1"

LOGIN = """
  mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) { __typename }
  }
"""

ASSIGN_ROLE = """
  mutation($data: AssignRoleInput!) {
    assignRole(data: $data) {
      ... on UserType { id }
      ... on RoleError { message }
    }
  }
"""

AUDIT_EVENTS = """
  query {
    auditEvents(limit: 10) {
      id
      eventType
      ipAddress
    }
  }
"""


def _gql(client: Client) -> GraphQLTestClient:
    return GraphQLTestClient(client, url="/api/v1/")


def test_a_successful_login_records_the_clients_ip_address() -> None:
    user = UserFactory(email="ip-test@acentriagroup.com")
    user.set_password(PASSWORD)
    user.save()

    _gql(Client()).query(LOGIN, variables={"email": user.email, "password": PASSWORD})

    attempt = LoginAttempt.objects.get(email=user.email, success=True)
    assert attempt.ip_address == TEST_CLIENT_IP


def test_a_failed_login_records_the_clients_ip_address() -> None:
    user = UserFactory(email="ip-test2@acentriagroup.com")
    user.set_password(PASSWORD)
    user.save()

    _gql(Client()).query(LOGIN, variables={"email": user.email, "password": "wrong-password"})

    attempt = LoginAttempt.objects.get(email=user.email, success=False)
    assert attempt.ip_address == TEST_CLIENT_IP


def test_an_admin_action_records_the_actors_ip_address() -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    viewer_role = RoleFactory(name=Role.Name.VIEWER)
    actor = UserFactory(roles=[admin_role])
    target = UserFactory()
    client = Client()
    client.force_login(actor)

    _gql(client).query(
        ASSIGN_ROLE, variables={"data": {"userId": str(target.pk), "roleName": viewer_role.name}}
    )

    event = IamAuditEvent.objects.get(
        event_type=IamAuditEvent.EventType.ROLE_GRANTED, target_user=target
    )
    assert event.ip_address == TEST_CLIENT_IP


def test_audit_events_query_exposes_the_recorded_ip_address(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    IamAuditEvent.objects.create(
        event_type=IamAuditEvent.EventType.USER_UPDATED,
        actor=actor,
        detail="test",
        ip_address="203.0.113.5",
    )

    result = gql_client.query(AUDIT_EVENTS)
    assert result.errors is None
    events = {event["eventType"]: event for event in result.data["auditEvents"]}
    assert events["user.updated"]["ipAddress"] == "203.0.113.5"
