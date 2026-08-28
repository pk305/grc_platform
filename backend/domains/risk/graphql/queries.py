import strawberry
import strawberry_django
from django.utils import timezone

from domains.risk.models import Risk
from domains.risk.scoring import level_for_score

from .types import RiskLevelCount, RiskOrder, RiskSummary, RiskType

LEVEL_ORDER = ["critical", "high", "medium", "low"]


@strawberry.type
class RiskQuery:
    risks: list[RiskType] = strawberry_django.field(order=RiskOrder)

    @strawberry_django.field
    def risk_summary(self) -> RiskSummary:
        today = timezone.localdate()
        open_risks = Risk.objects.exclude(status=Risk.Status.CLOSED)

        counts: dict[str, int] = {}
        for il, ii, rl, ri in open_risks.values_list(
            "inherent_likelihood", "inherent_impact", "residual_likelihood", "residual_impact"
        ):
            likelihood, impact = (rl, ri) if rl and ri else (il, ii)
            level = level_for_score(likelihood, impact)
            counts[level] = counts.get(level, 0) + 1

        return RiskSummary(
            open_count=open_risks.count(),
            overdue_for_review_count=open_risks.filter(next_review_date__lt=today).count(),
            profile=[
                RiskLevelCount(level=level, count=counts.get(level, 0)) for level in LEVEL_ORDER
            ],
        )
