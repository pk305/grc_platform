import base64
import datetime
import io

import pyotp
import pytest
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import Client
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from PIL import Image
from strawberry.django.test import GraphQLTestClient

from domains.iam.crypto import encrypt
from domains.iam.images import AVATAR_EDGE_PX, MAX_ENCODED_LENGTH
from domains.iam.models import (
    IamAuditEvent,
    LoginAttempt,
    MfaRecoveryCode,
    Permission,
    Role,
    User,
    UserAvatar,
)

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

USERNAME_AVAILABLE = """
  query($username: String!) {
    usernameAvailable(username: $username)
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

CHANGE_PASSWORD = """
  mutation($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      ... on UserType { id mustChangePassword }
      ... on OperationInfo { messages { field message } }
    }
  }
"""

LOGIN = """
  mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      __typename
      ... on UserType { id email }
      ... on AuthError { message }
      ... on MfaRequired { message }
    }
  }
"""

VERIFY_MFA_CODE = """
  mutation($code: String!) {
    verifyMfaCode(code: $code) {
      __typename
      ... on UserType { id email }
      ... on AuthError { message }
      ... on MfaRequired { message }
    }
  }
"""

BEGIN_MFA_SETUP = """
  mutation {
    beginMfaSetup {
      ... on MfaSetupType { secret provisioningUri }
      ... on OperationInfo { messages { message } }
    }
  }
"""

CONFIRM_MFA_SETUP = """
  mutation($code: String!) {
    confirmMfaSetup(code: $code) {
      ... on MfaConfirmedType {
        user { id mfaEnabled mfaRequired }
        recoveryCodes
      }
      ... on OperationInfo { messages { message } }
    }
  }
"""

DISABLE_MFA = """
  mutation($password: String!) {
    disableMfa(password: $password) {
      ... on UserType { id mfaEnabled }
      ... on OperationInfo { messages { message } }
    }
  }
"""

ADMIN_RESET_MFA = """
  mutation($userId: ID!) {
    adminResetMfa(userId: $userId) {
      ... on UserType { id mfaEnabled }
      ... on OperationInfo { messages { kind message } }
    }
  }
"""

SET_MFA_REQUIRED = """
  mutation($userId: ID!, $required: Boolean!) {
    setMfaRequired(userId: $userId, required: $required) {
      ... on UserType { id mfaRequired }
      ... on OperationInfo { messages { kind message } }
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


def test_username_available_reports_taken_and_free(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    UserFactory(username="taken")
    client.force_login(actor)

    taken_result = gql_client.query(USERNAME_AVAILABLE, variables={"username": "taken"})
    assert taken_result.errors is None
    assert taken_result.data["usernameAvailable"] is False

    free_result = gql_client.query(USERNAME_AVAILABLE, variables={"username": "free"})
    assert free_result.errors is None
    assert free_result.data["usernameAvailable"] is True


def test_username_available_requires_admin(gql_client: GraphQLTestClient, client: Client) -> None:
    actor = UserFactory()
    client.force_login(actor)

    result = gql_client.query(
        USERNAME_AVAILABLE, variables={"username": "anything"}, assert_no_errors=False
    )

    assert result.errors is not None


def test_create_user_requires_admin(gql_client: GraphQLTestClient, client: Client) -> None:
    actor = UserFactory()
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "new@example.com",
                "username": "new",
                "password": "Str0ng-pass!",
                "roleName": Role.Name.VIEWER,
            }
        },
    )
    assert result.errors is None
    assert result.data["createUser"]["messages"][0]["kind"] == "PERMISSION"
    assert not User.objects.filter(email="new@example.com").exists()


