.PHONY: schema schema-check lint typecheck test check dev migrate seed

schema:
	uv run python manage.py export_schema core.schema:schema --path schema.graphql

schema-check:
	@uv run python manage.py export_schema core.schema:schema | diff - schema.graphql \
		|| (echo "schema.graphql is stale — run 'make schema'" && exit 1)

lint:
	uv run ruff check . && uv run ruff format --check .

typecheck:
	uv run mypy .

test:
	uv run pytest

check: lint typecheck test schema-check

migrate:
	uv run python manage.py migrate

seed:
	uv run python manage.py seed_admin
	uv run python manage.py seed_iam_demo
	uv run python manage.py seed_risk_demo
	uv run python manage.py seed_controls_demo
	uv run python manage.py seed_audit_demo
	uv run python manage.py seed_incidents_demo
	uv run python manage.py seed_obligations_demo

PORT ?= 8000

dev:
	@pid=$$(lsof -ti tcp:$(PORT)); \
	if [ -n "$$pid" ]; then \
		echo "Killing process(es) $$pid on port $(PORT)"; \
		kill -9 $$pid; \
	fi
	uv run python manage.py runserver $(PORT)
