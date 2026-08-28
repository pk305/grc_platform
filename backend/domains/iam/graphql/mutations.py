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
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.permissions import IsAuthenticated

from domains.iam.models import Role, User
from domains.iam.permissions import require_roles

from .types import AssignRoleInput, UserCreateInput, UserType, UserUpdateInput


@strawberry.type
class AuthError:
    message: str


LoginResult = Annotated[UserType | AuthError, strawberry.union("LoginResult")]


@strawberry.type
class RoleError:
    message: str


AssignRoleResult = Annotated[UserType | RoleError, strawberry.union("AssignRoleResult")]


@strawberry.type
class IamMutation:
    @strawberry.mutation
    async def login(self, info: Info, email: str, password: str) -> LoginResult:
        domain = email.rsplit("@", 1)[-1].lower()
        allowed_emails = {e.lower() for e in settings.ALLOWED_LOGIN_EMAILS}
        if email.lower() not in allowed_emails and domain != settings.ALLOWED_LOGIN_DOMAIN.lower():
            return AuthError(
                message=f"Only @{settings.ALLOWED_LOGIN_DOMAIN} accounts can sign in here."
            )

        request = info.context.request
        user = await sync_to_async(authenticate)(request, username=email, password=password)
        if user is None:
            return AuthError(message="Invalid email or password.")
        await sync_to_async(auth_login)(request, user)
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

    @strawberry_django.mutation(handle_django_errors=True)
    def create_user(self, data: UserCreateInput) -> UserType:
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
        return user  # type: ignore[return-value]

    update_user: UserType = mutations.update(UserUpdateInput, extensions=[IsAuthenticated()])
    delete_user: UserType = mutations.delete(
        strawberry_django.NodeInput, extensions=[IsAuthenticated()]
    )

    @strawberry_django.mutation(extensions=[require_roles(Role.Name.ADMIN)])
    def assign_role(self, data: AssignRoleInput) -> AssignRoleResult:
        try:
            user = User.objects.get(pk=data.user_id)
            role = Role.objects.get(name=data.role_name)
        except (User.DoesNotExist, Role.DoesNotExist):
            return RoleError(message="User or role not found.")
        user.roles.add(role)
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(extensions=[require_roles(Role.Name.ADMIN)])
    def revoke_role(self, data: AssignRoleInput) -> AssignRoleResult:
        try:
            user = User.objects.get(pk=data.user_id)
            role = Role.objects.get(name=data.role_name)
        except (User.DoesNotExist, Role.DoesNotExist):
            return RoleError(message="User or role not found.")
        user.roles.remove(role)
        return user  # type: ignore[return-value]
