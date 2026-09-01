"""Cross-domain quick search backing the top navbar's search box.

Lives in `core` rather than a domain because it deliberately spans them: the
navbar asks one question ("what matches what I typed?") and gets back records
from wherever they live. Each domain still owns how its own rows are matched
and where a result points.
"""

import strawberry
import strawberry_django
from django.db.models import Q
from strawberry.types import Info

from domains.iam.models import Role, User
from domains.risk.models import Risk

DEFAULT_SEARCH_LIMIT = 5
MAX_SEARCH_LIMIT = 20

MIN_SEARCH_TERM_LENGTH = 2


@strawberry.type
class SearchResult:
    """One quick-search hit, already shaped for display and navigation.

    Flattened rather than a union of record types: the navbar renders every
    hit the same way, and a flat row keeps the client from needing a fragment
    per searchable model as more of them become searchable.
    """

    id: str
    kind: str
    label: str
    sublabel: str
    url: str


def _risk_result(risk: Risk) -> SearchResult:
    return SearchResult(
        id=f"risk-{risk.pk}",
        kind="risk",
        label=risk.title,
        sublabel=f"{risk.reference} · {risk.get_status_display()}",
        url=f"/risk-register?q={risk.reference}",
    )


def _user_result(user: User) -> SearchResult:
    full_name = f"{user.first_name} {user.last_name}".strip()
    return SearchResult(
        id=f"user-{user.pk}",
        kind="user",
        label=full_name or user.email,
        sublabel=user.email,
        url=f"/iam/users?q={user.email}",
    )


@strawberry.type
class SearchQuery:
    @strawberry_django.field
    def global_search(
        self, info: Info, query: str, limit: int = DEFAULT_SEARCH_LIMIT
    ) -> list[SearchResult]:
        """Records matching `query`, for the navbar's quick search.

        Returns nothing to anonymous callers, and includes people only for
        those who may already administer them (A.5.15) — quick search must not
        become a way around the access rules guarding the pages it links to.

        `limit` caps each kind of record independently, so one noisy table
        can't crowd the others out of a short result list.
        """
        term = query.strip()
        if len(term) < MIN_SEARCH_TERM_LENGTH:
            return []

        user = info.context.request.user
        if not user.is_authenticated:
            return []

        limit = max(1, min(limit, MAX_SEARCH_LIMIT))

        results = [
            _risk_result(risk)
            for risk in Risk.objects.filter(
                Q(reference__icontains=term) | Q(title__icontains=term)
            ).order_by("reference")[:limit]
        ]

        if user.is_superuser or user.roles.filter(name=Role.Name.ADMIN).exists():
            results += [
                _user_result(match)
                for match in User.objects.filter(
                    Q(email__icontains=term)
                    | Q(username__icontains=term)
                    | Q(first_name__icontains=term)
                    | Q(last_name__icontains=term)
                ).order_by("last_name", "email")[:limit]
            ]

        return results
