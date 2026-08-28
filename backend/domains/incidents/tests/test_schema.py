import pytest
from strawberry.django.test import GraphQLTestClient

from domains.incidents.models import Incident

from .factories import IncidentFactory

pytestmark = pytest.mark.django_db

INCIDENT_SUMMARY = """
  query { incidentSummary { openCount } }
"""


def test_incident_summary_counts_only_open_incidents(gql_client: GraphQLTestClient) -> None:
    IncidentFactory(status=Incident.Status.OPEN)
    IncidentFactory(status=Incident.Status.OPEN)
    IncidentFactory(status=Incident.Status.CLOSED)

    result = gql_client.query(INCIDENT_SUMMARY)

    assert result.errors is None
    assert result.data["incidentSummary"]["openCount"] == 2
