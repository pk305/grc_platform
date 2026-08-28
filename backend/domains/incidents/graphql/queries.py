import strawberry
import strawberry_django

from domains.incidents.models import Incident

from .types import IncidentSummary


@strawberry.type
class IncidentsQuery:
    @strawberry_django.field
    def incident_summary(self) -> IncidentSummary:
        return IncidentSummary(
            open_count=Incident.objects.filter(status=Incident.Status.OPEN).count()
        )
