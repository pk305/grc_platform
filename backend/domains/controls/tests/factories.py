import factory

from domains.controls.models import Control


class ControlFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Control

    reference = factory.Sequence(lambda n: f"A.{n}")
    title = factory.Sequence(lambda n: f"Control {n}")
    in_scope = True
    implementation_status = Control.ImplementationStatus.NOT_IMPLEMENTED
