import strawberry
import strawberry_django

from domains.iam.models import Role, User
from domains.iam.permissions import require_roles
from domains.risk.models import Risk

from .types import RiskCreateInput, RiskType


@strawberry.type
class RiskMutation:
    @strawberry_django.mutation(
        handle_django_errors=True,
        extensions=[require_roles(Role.Name.RISK_MANAGER, Role.Name.CISO)],
    )
    def create_risk(self, data: RiskCreateInput) -> RiskType:
        owner = User.objects.get(pk=data.owner_id) if data.owner_id else None
        risk = Risk(
            title=data.title,
            description=data.description,
            source=data.source,
            event=data.event,
            consequence=data.consequence,
            owner=owner,
            inherent_likelihood=data.inherent_likelihood,
            inherent_impact=data.inherent_impact,
            next_review_date=data.next_review_date,
        )
        risk.full_clean()
        risk.save()
        return risk  # type: ignore[return-value]
