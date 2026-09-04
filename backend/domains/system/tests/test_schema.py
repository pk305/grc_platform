"""System settings — who may read and change them, and what enforces them."""

import datetime

import pytest
from django.core.management import call_command
from django.test import Client
from django.utils import timezone
from strawberry.django.test import GraphQLTestClient

from domains.iam.models import IamAuditEvent, LoginAttempt, Role
from domains.iam.tests.factories import LoginAttemptFactory, RoleFactory, UserFactory
from domains.system.models import SystemSetting

pytestmark = pytest.mark.django_db

PASSWORD = "Str0ng-pass!"

SETTINGS_QUERY = """
  query {
    systemSettings {
      organisationName
      allowedLoginDomain
      effectiveLoginDomain
      requireMfaForAllUsers
      passwordMinLength
      accessReviewIntervalDays
      updatedByEmail
    }
  }
"""

UPDATE = """
  mutation($data: SystemSettingInput!) {
    updateSystemSettings(data: $data) {
      ... on SystemSettingType {
        organisationName
        allowedLoginDomain
        passwordMinLength
        updatedByEmail
      }
      ... on OperationInfo {
        messages { field message }
      }
    }
  }
"""

LOGIN = """
  mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) { __typename }
  }
"""

CREATE_USER = """
  mutation($data: UserCreateInput!) {
    createUser(data: $data) {
      ... on UserType { id mfaRequired nextAccessReviewDate }
      ... on OperationInfo { messages { message } }
    }
  }
"""


@pytest.fixture
def gql_client(client: Client) -> GraphQLTestClient:
    return GraphQLTestClient(client, url="/api/v1/")


def _sign_in(client: Client, *role_names: str):
    user = UserFactory(email=f"admin-{len(role_names)}@acentriagroup.com")
    user.set_password(PASSWORD)
    user.save()
    for name in role_names:
        user.roles.add(RoleFactory(name=name))
    client.force_login(user)
    return user


