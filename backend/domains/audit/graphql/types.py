import strawberry


@strawberry.type
class AuditSummary:
    open_findings_count: int
    overdue_corrective_actions_count: int
