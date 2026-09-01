# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A GRC (Governance, Risk, Compliance) platform: a Django + Strawberry GraphQL backend (`backend/`) and a Next.js App Router frontend (`frontend/`, built on the Phoenix admin theme). Domains covered: IAM, risk register, controls, audit, incidents, obligations, notifications, and an internal chat with realtime messaging and Teams-call integration.

## Commands

### Backend (`backend/`, uses `uv`)

```
make dev             # runserver on :8000, killing whatever already holds the port
make migrate
make seed            # seed_admin + seed_iam_demo + seed_risk_demo + seed_controls_demo + seed_audit_demo + seed_incidents_demo + seed_obligations_demo
make test            # uv run pytest
make lint            # ruff check + ruff format --check
make typecheck       # uv run mypy .
make check           # lint + typecheck + test + schema-check
make schema          # regenerate schema.graphql from the Strawberry schema
make schema-check    # fails if schema.graphql is stale (also part of `make check`)
```

Run a single test: `uv run pytest domains/risk/tests/test_schema.py::TestName::test_thing`. Tests use `pytest-django` with `--reuse-db`; DB and cache/channel layers are swapped for in-memory equivalents in `core/settings/test.py` (no Redis needed for tests).

**After changing any `strawberry`/`strawberry_django` type, query, or mutation, run `make schema`** — `schema.graphql` is a committed artifact that the frontend's codegen reads directly, and `make schema-check` / `make check` will fail CI if it drifts.

### Frontend (`frontend/`, uses `pnpm`)

```
pnpm dev             # predev kills whatever holds :3000 and runs codegen, then `next dev`
pnpm build
pnpm lint            # next lint
pnpm codegen         # graphql-codegen (regenerate typed hooks from *.graphql + backend/schema.graphql)
pnpm codegen:watch
```

No frontend test runner is configured. After editing a `src/features/**/queries.graphql` file, or after the backend schema changes, run `pnpm codegen` (or restart `pnpm dev`, which does it automatically via `predev`).

## Architecture

### Backend: domain-per-app under `backend/domains/`

Each domain (`iam`, `risk`, `controls`, `audit`, `incidents`, `obligations`, `notifications`, `chat`) is a Django app with the same internal shape:

```
domains/<name>/
  models.py            # Django ORM models — the source of truth for most reads
  graphql/
    types.py            # strawberry_django types (often auto-derived from models)
    queries.py           mutations.py           subscriptions.py (chat only)
  service.py, repository.py, schemas.py   # scaffolded per-domain but only filled in
                                            # where real business logic exists (chat is
                                            # the fullest example, ~340 lines in service.py);
                                            # simpler domains resolve straight off the ORM
                                            # inside graphql/queries.py — don't assume
                                            # service.py has logic just because it exists
  admin.py, apps.py, migrations/, tests/ (pytest + factory_boy factories)
```

`core/schema.py` is the composition root: it imports each domain's `Query`/`Mutation`/`Subscription` mixin and combines them into the single `strawberry.Schema` served at `/api/v1/`. When adding a new domain or a new top-level field, wire it in there.

`DjangoOptimizerExtension` (in `core/schema.py`) auto-generates `select_related`/`prefetch_related` for resolved fields — prefer plain `strawberry_django.field()` over hand-rolled resolvers where possible so this keeps working.

### Auth & permissions

- Session-cookie auth (not JWT/token-based). The GraphQL HTTP endpoint is `csrf_exempt` because there's no token to attach on the first request; safety instead comes from JSON-only content type (blocks classic form CSRF) + `CORS_ALLOWED_ORIGINS`. See the comment in `core/urls.py` before changing this.
- Sign-in is restricted server-side to `ALLOWED_LOGIN_DOMAIN` (plus `ALLOWED_LOGIN_EMAILS` exceptions) — enforced in the login mutation, not just the frontend.
- MFA (TOTP via `pyotp`) secrets are encrypted at rest with `MFA_ENCRYPTION_KEY` (Fernet); see `domains/iam/crypto.py`.
- Field-level role gating uses `domains/iam/permissions.py`'s `require_roles(...)` Strawberry field extension — used to enforce segregation of duties (e.g. disjoint roles for creating vs. approving the same record type).

### Realtime chat

- `core/asgi.py` mounts two separate protocol routes: plain HTTP GraphQL at `/api/v1/` and a **separate** WebSocket GraphQL endpoint at `/ws/graphql` (`domains/chat/graphql/consumers.py`), both backed by the same `strawberry` schema. WS auth reuses the same session cookie via `AuthMiddlewareStack`.
- Cross-worker pub/sub (new messages, rail updates, presence) goes through Django Channels + Redis (`CHANNEL_LAYERS`, see the tuning comment in `core/settings/base.py` about `socket_timeout` vs. `channels_redis`'s hardcoded 5s poll). A separate `chat_presence` cache alias tracks per-user online connection counts.
- Calling integrates Microsoft Graph (`domains/chat/calls.py`) to create Teams meetings; disabled with a clear error until `MS_GRAPH_TENANT_ID`/`MS_GRAPH_CLIENT_ID`/`MS_GRAPH_CLIENT_SECRET` are all set.
- In tests and local dev without Redis running, `core/settings/test.py` swaps in `InMemoryChannelLayer` and a locmem `chat_presence` cache.

### Frontend

- Route groups: `src/app/(app)/*` is the authenticated dashboard shell, `src/app/(auth)/*` is sign-in/sign-up/lock-screen/forgot-password.
- `src/lib/apollo/client.ts` splits traffic by operation kind: subscriptions go over `graphql-ws` to the `/ws/graphql` route (derived from `NEXT_PUBLIC_GRAPHQL_URL`'s origin, not its path — the WS endpoint isn't at the same path as the HTTP one), everything else goes over `HttpLink` with `credentials: 'include'` for the session cookie.
- GraphQL operations live per-feature at `src/features/<name>/queries.graphql`; codegen (`codegen.ts`) generates typed hooks next to each file under `__generated__/`, plus shared base types in `src/gql/graphql-types.ts`. Generated files are gitignored from lint but are real build inputs — regenerate rather than hand-edit them.
- `backend/pyproject.toml`'s `[tool.ariadne-codegen]` section also points `queries_path` at `frontend/src/features` — the backend and frontend codegen configs both read/write across the `backend/schema.graphql` boundary, so keep that file in sync (`make schema`) whenever GraphQL types change.
- Styling is the Phoenix Bootstrap/SCSS admin theme (`src/styles/theme/`) plus Radix UI Themes components; Prettier config uses single quotes and no trailing commas.
