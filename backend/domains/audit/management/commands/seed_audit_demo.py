"""Seed illustrative demo audit findings and corrective actions. Safe to re-run."""

import datetime

from django.core.management.base import BaseCommand

from domains.audit.models import AuditFinding, CorrectiveAction

FINDINGS = [
    "Access review not performed for terminated contractor",
    "Change management approval missing for production deploy",
    "Encryption key rotation overdue",
    "Vendor risk assessment not on file",
    "Incident response plan not tested this cycle",
    "Privileged account without MFA",
    "Data retention policy not enforced",
    "Asset inventory out of date",
    "Segregation of duties gap in change approval",
]


class Command(BaseCommand):
    help = "Seed demo audit findings (9 open) with 2 overdue corrective actions."

    def handle(self, *args: object, **options: object) -> None:
        today = datetime.date.today()
        created_findings = 0
        created_actions = 0

        for i, title in enumerate(FINDINGS):
            finding, was_created = AuditFinding.objects.get_or_create(
                title=title, defaults={"status": AuditFinding.Status.OPEN}
            )
            created_findings += int(was_created)

            due_date = (
                today - datetime.timedelta(days=10)
                if i < 2
                else today + datetime.timedelta(days=30)
            )
            _, action_created = CorrectiveAction.objects.get_or_create(
                finding=finding,
                description=f"Remediate: {title}",
                defaults={"due_date": due_date, "status": CorrectiveAction.Status.OPEN},
            )
            created_actions += int(action_created)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_findings} findings and {created_actions} corrective actions."
            )
        )
