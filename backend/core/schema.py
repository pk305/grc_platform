"""Root GraphQL schema. Each app contributes a Query/Mutation mixin."""

import strawberry
from strawberry_django.optimizer import DjangoOptimizerExtension

from core.graphql.search import SearchQuery
from domains.audit.graphql.queries import AuditQuery
from domains.chat.graphql.mutations import ChatMutation
from domains.chat.graphql.queries import ChatQuery
from domains.chat.graphql.subscriptions import ChatSubscription
from domains.controls.graphql.queries import ControlsQuery
from domains.iam.graphql.mutations import IamMutation
from domains.iam.graphql.queries import IamQuery
from domains.iam.graphql.subscriptions import IamSubscription
from domains.incidents.graphql.queries import IncidentsQuery
from domains.notifications.graphql.mutations import NotificationsMutation
from domains.notifications.graphql.queries import NotificationsQuery
from domains.obligations.graphql.queries import ObligationsQuery
from domains.risk.graphql.mutations import RiskMutation
from domains.risk.graphql.queries import RiskQuery
from domains.system.graphql.mutations import SystemMutation
from domains.system.graphql.queries import SystemQuery


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
    SystemQuery,
    SearchQuery,
):
    pass


@strawberry.type
class Mutation(IamMutation, RiskMutation, NotificationsMutation, ChatMutation, SystemMutation):
    pass


@strawberry.type
class Subscription(ChatSubscription, IamSubscription):
    pass


schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
    extensions=[DjangoOptimizerExtension],  # prevents N+1 by auto select/prefetch_related
)
