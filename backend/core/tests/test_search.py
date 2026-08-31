"""Quick-search resolver — matching, and who is allowed to see what."""

import pytest
from django.test import Client
from strawberry.django.test import GraphQLTestClient

from domains.iam.models import Role
from domains.iam.tests.factories import RoleFactory, UserFactory
from domains.risk.tests.factories import RiskFactory

pytestmark = pytest.mark.django_db

GLOBAL_SEARCH = """
  query($query: String!, $limit: Int) {
    globalSearch(query: $query, limit: $limit) {
      id
      kind
      label
      sublabel
      url
    }
  }
"""


@pytest.fixture
def gql_client(client: Client) -> GraphQLTestClient:
    return GraphQLTestClient(client, url="/api/v1/")


def _sign_in(client: Client, *role_names: str):
    user = UserFactory()
    for name in role_names:
        user.roles.add(RoleFactory(name=name))
    client.force_login(user)
    return user


def test_returns_nothing_to_anonymous_callers(gql_client: GraphQLTestClient) -> None:
    RiskFactory(title="Ransomware outage")

    result = gql_client.query(GLOBAL_SEARCH, variables={"query": "ransomware"})

    assert result.errors is None
    assert result.data["globalSearch"] == []


def test_matches_risks_on_title_and_reference(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    risk = RiskFactory(title="Ransomware outage")
    _sign_in(client)

    by_title = gql_client.query(GLOBAL_SEARCH, variables={"query": "ransom"})
    by_reference = gql_client.query(GLOBAL_SEARCH, variables={"query": risk.reference})

    assert [r["label"] for r in by_title.data["globalSearch"]] == ["Ransomware outage"]
    assert [r["label"] for r in by_reference.data["globalSearch"]] == ["Ransomware outage"]


def test_risk_result_links_to_the_filtered_register(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    risk = RiskFactory(title="Ransomware outage")
    _sign_in(client)

    result = gql_client.query(GLOBAL_SEARCH, variables={"query": "ransom"})

    hit = result.data["globalSearch"][0]
    assert hit["kind"] == "risk"
    assert hit["url"] == f"/risk-register?q={risk.reference}"
    assert risk.reference in hit["sublabel"]


def test_people_are_hidden_from_non_administrators(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    UserFactory(email="hidden@acentriagroup.com", first_name="Hidden")
    _sign_in(client, Role.Name.VIEWER)

    result = gql_client.query(GLOBAL_SEARCH, variables={"query": "hidden"})

    assert result.data["globalSearch"] == []


def test_administrators_can_find_people(gql_client: GraphQLTestClient, client: Client) -> None:
    UserFactory(email="dana.scully@acentriagroup.com", first_name="Dana", last_name="Scully")
    _sign_in(client, Role.Name.ADMIN)

    result = gql_client.query(GLOBAL_SEARCH, variables={"query": "scully"})

    hit = result.data["globalSearch"][0]
    assert hit["kind"] == "user"
    assert hit["label"] == "Dana Scully"
    assert hit["url"] == "/iam/users?q=dana.scully@acentriagroup.com"


def test_short_terms_match_nothing(gql_client: GraphQLTestClient, client: Client) -> None:
    RiskFactory(title="Ransomware outage")
    _sign_in(client)

    result = gql_client.query(GLOBAL_SEARCH, variables={"query": "r"})

    assert result.data["globalSearch"] == []


def test_limit_is_applied_per_kind(gql_client: GraphQLTestClient, client: Client) -> None:
    for index in range(4):
        RiskFactory(title=f"Ransomware outage {index}")
        UserFactory(email=f"ransom{index}@acentriagroup.com")
    _sign_in(client, Role.Name.ADMIN)

    result = gql_client.query(GLOBAL_SEARCH, variables={"query": "ransom", "limit": 2})

    kinds = [r["kind"] for r in result.data["globalSearch"]]
    assert kinds.count("risk") == 2
    assert kinds.count("user") == 2
