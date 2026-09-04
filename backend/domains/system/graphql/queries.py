import strawberry
import strawberry_django

from domains.iam.models import Role
from domains.iam.permissions import require_roles
from domains.system.models import SystemSetting

from .types import SystemSettingType


@strawberry.type
class SystemQuery:
    @strawberry_django.field(extensions=[require_roles(Role.Name.ADMIN)])
    def system_settings(self) -> SystemSettingType:
        """Platform configuration. Admin-only — it names the sign-in domain and
        the account policy, which is reconnaissance for anyone else."""
        return SystemSetting.load()  # type: ignore[return-value]
