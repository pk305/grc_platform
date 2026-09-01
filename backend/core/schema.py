"""Root GraphQL schema. Each app contributes a Query/Mutation mixin."""

import strawberry
from strawberry_django.optimizer import DjangoOptimizerExtension

from core.graphql.search import SearchQuery
from domains.audit.graphql.queries import AuditQuery
from domains.chat.graphql.mutations import ChatMutation
from domains.chat.graphql.queries import ChatQuery
from domains.controls.graphql.queries import ControlsQuery
from domains.iam.graphql.mutations import IamMutation
from domains.iam.graphql.queries import IamQuery
from domains.incidents.graphql.queries import IncidentsQuery
from domains.notifications.graphql.mutations import NotificationsMutation
from domains.notifications.graphql.queries import NotificationsQuery
from domains.obligations.graphql.queries import ObligationsQuery
from domains.risk.graphql.mutations import RiskMutation
from domains.risk.graphql.queries import RiskQuery


@strawberry.type
class Query(
    IamQuery,
    RiskQuery,
    ControlsQuery,
    AuditQuery,
    IncidentsQuery,
    ObligationsQuery,
    NotificationsQuery,
    ChatQuery,
    SearchQuery,
):
    pass


@strawberry.type
class Mutation(IamMutation, RiskMutation, NotificationsMutation, ChatMutation):
    pass


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    extensions=[DjangoOptimizerExtension],  # prevents N+1 by auto select/prefetch_related
)
