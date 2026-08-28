import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import Client
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from strawberry.django.test import GraphQLTestClient

from domains.iam.models import Role

from .factories import RoleFactory, UserFactory

pytestmark = pytest.mark.django_db

CREATE_USER = """
  mutation($data: UserCreateInput!) {
    createUser(data: $data) {
      ... on UserType { id email }
      ... on OperationInfo { messages { field message } }
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


def test_create_user_mutation(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {"email": "new@example.com", "username": "new", "password": "Str0ng-pass!"}
        },
    )
    assert result.errors is None
    assert result.data is not None
    assert result.data["createUser"]["email"] == "new@example.com"


def test_create_user_rejects_weak_password(gql_client: GraphQLTestClient) -> None:
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
