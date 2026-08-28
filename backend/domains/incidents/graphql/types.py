import strawberry


@strawberry.type
class IncidentSummary:
    open_count: int
