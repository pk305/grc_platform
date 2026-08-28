"""Seed illustrative demo controls (~93 in scope, ~85% implemented). Safe to re-run."""

from django.core.management.base import BaseCommand

from domains.controls.models import Control

DOMAINS = [
    "Organizational controls",
    "People controls",
    "Physical controls",
    "Technological controls",
]


class Command(BaseCommand):
    help = "Seed demo control records for the SoA dashboard tile."

    def handle(self, *args: object, **options: object) -> None:
        created = 0
        total_in_scope = 93
        implemented = 79  # 79 / 93 ≈ 84.9%

        for n in range(1, total_in_scope + 1):
            status = (
                Control.ImplementationStatus.IMPLEMENTED
                if n <= implemented
                else Control.ImplementationStatus.PARTIAL
            )
            _, was_created = Control.objects.get_or_create(
                reference=f"A.{n}",
                defaults={
                    "title": f"{DOMAINS[n % len(DOMAINS)]} control {n}",
                    "in_scope": True,
                    "implementation_status": status,
                },
            )
            created += int(was_created)

        _, was_created = Control.objects.get_or_create(
            reference="A.99",
            defaults={
                "title": "Controls for organizations providing cloud services",
                "in_scope": False,
                "implementation_status": Control.ImplementationStatus.NOT_APPLICABLE,
            },
        )
        created += int(was_created)

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} demo controls."))
