import datetime

import pytest
from strawberry.django.test import GraphQLTestClient

from domains.audit.models import AuditFinding, CorrectiveAction

from .factories import AuditFindingFactory, CorrectiveActionFactory

pytestmark = pytest.mark.django_db

AUDIT_SUMMARY = """
  query {
    auditSummary { openFindingsCount overdueCorrectiveActionsCount }
  }
"""


def test_audit_summary_counts_open_findings(gql_client: GraphQLTestClient) -> None:
    AuditFindingFactory(status=AuditFinding.Status.OPEN)
    AuditFindingFactory(status=AuditFinding.Status.CLOSED)

    result = gql_client.query(AUDIT_SUMMARY)

    assert result.errors is None
    assert result.data["auditSummary"]["openFindingsCount"] == 1


def test_audit_summary_counts_overdue_open_corrective_actions(
    gql_client: GraphQLTestClient,
) -> None:
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    CorrectiveActionFactory(status=CorrectiveAction.Status.OPEN, due_date=yesterday)
    CorrectiveActionFactory(status=CorrectiveAction.Status.OPEN, due_date=tomorrow)
    CorrectiveActionFactory(status=CorrectiveAction.Status.CLOSED, due_date=yesterday)

    result = gql_client.query(AUDIT_SUMMARY)

    assert result.errors is None
    assert result.data["auditSummary"]["overdueCorrectiveActionsCount"] == 1
