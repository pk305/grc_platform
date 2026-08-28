from typing import Annotated

import strawberry
import strawberry_django
from asgiref.sync import sync_to_async
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from strawberry.types import Info

from domains.iam.models import IamAuditEvent, LoginAttempt, Role, User
from domains.iam.permissions import require_roles

from .types import AssignRoleInput, UserCreateInput, UserType


@strawberry.type
class AuthError:
    message: str


LoginResult = Annotated[UserType | AuthError, strawberry.union("LoginResult")]


@strawberry.type
class RoleError:
    message: str


AssignRoleResult = Annotated[UserType | RoleError, strawberry.union("AssignRoleResult")]


def _actor(info: Info) -> User | None:
    user = info.context.request.user
    return user if user.is_authenticated else None


@strawberry.type
class IamMutation:
    @strawberry.mutation
    async def login(self, info: Info, email: str, password: str) -> LoginResult:
        domain = email.rsplit("@", 1)[-1].lower()
        allowed_emails = {e.lower() for e in settings.ALLOWED_LOGIN_EMAILS}
        if email.lower() not in allowed_emails and domain != settings.ALLOWED_LOGIN_DOMAIN.lower():
            await sync_to_async(LoginAttempt.objects.create)(email=email, success=False)
            return AuthError(
                message=f"Only @{settings.ALLOWED_LOGIN_DOMAIN} accounts can sign in here."
            )

        request = info.context.request
        user = await sync_to_async(authenticate)(request, username=email, password=password)
        if user is None:
            await sync_to_async(LoginAttempt.objects.create)(email=email, success=False)
            return AuthError(message="Invalid email or password.")
        await sync_to_async(auth_login)(request, user)
        await sync_to_async(LoginAttempt.objects.create)(email=email, user=user, success=True)
        return user  # type: ignore[return-value]

    @strawberry.mutation
    async def logout(self, info: Info) -> bool:
        await sync_to_async(auth_logout)(info.context.request)
        return True

    @strawberry.mutation
    async def request_password_reset(self, email: str) -> bool:
        user = await sync_to_async(User.objects.filter(email__iexact=email).first)()
        if user is not None:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = await sync_to_async(default_token_generator.make_token)(user)
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?uid={uid}&token={token}"
            await sync_to_async(send_mail)(
                "Reset your password",
                f"Use the link below to reset your password:\n\n{reset_url}\n\n"
                "If you didn't request this, you can safely ignore this email.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        # Always return true — don't reveal whether the email is registered.
        return True

    @strawberry_django.mutation(handle_django_errors=True)
    def reset_password(self, uid: str, token: str, new_password: str) -> UserType:
        try:
            user = User.objects.get(pk=urlsafe_base64_decode(uid).decode())
        except (User.DoesNotExist, ValueError, TypeError, OverflowError, UnicodeDecodeError) as exc:
            raise DjangoValidationError(
                "This password reset link is invalid or has expired."
            ) from exc

        if not default_token_generator.check_token(user, token):
            raise DjangoValidationError("This password reset link is invalid or has expired.")

        validate_password(new_password, user=user)
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(
        handle_django_errors=True, extensions=[require_roles(Role.Name.ADMIN)]
    )
    def create_user(self, info: Info, data: UserCreateInput) -> UserType:
        validate_password(data.password)
        with transaction.atomic():
            user = User(
                email=data.email,
                username=data.username,
                first_name=data.first_name,
                last_name=data.last_name,
            )
            user.set_password(data.password)
            user.full_clean(exclude=["password"])
            user.save()
            IamAuditEvent.objects.create(
                event_type=IamAuditEvent.EventType.USER_CREATED,
                actor=_actor(info),
                target_user=user,
                detail=user.email,
            )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(
        handle_django_errors=True, extensions=[require_roles(Role.Name.ADMIN)]
    )
    def set_user_active(self, info: Info, user_id: strawberry.ID, is_active: bool) -> UserType:
        user = User.objects.get(pk=user_id)
        actor = _actor(info)
        if not is_active and actor is not None and actor.pk == user.pk:
            raise DjangoValidationError("You cannot deactivate your own account.")
        if user.is_active != is_active:
            user.is_active = is_active
            user.full_clean(exclude=["password"])
            user.save(update_fields=["is_active"])
            IamAuditEvent.objects.create(
                event_type=(
                    IamAuditEvent.EventType.USER_ACTIVATED
                    if is_active
                    else IamAuditEvent.EventType.USER_DEACTIVATED
                ),
                actor=actor,
                target_user=user,
                detail=user.email,
            )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(
        handle_django_errors=True, extensions=[require_roles(Role.Name.ADMIN)]
    )
    def delete_user(self, info: Info, user_id: strawberry.ID) -> UserType:
        user = User.objects.get(pk=user_id)
        actor = _actor(info)
        if actor is not None and actor.pk == user.pk:
            raise DjangoValidationError("You cannot delete your own account.")
        deleted_pk, email = user.pk, user.email
        user.delete()
        user.pk = deleted_pk  # .delete() clears pk; restore it for the response
        IamAuditEvent.objects.create(
            event_type=IamAuditEvent.EventType.USER_DELETED,
            actor=actor,
            detail=email,
        )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(extensions=[require_roles(Role.Name.ADMIN)])
    def assign_role(self, info: Info, data: AssignRoleInput) -> AssignRoleResult:
        try:
            user = User.objects.get(pk=data.user_id)
            role = Role.objects.get(name=data.role_name)
        except (User.DoesNotExist, Role.DoesNotExist):
            return RoleError(message="User or role not found.")
        user.roles.add(role)
        IamAuditEvent.objects.create(
            event_type=IamAuditEvent.EventType.ROLE_GRANTED,
            actor=_actor(info),
            target_user=user,
            detail=f"{role.name} → {user.email}",
        )
        return user  # type: ignore[return-value]

    @strawberry.mutation(extensions=[require_roles(Role.Name.ADMIN)])
    def start_access_review(self, user_ids: list[strawberry.ID]) -> list[UserType]:
        """Marks the selected users as due for an access-recertification pass (A.5.18)."""
        users = list(User.objects.filter(pk__in=user_ids))
        for user in users:
            user.next_access_review_date = timezone.now().date()
        User.objects.bulk_update(users, ["next_access_review_date"])
        return users  # type: ignore[return-value]

    @strawberry_django.mutation(extensions=[require_roles(Role.Name.ADMIN)])
    def revoke_role(self, info: Info, data: AssignRoleInput) -> AssignRoleResult:
        try:
            user = User.objects.get(pk=data.user_id)
            role = Role.objects.get(name=data.role_name)
        except (User.DoesNotExist, Role.DoesNotExist):
            return RoleError(message="User or role not found.")
        user.roles.remove(role)
        IamAuditEvent.objects.create(
            event_type=IamAuditEvent.EventType.ROLE_REVOKED,
            actor=_actor(info),
            target_user=user,
            detail=f"{role.name} → {user.email}",
        )
        return user  # type: ignore[return-value]
