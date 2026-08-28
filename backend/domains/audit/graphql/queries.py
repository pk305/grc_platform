import strawberry
import strawberry_django
from django.utils import timezone

from domains.audit.models import AuditFinding, CorrectiveAction

from .types import AuditSummary


@strawberry.type
class AuditQuery:
    @strawberry_django.field
    def audit_summary(self) -> AuditSummary:
        today = timezone.localdate()
        return AuditSummary(
            open_findings_count=AuditFinding.objects.filter(
                status=AuditFinding.Status.OPEN
            ).count(),
            overdue_corrective_actions_count=CorrectiveAction.objects.filter(
                status=CorrectiveAction.Status.OPEN, due_date__lt=today
            ).count(),
        )
