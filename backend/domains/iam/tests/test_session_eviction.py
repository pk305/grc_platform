"""Concurrent-session eviction — ISO/IEC 27001:2022 A.8.5: only one active
session per account. Signing in from a second browser must silently log the
first one out."""

import pytest
from django.contrib.sessions.models import Session
from django.test import Client
from strawberry.django.test import GraphQLTestClient

from domains.iam.tests.factories import UserFactory

pytestmark = pytest.mark.django_db

PASSWORD = "Str0ng-pass!"

LOGIN = """
  mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) { __typename }
  }
"""

LOGOUT = "mutation { logout }"

ME = "query { me { id } }"


def _gql(client: Client) -> GraphQLTestClient:
    return GraphQLTestClient(client, url="/api/v1/")


def _make_user():
    # login() gates on ALLOWED_LOGIN_DOMAIN — the factory's default
    # @example.com email would be rejected before a session is ever created.
    user = UserFactory(email="session-test@acentriagroup.com")
    user.set_password(PASSWORD)
    user.save()
    return user


def test_a_second_sign_in_logs_the_first_browser_out() -> None:
    user = _make_user()
    browser_a, browser_b = Client(), Client()

    _gql(browser_a).query(LOGIN, variables={"email": user.email, "password": PASSWORD})
    assert _gql(browser_a).query(ME).data["me"]["id"] == str(user.pk)

    _gql(browser_b).query(LOGIN, variables={"email": user.email, "password": PASSWORD})

    assert _gql(browser_a).query(ME).data["me"] is None
    assert _gql(browser_b).query(ME).data["me"]["id"] == str(user.pk)


def test_current_session_key_tracks_the_latest_login() -> None:
    user = _make_user()
    client = Client()

    _gql(client).query(LOGIN, variables={"email": user.email, "password": PASSWORD})

    user.refresh_from_db()
    assert user.current_session_key == client.session.session_key
    assert Session.objects.filter(session_key=user.current_session_key).exists()


def test_logout_clears_the_recorded_session_key() -> None:
    user = _make_user()
    client = Client()
    gql = _gql(client)

    gql.query(LOGIN, variables={"email": user.email, "password": PASSWORD})
    gql.query(LOGOUT)

    user.refresh_from_db()
    assert user.current_session_key == ""
