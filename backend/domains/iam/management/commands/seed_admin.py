"""Seed (or update) the default superuser and grant the admin role.

Idempotent: safe to run on every deploy. The password is never hardcoded —
pass --password or set DJANGO_SUPERUSER_PASSWORD.
"""

import os

from django.core.management.base import BaseCommand, CommandError, CommandParser

from domains.iam.models import Role, User


class Command(BaseCommand):
    help = "Create or update the default superuser and grant it the admin role."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--email", default="pknuek@gmail.com")
        parser.add_argument("--username", default="admin")
        parser.add_argument("--password", default=None)

    def handle(self, *args: object, **options: str | None) -> None:
        email = str(options["email"])
        username = str(options["username"])
        password = options["password"] or os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        if not password:
            raise CommandError(
                "Set DJANGO_SUPERUSER_PASSWORD or pass --password to seed the superuser."
            )

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": username},
        )
        user.username = username
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        admin_role, _ = Role.objects.get_or_create(name=Role.Name.ADMIN)
        user.roles.add(admin_role)

        verb = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} superuser {email} with the admin role."))
