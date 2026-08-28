import strawberry
import strawberry_django

from domains.controls.models import Control

from .types import SoaSummary


@strawberry.type
class ControlsQuery:
    @strawberry_django.field
    def soa_summary(self) -> SoaSummary:
        in_scope = Control.objects.filter(in_scope=True)
        total = in_scope.count()
        implemented = in_scope.filter(
            implementation_status=Control.ImplementationStatus.IMPLEMENTED
        ).count()
        percentage = round((implemented / total) * 100, 1) if total else 0.0
        return SoaSummary(controls_in_scope=total, implemented_percentage=percentage)
