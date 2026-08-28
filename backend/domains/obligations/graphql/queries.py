import datetime

import strawberry
import strawberry_django
from django.utils import timezone

from domains.obligations.models import Obligation

from .types import ObligationSummary


@strawberry.type
class ObligationsQuery:
    @strawberry_django.field
    def obligation_summary(self) -> ObligationSummary:
        today = timezone.localdate()
        active = Obligation.objects.filter(status=Obligation.Status.ACTIVE)
        return ObligationSummary(
            registered_count=active.count(),
            reviews_due_soon_count=active.filter(
                next_review_date__lte=today + datetime.timedelta(days=30)
            ).count(),
        )