def test_admin_can_create_user(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    viewer_role = RoleFactory(name=Role.Name.VIEWER)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "new@example.com",
                "username": "new",
                "password": "Str0ng-pass!",
                "roleName": viewer_role.name,
                "requireMfa": True,
            }
        },
    )
    assert result.errors is None
    assert result.data is not None
    assert result.data["createUser"]["email"] == "new@example.com"
    created = User.objects.get(email="new@example.com")
    assert created.must_change_password is True
    assert created.next_access_review_date is not None
    assert created.mfa_required is True
    assert created.mfa_enabled is False
    assert [r.name for r in created.roles.all()] == [viewer_role.name]
    assert len(mail.outbox) == 0


def test_create_user_sends_welcome_email_when_requested(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    viewer_role = RoleFactory(name=Role.Name.VIEWER)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "new@example.com",
                "username": "new",
                "password": "Str0ng-pass!",
                "roleName": viewer_role.name,
                "sendWelcomeEmail": True,
            }
        },
    )

    assert result.errors is None
    assert result.data["createUser"]["email"] == "new@example.com"
    assert len(mail.outbox) == 1
    assert "new@example.com" in mail.outbox[0].to
    assert "Str0ng-pass!" in mail.outbox[0].body


def test_create_user_rejects_weak_password(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "x@example.com",
                "username": "x",
                "password": "123",
                "roleName": Role.Name.VIEWER,
            }
        },
    )
    assert result.errors is None
    assert result.data is not None
    assert result.data["createUser"]["messages"]


def test_create_user_rejects_duplicate_username(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    UserFactory(username="taken")
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "new@example.com",
                "username": "taken",
                "password": "Str0ng-pass!",
                "roleName": Role.Name.VIEWER,
            }
        },
    )

    assert result.errors is None
    assert result.data is not None
    assert result.data["createUser"]["messages"]
    assert not User.objects.filter(email="new@example.com").exists()


def test_create_user_rejects_email_shaped_username(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "new@example.com",
                "username": "new@example.com",
                "password": "Str0ng-pass!",
                "roleName": Role.Name.VIEWER,
            }
        },
    )

    assert result.errors is None
    assert result.data is not None
    assert result.data["createUser"]["messages"]
    assert not User.objects.filter(email="new@example.com").exists()


def test_create_user_rejects_duplicate_email(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    UserFactory(email="taken@example.com")
    client.force_login(actor)

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "taken@example.com",
                "username": "new",
                "password": "Str0ng-pass!",
                "roleName": Role.Name.VIEWER,
            }
        },
    )

    assert result.errors is None
    assert result.data is not None
    assert result.data["createUser"]["messages"]
    assert not User.objects.filter(username="new").exists()


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
    viewer_role = RoleFactory(name=Role.Name.VIEWER)
    actor = UserFactory(roles=[admin_role])
    client.force_login(actor)

    gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "new@example.com",
                "username": "new",
                "password": "Str0ng-pass!",
                "roleName": viewer_role.name,
            }
        },
    )

    event = IamAuditEvent.objects.get(event_type=IamAuditEvent.EventType.USER_CREATED)
    assert event.actor == actor
    assert event.detail == f"new@example.com ({viewer_role.name})"


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


