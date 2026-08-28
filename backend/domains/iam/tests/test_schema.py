import datetime

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import Client
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from strawberry.django.test import GraphQLTestClient

from domains.iam.models import IamAuditEvent, LoginAttempt, Permission, Role, User

from .factories import LoginAttemptFactory, RoleFactory, UserFactory

pytestmark = pytest.mark.django_db

ACCESS_SUMMARY = """
  query {
    accessSummary {
      activeUsersCount
      deactivatedUsersCount
      ssoUsersCount
      successfulSignIns24h
      signInFailures24h
    }
  }
"""

CREATE_USER = """
  mutation($data: UserCreateInput!) {
    createUser(data: $data) {
      ... on UserType { id email }
      ... on OperationInfo { messages { kind field message } }
    }
  }
"""

ASSIGN_ROLE = """
  mutation($data: AssignRoleInput!) {
    assignRole(data: $data) {
      ... on UserType { id roles { name } }
      ... on RoleError { message }
      ... on OperationInfo { messages { kind message } }
    }
  }
"""

REVOKE_ROLE = """
  mutation($data: AssignRoleInput!) {
    revokeRole(data: $data) {
      ... on UserType { id roles { name } }
      ... on RoleError { message }
      ... on OperationInfo { messages { kind message } }
    }
  }
"""

SET_USER_ACTIVE = """
  mutation($userId: ID!, $isActive: Boolean!) {
    setUserActive(userId: $userId, isActive: $isActive) {
      ... on UserType { id isActive }
      ... on OperationInfo { messages { kind field message } }
    }
  }
"""

DELETE_USER = """
  mutation($userId: ID!) {
    deleteUser(userId: $userId) {
      ... on UserType { id }
      ... on OperationInfo { messages { kind field message } }
    }
  }
"""

START_ACCESS_REVIEW = """
  mutation($userIds: [ID!]!) {
    startAccessReview(userIds: $userIds) {
      id
      nextAccessReviewDate
    }
  }
"""

PERMISSIONS = """
  query {
    permissions {
      resource
      action
      isoClause
      roles { name }
    }
  }
"""

AUDIT_EVENTS = """
  query {
    auditEvents(limit: 10) {
      id
      eventType
      actor
      detail
    }
  }
"""

REQUEST_PASSWORD_RESET = """
  mutation($email: String!) {
    requestPasswordReset(email: $email)
  }
"""

RESET_PASSWORD = """
  mutation($uid: String!, $token: String!, $newPassword: String!) {
    resetPassword(uid: $uid, token: $token, newPassword: $newPassword) {
      ... on UserType { id }
      ... on OperationInfo { messages { field message } }
    }
  }
"""


def test_users_query_returns_users(gql_client: GraphQLTestClient) -> None:
    UserFactory.create_batch(2)
    result = gql_client.query("query { users { id email } }")
    assert result.errors is None
    assert result.data is not None
    assert len(result.data["users"]) == 2


def test_me_is_null_when_anonymous(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query("query { me { id } }")
    assert result.errors is None
    assert result.data is not None
    assert result.data["me"] is None


def test_create_user_requires_admin(gql_client: GraphQLTestClient, client: Client) -> None:
    actor = UserFactory()
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {"email": "new@example.com", "username": "new", "password": "Str0ng-pass!"}
        },
    )
    assert result.errors is None
    assert result.data["createUser"]["messages"][0]["kind"] == "PERMISSION"
    assert not User.objects.filter(email="new@example.com").exists()


def test_admin_can_create_user(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {"email": "new@example.com", "username": "new", "password": "Str0ng-pass!"}
        },
    )
    assert result.errors is None
    assert result.data is not None
    assert result.data["createUser"]["email"] == "new@example.com"


def test_create_user_rejects_weak_password(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={"data": {"email": "x@example.com", "username": "x", "password": "123"}},
    )
    assert result.errors is None
    assert result.data is not None
    assert result.data["createUser"]["messages"]


