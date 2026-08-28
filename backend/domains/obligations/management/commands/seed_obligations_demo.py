"""Seed illustrative demo obligations (57 registered, 5 due for review within 30 days)."""

import datetime

from django.core.management.base import BaseCommand

from domains.obligations.models import Obligation

TITLES = [
    "GDPR Article 30 records of processing",
    "PCI DSS quarterly scan requirement",
    "State breach notification law",
    "Client data processing agreement",
    "Export control screening requirement",
    "Employment law compliance review",
    "Environmental reporting requirement",
    "Industry code of conduct",
]


class Command(BaseCommand):
    help = "Seed demo obligation records for the compliance dashboard tile."

    def handle(self, *args: object, **options: object) -> None:
        today = datetime.date.today()
        total = 57
        due_soon = 5
        created = 0

        for n in range(1, total + 1):
            review_date = (
                today + datetime.timedelta(days=14)
                if n <= due_soon
                else today + datetime.timedelta(days=180)
            )
            _, was_created = Obligation.objects.get_or_create(
                title=f"{TITLES[n % len(TITLES)]} #{n}",
                defaults={"status": Obligation.Status.ACTIVE, "next_review_date": review_date},
            )
            created += int(was_created)

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} demo obligations."))
