import factory

from domains.incidents.models import Incident


class IncidentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Incident

    title = factory.Sequence(lambda n: f"Incident {n}")
    status = Incident.Status.OPEN
