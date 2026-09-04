import strawberry
import strawberry_django
from strawberry.types import Info

from domains.iam.models import IamAuditEvent, Role, User
from domains.iam.permissions import require_roles
from domains.system.models import SystemSetting

from .types import EDITABLE_FIELDS, SystemSettingInput, SystemSettingType


def _client_ip(request) -> str | None:
    """The actor's connecting address, matching how IAM records its own events."""
    return request.META.get("REMOTE_ADDR")


def _apply(setting: SystemSetting, data: SystemSettingInput) -> list[str]:
    """Copy the supplied fields onto the row, returning the ones that moved."""
    changed = []
    for field in EDITABLE_FIELDS:
        value = getattr(data, field)
        if value is strawberry.UNSET or value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
        if getattr(setting, field) != value:
            setattr(setting, field, value)
            changed.append(field)
    return changed


@strawberry.type
class SystemMutation:
    @strawberry_django.mutation(
        handle_django_errors=True, extensions=[require_roles(Role.Name.ADMIN)]
    )
    def update_system_settings(self, info: Info, data: SystemSettingInput) -> SystemSettingType:
        """Change platform configuration. Every change lands in the IAM audit log.

        Settings here govern who may sign in and how accounts are held to
        account, so the trail of who changed what matters as much as the values
        (ISO/IEC 27001:2022 A.5.18, A.8.15).
        """
        setting = SystemSetting.load()
        changed = _apply(setting, data)
        if not changed:
            return setting  # type: ignore[return-value]

        actor = info.context.request.user
        setting.updated_by = actor if isinstance(actor, User) and actor.is_authenticated else None
        setting.full_clean()
        setting.save(update_fields=[*changed, "updated_by", "updated_at"])

        labels = ", ".join(str(setting._meta.get_field(field).verbose_name) for field in changed)
        IamAuditEvent.objects.create(
            event_type=IamAuditEvent.EventType.SETTINGS_UPDATED,
            actor=setting.updated_by,
            detail=f"Updated {labels}",
            ip_address=_client_ip(info.context.request),
        )
        return setting  # type: ignore[return-value]
