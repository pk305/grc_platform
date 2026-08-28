"""Root GraphQL schema. Each app contributes a Query/Mutation mixin."""

import strawberry
from strawberry_django.optimizer import DjangoOptimizerExtension

from domains.iam.graphql.mutations import IamMutation
from domains.iam.graphql.queries import IamQuery


@strawberry.type
class Query(IamQuery):
    pass


@strawberry.type
class Mutation(IamMutation):
    pass


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    extensions=[DjangoOptimizerExtension],  # prevents N+1 by auto select/prefetch_related
)
