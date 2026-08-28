import datetime

import pytest
from strawberry.django.test import GraphQLTestClient

from domains.obligations.models import Obligation

from .factories import ObligationFactory

pytestmark = pytest.mark.django_db

OBLIGATION_SUMMARY = """
  query { obligationSummary { registeredCount reviewsDueSoonCount } }
"""


def test_obligation_summary_counts_only_active_obligations(
    gql_client: GraphQLTestClient,
) -> None:
    ObligationFactory(status=Obligation.Status.ACTIVE)
    ObligationFactory(status=Obligation.Status.RETIRED)

    result = gql_client.query(OBLIGATION_SUMMARY)

    assert result.errors is None
    assert result.data["obligationSummary"]["registeredCount"] == 1


def test_obligation_summary_reviews_due_within_30_days(
    gql_client: GraphQLTestClient,
) -> None:
    soon = datetime.date.today() + datetime.timedelta(days=10)
    far = datetime.date.today() + datetime.timedelta(days=90)
    ObligationFactory(status=Obligation.Status.ACTIVE, next_review_date=soon)
    ObligationFactory(status=Obligation.Status.ACTIVE, next_review_date=far)
    ObligationFactory(status=Obligation.Status.ACTIVE, next_review_date=None)

    result = gql_client.query(OBLIGATION_SUMMARY)

    assert result.errors is None
    assert result.data["obligationSummary"]["reviewsDueSoonCount"] == 1
