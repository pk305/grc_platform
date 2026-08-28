import pytest
from strawberry.django.test import GraphQLTestClient

from domains.controls.models import Control

from .factories import ControlFactory

pytestmark = pytest.mark.django_db

SOA_SUMMARY = """
  query {
    soaSummary { controlsInScope implementedPercentage }
  }
"""


def test_soa_summary_percentage_over_in_scope_controls(
    gql_client: GraphQLTestClient,
) -> None:
    ControlFactory(implementation_status=Control.ImplementationStatus.IMPLEMENTED)
    ControlFactory(implementation_status=Control.ImplementationStatus.IMPLEMENTED)
    ControlFactory(implementation_status=Control.ImplementationStatus.NOT_IMPLEMENTED)
    ControlFactory(in_scope=False, implementation_status=Control.ImplementationStatus.IMPLEMENTED)

    result = gql_client.query(SOA_SUMMARY)

    assert result.errors is None
    assert result.data["soaSummary"]["controlsInScope"] == 3
    assert result.data["soaSummary"]["implementedPercentage"] == pytest.approx(66.7)


def test_soa_summary_handles_no_controls(gql_client: GraphQLTestClient) -> None:
    result = gql_client.query(SOA_SUMMARY)

    assert result.errors is None
    assert result.data["soaSummary"]["controlsInScope"] == 0
    assert result.data["soaSummary"]["implementedPercentage"] == 0.0
