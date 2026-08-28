import datetime

import pytest
from django.test import Client
from strawberry.django.test import GraphQLTestClient

from domains.iam.models import Role
from domains.iam.tests.factories import RoleFactory, UserFactory
from domains.risk.models import Risk

from .factories import RiskFactory

pytestmark = pytest.mark.django_db

RISK_SUMMARY = """
  query {
    riskSummary {
      openCount
      overdueForReviewCount
      profile { level count }
    }
  }
"""

RISKS = """
  query {
    risks(order: { title: ASC }) {
      reference
      title
      status
      inherentLikelihood
      inherentImpact
      inherentLevel
      residualLikelihood
      residualImpact
      residualLevel
      nextReviewDate
      owner { email }
    }
  }
"""

CREATE_RISK = """
  mutation($data: RiskCreateInput!) {
    createRisk(data: $data) {
      ... on RiskType { id reference title status inherentLevel }
      ... on OperationInfo { messages { kind message } }
    }
  }
"""


def test_risk_summary_counts_non_closed_risks(gql_client: GraphQLTestClient) -> None:
    RiskFactory(status=Risk.Status.IDENTIFIED)
    RiskFactory(status=Risk.Status.CLOSED)

    result = gql_client.query(RISK_SUMMARY)

    assert result.errors is None
    assert result.data["riskSummary"]["openCount"] == 1


def test_risk_summary_overdue_uses_next_review_date(gql_client: GraphQLTestClient) -> None:
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    RiskFactory(status=Risk.Status.IDENTIFIED, next_review_date=yesterday)
    RiskFactory(status=Risk.Status.IDENTIFIED, next_review_date=tomorrow)
    RiskFactory(status=Risk.Status.IDENTIFIED, next_review_date=None)

    result = gql_client.query(RISK_SUMMARY)

    assert result.errors is None
    assert result.data["riskSummary"]["overdueForReviewCount"] == 1


def test_risk_summary_profile_prefers_residual_over_inherent(
    gql_client: GraphQLTestClient,
) -> None:
    RiskFactory(
        status=Risk.Status.IDENTIFIED,
        inherent_likelihood=5,
        inherent_impact=5,
        residual_likelihood=1,
        residual_impact=1,
    )
    RiskFactory(
        status=Risk.Status.IDENTIFIED,
        inherent_likelihood=4,
        inherent_impact=3,
        residual_likelihood=None,
        residual_impact=None,
    )

    result = gql_client.query(RISK_SUMMARY)

    assert result.errors is None
    profile = {row["level"]: row["count"] for row in result.data["riskSummary"]["profile"]}
    assert profile == {"critical": 0, "high": 1, "medium": 0, "low": 1}


def test_risks_lists_all_risks_with_owner_and_computed_levels(
    gql_client: GraphQLTestClient,
) -> None:
    owner = UserFactory(email="owner@example.com")
    RiskFactory(
        title="Beta risk",
        owner=owner,
        inherent_likelihood=4,
        inherent_impact=4,
        residual_likelihood=2,
        residual_impact=2,
    )
    RiskFactory(title="Alpha risk", owner=None, inherent_likelihood=2, inherent_impact=2)

    result = gql_client.query(RISKS)

    assert result.errors is None
    rows = {row["title"]: row for row in result.data["risks"]}
    assert rows["Beta risk"]["reference"].startswith("RSK-")
    assert rows["Beta risk"]["inherentLevel"] == "critical"
    assert rows["Beta risk"]["residualLevel"] == "low"
    assert rows["Beta risk"]["owner"] == {"email": "owner@example.com"}
    assert rows["Alpha risk"]["residualLevel"] is None
    assert rows["Alpha risk"]["owner"] is None


def test_create_risk_requires_risk_manager_or_ciso_role(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    actor = UserFactory()
    client.force_login(actor)

    result = gql_client.query(
        CREATE_RISK,
        variables={
            "data": {
                "title": "Unpatched internet-facing services",
                "inherentLikelihood": 4,
                "inherentImpact": 4,
            }
        },
    )

    assert result.errors is None
    assert result.data["createRisk"]["messages"][0]["kind"] == "PERMISSION"
    assert not Risk.objects.filter(title="Unpatched internet-facing services").exists()


def test_risk_manager_can_create_risk_with_generated_reference(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    role = RoleFactory(name=Role.Name.RISK_MANAGER)
    actor = UserFactory(roles=[role])
    client.force_login(actor)

    result = gql_client.query(
        CREATE_RISK,
        variables={
            "data": {
                "title": "Unpatched internet-facing services",
                "inherentLikelihood": 4,
                "inherentImpact": 4,
            }
        },
    )

    assert result.errors is None
    payload = result.data["createRisk"]
    assert payload["title"] == "Unpatched internet-facing services"
    assert payload["reference"].startswith(f"RSK-{datetime.date.today().year}-")
    assert payload["status"] == "identified"
    assert payload["inherentLevel"] == "critical"


def test_create_risk_generates_sequential_references(
    gql_client: GraphQLTestClient, client: Client
) -> None:
    role = RoleFactory(name=Role.Name.CISO)
    actor = UserFactory(roles=[role])
    client.force_login(actor)

    variables = {"data": {"title": "Risk one", "inherentLikelihood": 2, "inherentImpact": 2}}
    first = gql_client.query(CREATE_RISK, variables=variables)
    variables["data"]["title"] = "Risk two"
    second = gql_client.query(CREATE_RISK, variables=variables)

    assert first.errors is None
    assert second.errors is None
    first_number = int(first.data["createRisk"]["reference"].rsplit("-", 1)[-1])
    second_number = int(second.data["createRisk"]["reference"].rsplit("-", 1)[-1])
    assert second_number == first_number + 1