def test_reading_settings_requires_the_admin_role(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query(SETTINGS_QUERY, assert_no_errors=False)

    assert result.errors
    assert not SystemSetting.objects.exists()


def test_a_viewer_cannot_read_settings(client: Client, gql_client: GraphQLTestClient) -> None:
    _sign_in(client, Role.Name.VIEWER)

    result = gql_client.query(SETTINGS_QUERY, assert_no_errors=False)

    assert result.errors


def test_an_admin_reads_the_defaults_and_the_row_appears(
    client: Client, gql_client: GraphQLTestClient
) -> None:
    _sign_in(client, Role.Name.ADMIN)

    settings_data = gql_client.query(SETTINGS_QUERY).data["systemSettings"]

    assert settings_data["passwordMinLength"] == 12
    assert settings_data["updatedByEmail"] is None
    # Blank field, so sign-in still follows the deployment's own domain.
    assert settings_data["allowedLoginDomain"] == ""
    assert settings_data["effectiveLoginDomain"] == "acentriagroup.com"
    assert SystemSetting.objects.count() == 1


def test_an_admin_updates_settings_and_the_change_is_audited(
    client: Client, gql_client: GraphQLTestClient
) -> None:
    admin = _sign_in(client, Role.Name.ADMIN)

    result = gql_client.query(
        UPDATE,
        variables={"data": {"organisationName": "  Acme Group  ", "passwordMinLength": 16}},
    )

    payload = result.data["updateSystemSettings"]
    assert payload["organisationName"] == "Acme Group"
    assert payload["passwordMinLength"] == 16
    assert payload["updatedByEmail"] == admin.email

    setting = SystemSetting.load()
    assert setting.organisation_name == "Acme Group"
    # Untouched fields keep their stored value — the input is a partial update.
    assert setting.access_review_interval_days == 90

    event = IamAuditEvent.objects.get(event_type=IamAuditEvent.EventType.SETTINGS_UPDATED)
    assert event.actor == admin
    assert "organisation name" in event.detail
    assert "password min length" in event.detail


def test_an_unchanged_submission_is_not_audited(
    client: Client, gql_client: GraphQLTestClient
) -> None:
    _sign_in(client, Role.Name.ADMIN)
    SystemSetting.load()

    gql_client.query(UPDATE, variables={"data": {"passwordMinLength": 12}})

    assert not IamAuditEvent.objects.filter(
        event_type=IamAuditEvent.EventType.SETTINGS_UPDATED
    ).exists()


def test_an_out_of_range_value_is_rejected(client: Client, gql_client: GraphQLTestClient) -> None:
    _sign_in(client, Role.Name.ADMIN)

    result = gql_client.query(UPDATE, variables={"data": {"passwordMinLength": 4}})

    payload = result.data["updateSystemSettings"]
    assert payload["messages"][0]["field"] == "passwordMinLength"
    assert SystemSetting.load().password_min_length == 12


def test_a_viewer_cannot_update_settings(client: Client, gql_client: GraphQLTestClient) -> None:
    _sign_in(client, Role.Name.VIEWER)

    result = gql_client.query(UPDATE, variables={"data": {"organisationName": "Acme"}})

    # The mutation reports the refusal in its OperationInfo branch rather than
    # as a GraphQL error, like every other role-gated mutation here.
    payload = result.data["updateSystemSettings"]
    assert payload["messages"][0]["message"] == "User does not have the required role."
    assert not SystemSetting.objects.exists()


def test_the_configured_domain_overrides_the_environment(gql_client: GraphQLTestClient) -> None:
    setting = SystemSetting.load()
    setting.allowed_login_domain = "Contoso.com"
    setting.save()
    user = UserFactory(email="grace@acentriagroup.com")
    user.set_password(PASSWORD)
    user.save()

    result = gql_client.query(LOGIN, variables={"email": user.email, "password": PASSWORD})

    assert result.data["login"]["__typename"] == "AuthError"


def test_requiring_mfa_platform_wide_flags_an_existing_account_at_sign_in(
    gql_client: GraphQLTestClient,
) -> None:
    setting = SystemSetting.load()
    setting.require_mfa_for_all_users = True
    setting.save()
    user = UserFactory(email="grace@acentriagroup.com")
    user.set_password(PASSWORD)
    user.save()
    assert not user.mfa_required

    result = gql_client.query(LOGIN, variables={"email": user.email, "password": PASSWORD})

    assert result.data["login"]["__typename"] == "UserType"
    user.refresh_from_db()
    assert user.mfa_required


def test_new_users_follow_the_configured_mfa_rule_and_review_cadence(
    client: Client, gql_client: GraphQLTestClient
) -> None:
    _sign_in(client, Role.Name.ADMIN)
    setting = SystemSetting.load()
    setting.require_mfa_for_all_users = True
    setting.access_review_interval_days = 30
    setting.save()

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "new.hire@acentriagroup.com",
                "username": "newhire",
                "password": PASSWORD,
                "roleName": Role.Name.VIEWER.value,
                "requireMfa": False,
            }
        },
    )

    created = result.data["createUser"]
    assert created["mfaRequired"] is True
    assert created["nextAccessReviewDate"] == str(
        timezone.now().date() + datetime.timedelta(days=30)
    )


def test_the_configured_minimum_length_is_enforced_on_new_passwords(
    client: Client, gql_client: GraphQLTestClient
) -> None:
    _sign_in(client, Role.Name.ADMIN)
    setting = SystemSetting.load()
    setting.password_min_length = 20
    setting.save()

    result = gql_client.query(
        CREATE_USER,
        variables={
            "data": {
                "email": "short.pass@acentriagroup.com",
                "username": "shortpass",
                "password": PASSWORD,
                "roleName": Role.Name.VIEWER.value,
            }
        },
    )

    assert "at least 20 characters" in result.data["createUser"]["messages"][0]["message"]


def test_purge_audit_log_deletes_only_what_is_past_retention() -> None:
    setting = SystemSetting.load()
    setting.audit_log_retention_days = 30
    setting.save()
    old = timezone.now() - datetime.timedelta(days=31)
    recent = LoginAttemptFactory()
    expired = LoginAttemptFactory()
    LoginAttempt.objects.filter(pk=expired.pk).update(created_at=old)

    call_command("purge_audit_log")

    assert list(LoginAttempt.objects.values_list("pk", flat=True)) == [recent.pk]


def test_purge_audit_log_dry_run_deletes_nothing() -> None:
    expired = LoginAttemptFactory()
    LoginAttempt.objects.filter(pk=expired.pk).update(
        created_at=timezone.now() - datetime.timedelta(days=400)
    )

    call_command("purge_audit_log", "--dry-run")

    assert LoginAttempt.objects.filter(pk=expired.pk).exists()
