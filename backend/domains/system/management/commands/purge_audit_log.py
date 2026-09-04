"""Enforce the configured audit-log retention period (ISO/IEC 27001:2022 A.8.15)."""

from typing import Any

from django.core.management.base import BaseCommand
from django.utils import timezone

from domains.iam.models import IamAuditEvent, LoginAttempt
from domains.system.service import audit_log_cutoff


class Command(BaseCommand):
    help = "Delete IAM audit events and sign-in attempts past the configured retention period."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be deleted without deleting it.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        cutoff = audit_log_cutoff(timezone.now())
        events = IamAuditEvent.objects.filter(created_at__lt=cutoff)
        attempts = LoginAttempt.objects.filter(created_at__lt=cutoff)
        event_count, attempt_count = events.count(), attempts.count()

        if options["dry_run"]:
            self.stdout.write(
                f"Would delete {event_count} audit event(s) and "
                f"{attempt_count} sign-in attempt(s) older than {cutoff:%Y-%m-%d %H:%M} UTC."
            )
            return

        events.delete()
        attempts.delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {event_count} audit event(s) and "
                f"{attempt_count} sign-in attempt(s) older than {cutoff:%Y-%m-%d %H:%M} UTC."
            )
        )