def test_change_password_clears_must_change_flag(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(must_change_password=True)
    user.set_password("Temp-Passw0rd!")
    user.save()
    client.force_login(user)

    result = gql_client.query(
        CHANGE_PASSWORD,
        variables={"oldPassword": "Temp-Passw0rd!", "newPassword": "Str0ng-New-pass!"},
    )

    assert result.errors is None
    assert result.data["changePassword"]["mustChangePassword"] is False
    user.refresh_from_db()
    assert user.must_change_password is False
    assert user.check_password("Str0ng-New-pass!")


def test_change_password_rejects_wrong_old_password(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    user.set_password("Temp-Passw0rd!")
    user.save()
    client.force_login(user)

    result = gql_client.query(
        CHANGE_PASSWORD,
        variables={"oldPassword": "wrong-password", "newPassword": "Str0ng-New-pass!"},
    )

    assert result.errors is None
    assert result.data["changePassword"]["messages"]
    user.refresh_from_db()
    assert user.check_password("Temp-Passw0rd!")


def test_change_password_requires_authentication(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query(
        CHANGE_PASSWORD,
        variables={"oldPassword": "whatever", "newPassword": "Str0ng-New-pass!"},
    )

    assert result.errors is None
    assert result.data["changePassword"]["messages"]


def _enroll_mfa(gql_client: GraphQLTestClient, client: Client, user: User) -> tuple[str, list[str]]:
    """Logs `user` in and completes MFA enrollment. Returns (secret, recovery_codes)."""
    client.force_login(user)
    setup_result = gql_client.query(BEGIN_MFA_SETUP)
    secret = setup_result.data["beginMfaSetup"]["secret"]

    code = pyotp.TOTP(secret).now()
    confirm_result = gql_client.query(CONFIRM_MFA_SETUP, variables={"code": code})
    payload = confirm_result.data["confirmMfaSetup"]
    return secret, payload["recoveryCodes"]


def test_begin_mfa_setup_returns_secret_and_uri(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)

    result = gql_client.query(BEGIN_MFA_SETUP)

    payload = result.data["beginMfaSetup"]
    assert len(payload["secret"]) >= 16
    assert payload["provisioningUri"].startswith("otpauth://totp/")
    user.refresh_from_db()
    assert user.mfa_secret  # stored encrypted, not the raw secret
    assert user.mfa_secret != payload["secret"]
    assert user.mfa_enabled is False


def test_confirm_mfa_setup_enables_mfa_and_returns_recovery_codes(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(mfa_required=True)

    _secret, recovery_codes = _enroll_mfa(gql_client, client, user)

    assert len(recovery_codes) == 10
    assert len({*recovery_codes}) == 10  # all unique
    user.refresh_from_db()
    assert user.mfa_enabled is True
    assert user.mfa_required is False
    assert user.mfa_recovery_codes.count() == 10
    event = IamAuditEvent.objects.get(event_type=IamAuditEvent.EventType.MFA_ENABLED)
    assert event.target_user == user


def test_confirm_mfa_setup_rejects_wrong_code(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)
    gql_client.query(BEGIN_MFA_SETUP)

    result = gql_client.query(CONFIRM_MFA_SETUP, variables={"code": "000000"})

    assert result.errors is None
    assert result.data["confirmMfaSetup"]["messages"]
    user.refresh_from_db()
    assert user.mfa_enabled is False


def test_begin_mfa_setup_rejects_already_enabled(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    _enroll_mfa(gql_client, client, user)

    result = gql_client.query(BEGIN_MFA_SETUP)

    assert result.errors is None
    assert result.data["beginMfaSetup"]["messages"]


def test_login_with_mfa_enabled_requires_code(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(email="mfa-user@acentriagroup.com", username="mfauser")
    user.set_password("Str0ng-pass!")
    user.save()
    _enroll_mfa(gql_client, client, user)
    client.logout()

    result = gql_client.query(
        LOGIN, variables={"email": user.email, "password": "Str0ng-pass!"}
    )

    assert result.errors is None
    assert result.data["login"]["__typename"] == "MfaRequired"
    # Password alone must not establish a session.
    me = gql_client.query("query { me { id } }")
    assert me.data["me"] is None


def test_verify_mfa_code_completes_login(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(email="mfa-user2@acentriagroup.com", username="mfauser2")
    user.set_password("Str0ng-pass!")
    user.save()
    secret, _codes = _enroll_mfa(gql_client, client, user)
    client.logout()

    gql_client.query(LOGIN, variables={"email": user.email, "password": "Str0ng-pass!"})
    code = pyotp.TOTP(secret).now()
    result = gql_client.query(VERIFY_MFA_CODE, variables={"code": code})

    assert result.errors is None
    assert result.data["verifyMfaCode"]["__typename"] == "UserType"
    me = gql_client.query("query { me { id } }")
    assert me.data["me"]["id"] == str(user.pk)
    assert LoginAttempt.objects.filter(user=user, success=True).exists()


def test_verify_mfa_code_accepts_recovery_code_once(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(email="mfa-user3@acentriagroup.com", username="mfauser3")
    user.set_password("Str0ng-pass!")
    user.save()
    _secret, codes = _enroll_mfa(gql_client, client, user)
    client.logout()

    gql_client.query(LOGIN, variables={"email": user.email, "password": "Str0ng-pass!"})
    result = gql_client.query(VERIFY_MFA_CODE, variables={"code": codes[0]})
    assert result.data["verifyMfaCode"]["__typename"] == "UserType"

    # The same recovery code can't be reused.
    client.logout()
    gql_client.query(LOGIN, variables={"email": user.email, "password": "Str0ng-pass!"})
    replay = gql_client.query(VERIFY_MFA_CODE, variables={"code": codes[0]})
    assert replay.data["verifyMfaCode"]["__typename"] == "AuthError"


def test_verify_mfa_code_rejects_wrong_code(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(email="mfa-user4@acentriagroup.com", username="mfauser4")
    user.set_password("Str0ng-pass!")
    user.save()
    _enroll_mfa(gql_client, client, user)
    client.logout()

    gql_client.query(LOGIN, variables={"email": user.email, "password": "Str0ng-pass!"})
    result = gql_client.query(VERIFY_MFA_CODE, variables={"code": "000000"})

    assert result.errors is None
    assert result.data["verifyMfaCode"]["__typename"] == "AuthError"


def test_verify_mfa_code_locks_out_after_max_attempts(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(email="mfa-user5@acentriagroup.com", username="mfauser5")
    user.set_password("Str0ng-pass!")
    user.save()
    secret, _codes = _enroll_mfa(gql_client, client, user)
    client.logout()

    gql_client.query(LOGIN, variables={"email": user.email, "password": "Str0ng-pass!"})
    for _ in range(5):
        gql_client.query(VERIFY_MFA_CODE, variables={"code": "000000"})

    # Even the correct code is now rejected — the pending challenge was cleared.
    code = pyotp.TOTP(secret).now()
    result = gql_client.query(VERIFY_MFA_CODE, variables={"code": code})
    assert result.data["verifyMfaCode"]["__typename"] == "AuthError"
    assert "sign in again" in result.data["verifyMfaCode"]["message"]


def test_disable_mfa_requires_correct_password(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    user.set_password("Str0ng-pass!")
    user.save()
    _enroll_mfa(gql_client, client, user)
    client.force_login(user)

    wrong = gql_client.query(DISABLE_MFA, variables={"password": "wrong-password"})
    assert wrong.data["disableMfa"]["messages"]
    user.refresh_from_db()
    assert user.mfa_enabled is True

    result = gql_client.query(DISABLE_MFA, variables={"password": "Str0ng-pass!"})
    assert result.data["disableMfa"]["mfaEnabled"] is False
    user.refresh_from_db()
    assert user.mfa_enabled is False
    assert user.mfa_secret == ""
    assert user.mfa_recovery_codes.count() == 0


def test_admin_reset_mfa_requires_admin(gql_client: GraphQLTestClient, client: Client) -> None:
    actor = UserFactory()
    target = UserFactory()
    _enroll_mfa(gql_client, client, target)
    client.force_login(actor)

    result = gql_client.query(ADMIN_RESET_MFA, variables={"userId": str(target.pk)})

    assert result.data["adminResetMfa"]["messages"][0]["kind"] == "PERMISSION"
    target.refresh_from_db()
    assert target.mfa_enabled is True


def test_admin_reset_mfa_clears_enrollment(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    target = UserFactory()
    _enroll_mfa(gql_client, client, target)
    client.force_login(actor)

    result = gql_client.query(ADMIN_RESET_MFA, variables={"userId": str(target.pk)})

    assert result.data["adminResetMfa"]["mfaEnabled"] is False
    target.refresh_from_db()
    assert target.mfa_enabled is False
    assert target.mfa_secret == ""
    assert target.mfa_recovery_codes.count() == 0
    event = IamAuditEvent.objects.get(event_type=IamAuditEvent.EventType.MFA_RESET)
    assert event.target_user == target
    assert event.actor == actor


def test_set_mfa_required_requires_admin(gql_client: GraphQLTestClient, client: Client) -> None:
    actor = UserFactory()
    target = UserFactory()
    client.force_login(actor)

    result = gql_client.query(
        SET_MFA_REQUIRED, variables={"userId": str(target.pk), "required": True}
    )

    assert result.data["setMfaRequired"]["messages"][0]["kind"] == "PERMISSION"
    target.refresh_from_db()
    assert target.mfa_required is False


def test_admin_can_set_mfa_required(gql_client: GraphQLTestClient, client: Client) -> None:
    admin_role = RoleFactory(name=Role.Name.ADMIN)
    actor = UserFactory(roles=[admin_role])
    target = UserFactory()
    client.force_login(actor)

    result = gql_client.query(
        SET_MFA_REQUIRED, variables={"userId": str(target.pk), "required": True}
    )

    assert result.data["setMfaRequired"]["mfaRequired"] is True
    target.refresh_from_db()
    assert target.mfa_required is True


UPDATE_MY_PROFILE = """
  mutation($data: MyProfileInput!) {
    updateMyProfile(data: $data) {
      ... on UserType { id firstName lastName department email }
      ... on OperationInfo { messages { kind field message } }
    }
  }
"""

MY_AUDIT_EVENTS = """
  query($limit: Int!) {
    myAuditEvents(limit: $limit) { id eventType actor detail }
  }
"""

REGENERATE_RECOVERY_CODES = """
  mutation($password: String!) {
    regenerateMfaRecoveryCodes(password: $password) {
      ... on MfaRecoveryCodesType { recoveryCodes }
      ... on OperationInfo { messages { message } }
    }
  }
"""


def test_update_my_profile_requires_authentication(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query(UPDATE_MY_PROFILE, variables={"data": {"firstName": "Grace"}})

    assert result.data["updateMyProfile"]["messages"]


def test_update_my_profile_updates_own_details_and_audits(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)

    result = gql_client.query(
        UPDATE_MY_PROFILE,
        variables={
            "data": {"firstName": " Grace ", "lastName": "Hopper", "department": "Security"}
        },
    )

    assert result.errors is None
    assert result.data["updateMyProfile"]["firstName"] == "Grace"
    user.refresh_from_db()
    assert (user.first_name, user.last_name, user.department) == ("Grace", "Hopper", "Security")
    event = IamAuditEvent.objects.get(event_type=IamAuditEvent.EventType.PROFILE_UPDATED)
    assert event.actor == user
    assert event.target_user == user


def test_update_my_profile_cannot_change_access_attributes(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    """Email, username and roles decide access — they stay administrator-owned (A.5.16)."""
    role = RoleFactory(name=Role.Name.VIEWER)
    user = UserFactory(roles=[role], email="original@example.com", username="original")
    client.force_login(user)

    gql_client.query(UPDATE_MY_PROFILE, variables={"data": {"firstName": "Grace"}})

    user.refresh_from_db()
    assert user.email == "original@example.com"
    assert user.username == "original"
    assert [r.name for r in user.roles.all()] == [Role.Name.VIEWER]


def test_update_my_profile_rejected_for_sso_accounts(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(auth_provider=User.AuthProvider.ENTRA_ID, first_name="Ada")
    client.force_login(user)

    result = gql_client.query(UPDATE_MY_PROFILE, variables={"data": {"firstName": "Grace"}})

    assert result.data["updateMyProfile"]["messages"]
    user.refresh_from_db()
    assert user.first_name == "Ada"


def test_my_audit_events_is_scoped_to_the_caller(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    other = UserFactory()
    IamAuditEvent.objects.create(
        event_type=IamAuditEvent.EventType.USER_UPDATED,
        actor=other,
        target_user=user,
        detail="mine",
    )
    IamAuditEvent.objects.create(
        event_type=IamAuditEvent.EventType.USER_UPDATED,
        actor=other,
        target_user=other,
        detail="not mine",
    )
    LoginAttemptFactory(email=user.email, user=user, success=True)
    LoginAttemptFactory(email=other.email, user=other, success=False)
    client.force_login(user)

    result = gql_client.query(MY_AUDIT_EVENTS, variables={"limit": 25})

    assert result.errors is None
    details = {event["detail"] for event in result.data["myAuditEvents"]}
    assert "mine" in details
    assert "not mine" not in details
    assert {event["actor"] for event in result.data["myAuditEvents"]} <= {other.email, user.email}


def test_my_audit_events_is_empty_when_anonymous(gql_client: GraphQLTestClient) -> None:
    IamAuditEvent.objects.create(
        event_type=IamAuditEvent.EventType.USER_CREATED, detail="somebody else"
    )

    result = gql_client.query(MY_AUDIT_EVENTS, variables={"limit": 25})

    assert result.errors is None
    assert result.data["myAuditEvents"] == []


def test_regenerate_recovery_codes_replaces_the_previous_set(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(mfa_enabled=True, mfa_secret=encrypt(pyotp.random_base32()))
    user.set_password("Str0ng-pass!")
    user.save()
    MfaRecoveryCode.objects.create(user=user, code_hash=make_password("old-code"))
    client.force_login(user)

    result = gql_client.query(REGENERATE_RECOVERY_CODES, variables={"password": "Str0ng-pass!"})

    assert result.errors is None
    codes = result.data["regenerateMfaRecoveryCodes"]["recoveryCodes"]
    assert len(codes) == 10
    assert user.mfa_recovery_codes.count() == 10
    assert not any(check_password("old-code", c.code_hash) for c in user.mfa_recovery_codes.all())
    assert IamAuditEvent.objects.filter(
        event_type=IamAuditEvent.EventType.MFA_CODES_REGENERATED, actor=user
    ).exists()


def test_regenerate_recovery_codes_rejects_wrong_password(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(mfa_enabled=True, mfa_secret=encrypt(pyotp.random_base32()))
    user.set_password("Str0ng-pass!")
    user.save()
    client.force_login(user)

    result = gql_client.query(REGENERATE_RECOVERY_CODES, variables={"password": "wrong"})

    assert result.data["regenerateMfaRecoveryCodes"]["messages"]
    assert user.mfa_recovery_codes.count() == 0


def test_mfa_recovery_codes_remaining_counts_unused_codes(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory(mfa_enabled=True)
    MfaRecoveryCode.objects.create(user=user, code_hash=make_password("unused"))
    MfaRecoveryCode.objects.create(
        user=user, code_hash=make_password("used"), used_at=timezone.now()
    )
    client.force_login(user)

    result = gql_client.query("query { me { mfaRecoveryCodesRemaining } }")

    assert result.errors is None
    assert result.data["me"]["mfaRecoveryCodesRemaining"] == 1


UPDATE_MY_AVATAR = """
  mutation($imageBase64: String!) {
    updateMyAvatar(imageBase64: $imageBase64) {
      ... on UserType { id avatarUrl }
      ... on OperationInfo { messages { message } }
    }
  }
"""

REMOVE_MY_AVATAR = """
  mutation {
    removeMyAvatar {
      ... on UserType { id avatarUrl }
      ... on OperationInfo { messages { message } }
    }
  }
"""


def _png_bytes(size: tuple[int, int] = (400, 200), color: str = "red") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format="PNG")
    return buffer.getvalue()


def test_update_my_avatar_stores_a_normalised_square_jpeg(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)

    result = gql_client.query(
        UPDATE_MY_AVATAR,
        variables={"imageBase64": base64.b64encode(_png_bytes()).decode()},
    )

    assert result.errors is None
    assert result.data["updateMyAvatar"]["avatarUrl"].startswith(
        "data:image/jpeg;base64,"
    )
    avatar = UserAvatar.objects.get(user=user)
    with Image.open(io.BytesIO(bytes(avatar.image))) as stored:
        assert stored.format == "JPEG"
        assert stored.size == (AVATAR_EDGE_PX, AVATAR_EDGE_PX)
    assert IamAuditEvent.objects.filter(
        event_type=IamAuditEvent.EventType.PROFILE_UPDATED, actor=user
    ).exists()


def test_update_my_avatar_accepts_a_browser_data_url(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)
    encoded = base64.b64encode(_png_bytes()).decode()

    result = gql_client.query(
        UPDATE_MY_AVATAR, variables={"imageBase64": f"data:image/png;base64,{encoded}"}
    )

    assert result.errors is None
    assert UserAvatar.objects.filter(user=user).exists()


def test_update_my_avatar_replaces_the_previous_photo(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)

    gql_client.query(
        UPDATE_MY_AVATAR,
        variables={"imageBase64": base64.b64encode(_png_bytes(color="red")).decode()},
    )
    gql_client.query(
        UPDATE_MY_AVATAR,
        variables={"imageBase64": base64.b64encode(_png_bytes(color="blue")).decode()},
    )

    assert UserAvatar.objects.filter(user=user).count() == 1


def test_update_my_avatar_rejects_a_file_that_is_not_an_image(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)

    result = gql_client.query(
        UPDATE_MY_AVATAR,
        variables={"imageBase64": base64.b64encode(b"#!/bin/sh\nrm -rf /").decode()},
    )

    assert result.data["updateMyAvatar"]["messages"]
    assert not UserAvatar.objects.filter(user=user).exists()


def test_update_my_avatar_rejects_an_oversized_payload(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)

    result = gql_client.query(
        UPDATE_MY_AVATAR, variables={"imageBase64": "A" * (MAX_ENCODED_LENGTH + 4)}
    )

    assert result.data["updateMyAvatar"]["messages"]
    assert not UserAvatar.objects.filter(user=user).exists()


def test_update_my_avatar_requires_authentication(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query(
        UPDATE_MY_AVATAR,
        variables={"imageBase64": base64.b64encode(_png_bytes()).decode()},
    )

    assert result.data["updateMyAvatar"]["messages"]
    assert not UserAvatar.objects.exists()


def test_stored_avatar_carries_no_exif_metadata(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    """Camera photos carry GPS coordinates; re-encoding must drop them (A.8.11)."""
    user = UserFactory()
    client.force_login(user)
    source = io.BytesIO()
    exif = Image.Exif()
    exif[0x010E] = "taken at home"
    Image.new("RGB", (300, 300), "green").save(source, format="JPEG", exif=exif)

    gql_client.query(
        UPDATE_MY_AVATAR,
        variables={"imageBase64": base64.b64encode(source.getvalue()).decode()},
    )

    avatar = UserAvatar.objects.get(user=user)
    with Image.open(io.BytesIO(bytes(avatar.image))) as stored:
        assert not dict(stored.getexif())


def test_remove_my_avatar_clears_the_photo(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    user = UserFactory()
    client.force_login(user)
    gql_client.query(
        UPDATE_MY_AVATAR,
        variables={"imageBase64": base64.b64encode(_png_bytes()).decode()},
    )

    result = gql_client.query(REMOVE_MY_AVATAR)

    assert result.errors is None
    assert result.data["removeMyAvatar"]["avatarUrl"] is None
    assert not UserAvatar.objects.filter(user=user).exists()
