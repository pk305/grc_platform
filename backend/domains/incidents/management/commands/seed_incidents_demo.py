"""Seed illustrative demo incidents. Safe to re-run."""

from django.core.management.base import BaseCommand

from domains.incidents.models import Incident

TITLES = [
    "Phishing email reported by finance team",
    "Brief outage on customer portal",
    "Misdirected email containing PII",
]


class Command(BaseCommand):
    help = "Seed demo open incident records for the dashboard tile."

    def handle(self, *args: object, **options: object) -> None:
        created = 0
        for title in TITLES:
            _, was_created = Incident.objects.get_or_create(
                title=title, defaults={"status": Incident.Status.OPEN}
            )
            created += int(was_created)

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} demo incidents."))
