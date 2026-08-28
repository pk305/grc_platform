from django.db import migrations

# Historical models loaded by RunPython don't carry the Resource/Action
# TextChoices classes, so the catalog is spelled out here instead. Every row
# is an access-control grant (ISO/IEC 27001:2022 A.5.15); the two rows that
# also gate a real GraphQL mutation today (iam_users/iam_roles, risk) match
# the require_roles(...) extensions in graphql/mutations.py exactly.
CATALOG = [
    # (resource, action, iso_clause, [role names])
    ("iam_users", "view", "A.5.16", ["admin", "ciso"]),
    ("iam_users", "create", "A.5.16", ["admin"]),
    ("iam_users", "edit", "A.5.16", ["admin"]),
    ("iam_users", "delete", "A.5.16", ["admin"]),
    ("iam_roles", "view", "A.5.15", ["admin", "ciso"]),
    ("iam_roles", "assign", "A.5.18", ["admin"]),
    (
        "risk",
        "view",
        "A.5.15",
        ["admin", "ciso", "risk_manager", "auditor", "control_owner", "viewer"],
    ),
    ("risk", "create", "A.5.18", ["risk_manager", "ciso"]),
    ("risk", "edit", "A.5.18", ["risk_manager", "ciso"]),
    ("risk", "delete", "A.5.18", ["risk_manager", "ciso"]),
    ("risk", "approve", "A.5.18", ["ciso"]),
    (
        "controls",
        "view",
        "A.5.15",
        ["admin", "ciso", "risk_manager", "auditor", "control_owner", "viewer"],
    ),
    ("controls", "edit", "A.5.18", ["control_owner", "ciso"]),
    ("controls", "approve", "A.5.18", ["ciso"]),
    (
        "audit",
        "view",
        "A.5.15",
        ["admin", "ciso", "risk_manager", "auditor", "control_owner", "viewer"],
    ),
    ("audit", "create", "A.5.18", ["auditor"]),
    ("audit", "approve", "A.5.18", ["ciso", "auditor"]),
    (
        "incidents",
        "view",
        "A.5.15",
        ["admin", "ciso", "risk_manager", "auditor", "control_owner", "viewer"],
    ),
    ("incidents", "create", "A.5.18", ["risk_manager", "control_owner", "ciso"]),
    ("incidents", "edit", "A.5.18", ["risk_manager", "control_owner", "ciso"]),
    ("incidents", "approve", "A.5.18", ["ciso"]),
    (
        "obligations",
        "view",
        "A.5.15",
        ["admin", "ciso", "risk_manager", "auditor", "control_owner", "viewer"],
    ),
    ("obligations", "edit", "A.5.18", ["ciso", "risk_manager"]),
    ("obligations", "approve", "A.5.18", ["ciso"]),
]


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model("iam", "Permission")
    Role = apps.get_model("iam", "Role")
    roles_by_name = {role.name: role for role in Role.objects.all()}

    for resource, action, iso_clause, role_names in CATALOG:
        permission, _ = Permission.objects.get_or_create(
            resource=resource, action=action, defaults={"iso_clause": iso_clause}
        )
        permission.iso_clause = iso_clause
        permission.save(update_fields=["iso_clause"])
        permission.roles.set(roles_by_name[name] for name in role_names)


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("iam", "Permission")
    Permission.objects.filter(
        resource__in=[resource for resource, *_ in CATALOG]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iam", "0004_iamauditevent_permission"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, unseed_permissions),
    ]
