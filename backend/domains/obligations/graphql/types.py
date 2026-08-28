import strawberry


@strawberry.type
class ObligationSummary:
    registered_count: int
    reviews_due_soon_count: int
