"""Seed illustrative demo users and sign-in activity. Safe to re-run.

Distinct from `seed_admin`, which bootstraps the real superuser account.
"""

import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from domains.iam.models import LoginAttempt, User

ACTIVE_SSO_COUNT = 28
DEACTIVATED_COUNT = 3
SUCCESSFUL_SIGN_INS_24H = 61
FAILED_SIGN_INS_24H = 14


class Command(BaseCommand):
    help = "Seed demo users and recent sign-in attempts for the dashboard access panel."

    def handle(self, *args: object, **options: object) -> None:
        created_users = 0

        for n in range(1, ACTIVE_SSO_COUNT + 1):
            email = f"demo-user-{n}@acentriagroup.com"
            _, was_created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": f"demo-user-{n}",
                    "is_active": True,
                    "auth_provider": User.AuthProvider.ENTRA_ID,
                },
            )
            created_users += int(was_created)

        for n in range(1, DEACTIVATED_COUNT + 1):
            email = f"demo-former-user-{n}@acentriagroup.com"
            _, was_created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": f"demo-former-user-{n}",
                    "is_active": False,
                    "auth_provider": User.AuthProvider.LOCAL,
                },
            )
            created_users += int(was_created)

        now = timezone.now()
        created_attempts = 0
        recent_window = now - datetime.timedelta(hours=24)
        if not LoginAttempt.objects.filter(created_at__gte=recent_window).exists():
            for n in range(SUCCESSFUL_SIGN_INS_24H):
                email = f"demo-user-{(n % ACTIVE_SSO_COUNT) + 1}@acentriagroup.com"
                attempt = LoginAttempt.objects.create(email=email, success=True)
                LoginAttempt.objects.filter(pk=attempt.pk).update(
                    created_at=now - datetime.timedelta(minutes=n)
                )
                created_attempts += 1

            for n in range(FAILED_SIGN_INS_24H):
                attempt = LoginAttempt.objects.create(
                    email=f"unknown-{n}@example.com", success=False
                )
                LoginAttempt.objects.filter(pk=attempt.pk).update(
                    created_at=now - datetime.timedelta(minutes=n * 5)
                )
                created_attempts += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_users} demo users and {created_attempts} login attempts."
            )
        )
