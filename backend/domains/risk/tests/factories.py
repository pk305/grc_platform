import factory

from domains.risk.models import Risk


class RiskFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Risk

    title = factory.Sequence(lambda n: f"Risk {n}")
    status = Risk.Status.IDENTIFIED
    inherent_likelihood = 3
    inherent_impact = 3
    residual_likelihood = None
    residual_impact = None
    next_review_date = None
