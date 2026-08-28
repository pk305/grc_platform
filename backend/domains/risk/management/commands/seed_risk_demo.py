"""Seed illustrative demo risks matching the dashboard mockup's severity profile.

Safe to re-run: titles are unique per seeded row, so re-running just skips
rows that already exist (get_or_create).
"""

import datetime

from django.core.management.base import BaseCommand

from domains.iam.models import User
from domains.risk.models import Risk

# (inherent likelihood, inherent impact, count, overdue-for-review count within that bucket)
PROFILE = [
    (5, 4, 4, 2),  # -> critical (score 20)
    (3, 4, 11, 2),  # -> high (score 12)
    (3, 3, 18, 2),  # -> medium (score 9)
    (2, 2, 9, 0),  # -> low (score 4)
]

TITLES = [
    "Unpatched internet-facing servers",
    "Third-party vendor data access",
    "Single point of failure in payment processing",
    "Weak segregation of duties in finance",
    "Legacy authentication protocol in use",
    "Insufficient backup testing",
    "Shadow IT SaaS adoption",
    "Cloud storage misconfiguration",
    "Key person dependency in IT operations",
    "Unencrypted data at rest in staging",
]

NON_CLOSED_STATUSES = [
    Risk.Status.IDENTIFIED,
    Risk.Status.ASSESSED,
    Risk.Status.TREATMENT_PLANNED,
    Risk.Status.TREATED,
    Risk.Status.ACCEPTED,
]

OWNERS = [
    ("risk-owner-1@acentriagroup.com", "Grace", "Wanjiru"),
    ("risk-owner-2@acentriagroup.com", "David", "Kimani"),
    ("risk-owner-3@acentriagroup.com", "Amina", "Otieno"),
]


class Command(BaseCommand):
    help = "Seed demo risk records roughly matching the dashboard mockup's severity profile."

    def handle(self, *args: object, **options: object) -> None:
        today = datetime.date.today()
        owners = []
        for email, first_name, last_name in OWNERS:
            owner, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0],
                    "first_name": first_name,
                    "last_name": last_name,
                },
            )
            owners.append(owner)

        created = 0
        i = 0
        for likelihood, impact, count, overdue_count in PROFILE:
            for n in range(count):
                title = f"{TITLES[i % len(TITLES)]} (L{likelihood}xI{impact} #{n + 1})"
                owner = owners[i % len(owners)]
                status = NON_CLOSED_STATUSES[i % len(NON_CLOSED_STATUSES)]
                i += 1
                _, was_created = Risk.objects.get_or_create(
                    title=title,
                    defaults={
                        "description": f"{title}: identified during routine risk assessment.",
                        "source": "Routine risk assessment",
                        "event": title,
                        "consequence": "Service disruption, data exposure, or regulatory impact.",
                        "status": status,
                        "owner": owner,
                        "inherent_likelihood": likelihood,
                        "inherent_impact": impact,
                        "next_review_date": (
                            today - datetime.timedelta(days=14)
                            if n < overdue_count
                            else today + datetime.timedelta(days=60)
                        ),
                    },
                )
                created += int(was_created)

        # A couple of closed risks for filter/status realism — excluded from
        # the dashboard's open-risk counts and overdue calculation.
        for n in range(1, 3):
            _, was_created = Risk.objects.get_or_create(
                title=f"Resolved legacy risk #{n}",
                defaults={
                    "description": "Historical risk, remediated and closed.",
                    "status": Risk.Status.CLOSED,
                    "owner": owners[n % len(owners)],
                    "inherent_likelihood": 3,
                    "inherent_impact": 3,
                    "residual_likelihood": 1,
                    "residual_impact": 1,
                    "next_review_date": today + datetime.timedelta(days=180),
                },
            )
            created += int(was_created)

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} demo risks."))
