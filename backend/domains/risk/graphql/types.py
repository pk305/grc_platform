import datetime

import strawberry
import strawberry_django
from strawberry import auto

from domains.iam.graphql.types import UserType
from domains.risk.models import Risk
from domains.risk.scoring import level_for_score


@strawberry_django.type(
    Risk,
    fields=[
        "id",
        "reference",
        "title",
        "description",
        "source",
        "event",
        "consequence",
        "status",
        "inherent_likelihood",
        "inherent_impact",
        "residual_likelihood",
        "residual_impact",
        "next_review_date",
    ],
)
class RiskType:
    owner: UserType | None

    @strawberry_django.field
    def inherent_level(self: Risk) -> str:
        return level_for_score(self.inherent_likelihood, self.inherent_impact)

    @strawberry_django.field
    def residual_level(self: Risk) -> str | None:
        if not (self.residual_likelihood and self.residual_impact):
            return None
        return level_for_score(self.residual_likelihood, self.residual_impact)


@strawberry_django.order_type(Risk)
class RiskOrder:
    reference: auto
    title: auto
    status: auto
    next_review_date: auto


@strawberry.input
class RiskCreateInput:
    title: str
    inherent_likelihood: int
    inherent_impact: int
    description: str = ""
    source: str = ""
    event: str = ""
    consequence: str = ""
    owner_id: strawberry.ID | None = None
    next_review_date: datetime.date | None = None


@strawberry.type
class RiskLevelCount:
    level: str
    count: int


@strawberry.type
class RiskSummary:
    open_count: int
    overdue_for_review_count: int
    profile: list[RiskLevelCount]