def test_roles_query_lists_seeded_roles(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query("query { roles { name } }")
    assert result.errors is None
    assert result.data is not None
    names = {r["name"] for r in result.data["roles"]}
    assert names == {c[0] for c in Role.Name.choices}


def test_assign_role_requires_admin(gql_client: GraphQLTestClient, client: Client) -> None:
    actor = UserFactory()
    target = UserFactory()
    role = RoleFactory(name=Role.Name.CONTROL_OWNER)
    client.force_login(actor)

    result = gql_client.query(
        ASSIGN_ROLE,
        variables={"data": {"userId": str(target.pk), "roleName": role.name}},
    )

    assert result.errors is None
    assert result.data["assignRole"]["messages"][0]["kind"] == "PERMISSION"
    assert not target.roles.exists()


def test_admin_can_assign_and_revoke_role(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    target = UserFactory()
    role = RoleFactory(name=Role.Name.AUDITOR)
    client.force_login(actor)

    assign_result = gql_client.query(
        ASSIGN_ROLE,
        variables={"data": {"userId": str(target.pk), "roleName": role.name}},
    )
    assert assign_result.errors is None
    assert [r["name"] for r in assign_result.data["assignRole"]["roles"]] == [role.name]

    revoke_result = gql_client.query(
        REVOKE_ROLE,
        variables={"data": {"userId": str(target.pk), "roleName": role.name}},
    )
    assert revoke_result.errors is None
    assert revoke_result.data["revokeRole"]["roles"] == []


def test_create_user_logs_audit_event(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    gql_client.query(
        CREATE_USER,
        variables={
            "data": {"email": "new@example.com", "username": "new", "password": "Str0ng-pass!"}
        },
    )

    event = IamAuditEvent.objects.get(event_type=IamAuditEvent.EventType.USER_CREATED)
    assert event.actor == actor
    assert event.detail == "new@example.com"


def test_set_user_active_toggles_and_logs(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    target = UserFactory(is_active=True)
    client.force_login(actor)

    result = gql_client.query(
        SET_USER_ACTIVE, variables={"userId": str(target.pk), "isActive": False}
    )

    assert result.errors is None
    assert result.data["setUserActive"]["isActive"] is False
    target.refresh_from_db()
    assert target.is_active is False
    event = IamAuditEvent.objects.get(event_type=IamAuditEvent.EventType.USER_DEACTIVATED)
    assert event.target_user == target


def test_set_user_active_requires_admin(gql_client: GraphQLTestClient, client: Client) -> None:
    actor = UserFactory()
    target = UserFactory(is_active=True)
    client.force_login(actor)

    result = gql_client.query(
        SET_USER_ACTIVE, variables={"userId": str(target.pk), "isActive": False}
    )

    assert result.errors is None
    assert result.data["setUserActive"]["messages"][0]["kind"] == "PERMISSION"
    target.refresh_from_db()
    assert target.is_active is True


def test_set_user_active_rejects_self_deactivation(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role], is_active=True)
    client.force_login(actor)

    result = gql_client.query(
        SET_USER_ACTIVE, variables={"userId": str(actor.pk), "isActive": False}
    )

    assert result.errors is None
    assert result.data["setUserActive"]["messages"]
    actor.refresh_from_db()
    assert actor.is_active is True


def test_delete_user_rejects_self_delete(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    result = gql_client.query(DELETE_USER, variables={"userId": str(actor.pk)})

    assert result.errors is None
    assert result.data["deleteUser"]["messages"]
    assert User.objects.filter(pk=actor.pk).exists()


def test_delete_user_logs_audit_event(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    target = UserFactory(email="gone@example.com")
    client.force_login(actor)

    result = gql_client.query(DELETE_USER, variables={"userId": str(target.pk)})

    assert result.errors is None
    assert not User.objects.filter(pk=target.pk).exists()
    event = IamAuditEvent.objects.get(event_type=IamAuditEvent.EventType.USER_DELETED)
    assert event.detail == "gone@example.com"


def test_assign_and_revoke_role_log_audit_events(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    target = UserFactory()
    role = RoleFactory(name=Role.Name.AUDITOR)
    client.force_login(actor)

    gql_client.query(
        ASSIGN_ROLE, variables={"data": {"userId": str(target.pk), "roleName": role.name}}
    )
    gql_client.query(
        REVOKE_ROLE, variables={"data": {"userId": str(target.pk), "roleName": role.name}}
    )

    assert IamAuditEvent.objects.filter(event_type=IamAuditEvent.EventType.ROLE_GRANTED).exists()
    assert IamAuditEvent.objects.filter(event_type=IamAuditEvent.EventType.ROLE_REVOKED).exists()


def test_start_access_review_sets_date_for_selected_users(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    targets = UserFactory.create_batch(2)
    untouched = UserFactory()
    client.force_login(actor)

    result = gql_client.query(
        START_ACCESS_REVIEW,
        variables={"userIds": [str(t.pk) for t in targets]},
    )

    assert result.errors is None
    today = timezone.now().date().isoformat()
    assert all(u["nextAccessReviewDate"] == today for u in result.data["startAccessReview"])
    untouched.refresh_from_db()
    assert untouched.next_access_review_date is None


def test_start_access_review_requires_admin(gql_client: GraphQLTestClient, client: Client) -> None:
    actor = UserFactory()
    target = UserFactory()
    client.force_login(actor)

    result = gql_client.query(START_ACCESS_REVIEW, variables={"userIds": [str(target.pk)]})

    assert result.errors is None
    assert result.data["startAccessReview"] == []
    target.refresh_from_db()
    assert target.next_access_review_date is None


def test_permissions_query_returns_seeded_catalog(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query(PERMISSIONS)

    assert result.errors is None
    assert len(result.data["permissions"]) == Permission.objects.count()
    iam_users_view = next(
        p
        for p in result.data["permissions"]
        if p["resource"] == "iam_users" and p["action"] == "view"
    )
    assert iam_users_view["isoClause"] == "A.5.16"
    assert {r["name"] for r in iam_users_view["roles"]} == {"admin", "ciso"}


def test_audit_events_merges_admin_actions_and_sign_ins(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    target = UserFactory()
    role = RoleFactory(name=Role.Name.VIEWER)
    client.force_login(actor)
    LoginAttemptFactory(success=True)

    gql_client.query(
        ASSIGN_ROLE, variables={"data": {"userId": str(target.pk), "roleName": role.name}}
    )

    result = gql_client.query(AUDIT_EVENTS)

    assert result.errors is None
    event_types = {e["eventType"] for e in result.data["auditEvents"]}
    assert "role.granted" in event_types
    assert "sso.sign_in" in event_types


def test_request_password_reset_sends_email_for_existing_user(
    gql_client: GraphQLTestClient,
) -> None:
    user = UserFactory(email="known@example.com")

    result = gql_client.query(REQUEST_PASSWORD_RESET, variables={"email": user.email})

    assert result.errors is None
    assert result.data["requestPasswordReset"] is True
    assert len(mail.outbox) == 1
    assert user.email in mail.outbox[0].to
    assert "/auth/reset-password" in mail.outbox[0].body


def test_request_password_reset_does_not_leak_unknown_email(
    gql_client: GraphQLTestClient,
) -> None:
    result = gql_client.query(REQUEST_PASSWORD_RESET, variables={"email": "nobody@example.com"})

    assert result.errors is None
    assert result.data["requestPasswordReset"] is True
    assert len(mail.outbox) == 0


def test_reset_password_with_valid_token_changes_password(
    gql_client: GraphQLTestClient,
) -> None:
    user = UserFactory()
    user.set_password("Old-Passw0rd!")
    user.save()
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    result = gql_client.query(
        RESET_PASSWORD,
        variables={"uid": uid, "token": token, "newPassword": "New-Str0ng-pass!"},
    )

    assert result.errors is None
    assert result.data["resetPassword"]["id"] == str(user.pk)
    user.refresh_from_db()
    assert user.check_password("New-Str0ng-pass!")


def test_reset_password_with_invalid_token_fails(gql_client: GraphQLTestClient) -> None:
    user = UserFactory()
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    result = gql_client.query(
        RESET_PASSWORD,
        variables={"uid": uid, "token": "not-a-real-token", "newPassword": "New-Str0ng-pass!"},
    )

    assert result.errors is None
    assert result.data["resetPassword"]["messages"]


def test_access_summary_counts_active_and_deactivated_users(
    gql_client: GraphQLTestClient,
) -> None:
    UserFactory(is_active=True, auth_provider=User.AuthProvider.ENTRA_ID)
    UserFactory(is_active=True, auth_provider=User.AuthProvider.LOCAL)
    UserFactory(is_active=False)

    result = gql_client.query(ACCESS_SUMMARY)

    assert result.errors is None
    summary = result.data["accessSummary"]
    assert summary["activeUsersCount"] == 2
    assert summary["deactivatedUsersCount"] == 1
    assert summary["ssoUsersCount"] == 1


def test_access_summary_windows_sign_ins_to_last_24h(gql_client: GraphQLTestClient) -> None:
    LoginAttemptFactory(success=True)
    LoginAttemptFactory(success=False)
    stale_success = LoginAttemptFactory(success=True)
    LoginAttempt.objects.filter(pk=stale_success.pk).update(
        created_at=timezone.now() - datetime.timedelta(hours=25)
    )

    result = gql_client.query(ACCESS_SUMMARY)

    assert result.errors is None
    summary = result.data["accessSummary"]
    assert summary["successfulSignIns24h"] == 1
    assert summary["signInFailures24h"] == 1


def test_reset_password_rejects_weak_password(gql_client: GraphQLTestClient) -> None:
    user = UserFactory()
    user.set_password("Old-Passw0rd!")
    user.save()
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    result = gql_client.query(
        RESET_PASSWORD,
        variables={"uid": uid, "token": token, "newPassword": "123"},
    )

    assert result.errors is None
    assert result.data["resetPassword"]["messages"]
    user.refresh_from_db()
    assert user.check_password("Old-Passw0rd!")
