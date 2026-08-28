import factory

from domains.obligations.models import Obligation


class ObligationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Obligation

    title = factory.Sequence(lambda n: f"Obligation {n}")
    status = Obligation.Status.ACTIVE
    next_review_date = None
