from django.db import migrations

# Historical models loaded by RunPython don't carry the Role.Name TextChoices
# class, so the fixed role set is spelled out here instead.
ROLE_NAMES = ["admin", "ciso", "risk_manager", "auditor", "control_owner", "viewer"]


def seed_roles(apps, schema_editor):
    Role = apps.get_model("iam", "Role")
    for name in ROLE_NAMES:
        Role.objects.get_or_create(name=name)


def unseed_roles(apps, schema_editor):
    Role = apps.get_model("iam", "Role")
    Role.objects.filter(name__in=ROLE_NAMES).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iam", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roles, unseed_roles),
    ]
