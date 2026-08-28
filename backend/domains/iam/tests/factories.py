import factory

from domains.iam.models import Role, User


class RoleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Role
        django_get_or_create = ("name",)

    name = Role.Name.VIEWER


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    first_name = "Ada"
    last_name = "Lovelace"

    @factory.post_generation
    def roles(self, create, extracted, **kwargs):
        if not create or not extracted:
            return
        self.roles.add(*extracted)
