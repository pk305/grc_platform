import strawberry


@strawberry.type
class SoaSummary:
    controls_in_scope: int
    implemented_percentage: float
