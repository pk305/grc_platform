import datetime

import factory

from domains.audit.models import AuditFinding, CorrectiveAction


class AuditFindingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AuditFinding

    title = factory.Sequence(lambda n: f"Finding {n}")
    status = AuditFinding.Status.OPEN


class CorrectiveActionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CorrectiveAction

    finding = factory.SubFactory(AuditFindingFactory)
    description = factory.Sequence(lambda n: f"Corrective action {n}")
    due_date = factory.LazyFunction(datetime.date.today)
    status = CorrectiveAction.Status.OPEN
