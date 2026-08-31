import secrets
from datetime import timedelta
from typing import Annotated

import pyotp
import strawberry
import strawberry_django
from asgiref.sync import sync_to_async
from django.conf import settings
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from strawberry.types import Info

from domains.iam.crypto import decrypt, encrypt
from domains.iam.images import STORED_CONTENT_TYPE, decode_avatar
from domains.iam.models import (
    IamAuditEvent,
    LoginAttempt,
    MfaRecoveryCode,
    Permission,
    Role,
    User,
    UserAvatar,
)
from domains.iam.permissions import require_roles

from .types import (
    AssignRoleInput,
    MfaConfirmedType,
    MfaRecoveryCodesType,
    MfaSetupType,
    MyProfileInput,
    PermissionType,
    RolePermissionInput,
    UserCreateInput,
    UserType,
    UserUpdateInput,
)


@strawberry.type
class AuthError:
    message: str


@strawberry.type
class MfaRequired:
    """Password verified — the account still needs its MFA code to complete sign-in."""

    message: str = "Multi-factor authentication code required."


LoginResult = Annotated[
    UserType | AuthError | MfaRequired, strawberry.union("LoginResult")
]

# Session keys tracking a password-verified-but-not-yet-MFA-verified sign-in.
# `auth_login()` is deliberately NOT called until the code is verified, so
# the session stays anonymous (no access to authenticated fields/mutations)
# until MFA passes.
MFA_PENDING_USER_KEY = "mfa_pending_user_id"
MFA_PENDING_ATTEMPTS_KEY = "mfa_pending_attempts"
MAX_MFA_ATTEMPTS = 5
RECOVERY_CODE_COUNT = 10


def _clear_mfa_challenge_sync(request) -> None:
    request.session.pop(MFA_PENDING_USER_KEY, None)
    request.session.pop(MFA_PENDING_ATTEMPTS_KEY, None)


async def _clear_mfa_challenge(request) -> None:
    await sync_to_async(_clear_mfa_challenge_sync)(request)


async def _session_get(request, key: str, default=None):
    # Django's session store lazily hits the DB on first access — never
    # touch request.session directly from an async resolver.
    return await sync_to_async(request.session.get)(key, default)


async def _session_set(request, key: str, value) -> None:
    await sync_to_async(request.session.__setitem__)(key, value)


def _verify_mfa_code(user: User, code: str) -> bool:
    code = code.strip().replace(" ", "")
    if not code:
        return False
    if user.mfa_secret and pyotp.TOTP(decrypt(user.mfa_secret)).verify(code, valid_window=1):
        return True
    for recovery in user.mfa_recovery_codes.filter(used_at__isnull=True):
        if check_password(code, recovery.code_hash):
            recovery.used_at = timezone.now()
            recovery.save(update_fields=["used_at"])
            return True
    return False


def _generate_recovery_codes(user: User) -> list[str]:
    user.mfa_recovery_codes.all().delete()
    codes = [secrets.token_hex(5) for _ in range(RECOVERY_CODE_COUNT)]
    MfaRecoveryCode.objects.bulk_create(
        MfaRecoveryCode(user=user, code_hash=make_password(code)) for code in codes
    )
    return codes


@strawberry.type
class RoleError:
    message: str


AssignRoleResult = Annotated[UserType | RoleError, strawberry.union("AssignRoleResult")]

RolePermissionResult = Annotated[
    PermissionType | RoleError, strawberry.union("RolePermissionResult")
]


def _actor(info: Info) -> User | None:
    user = info.context.request.user
    return user if user.is_authenticated else None


# ISO/IEC 27001:2022 A.5.18 — new access is recertified on a fixed cadence,
# not left unscheduled until someone remembers to trigger a review.
NEW_USER_ACCESS_REVIEW_DAYS = 90


@strawberry.type
class IamMutation:
    @strawberry.mutation
    async def login(self, info: Info, email: str, password: str) -> LoginResult:
        email = email.strip().lower()
        domain = email.rsplit("@", 1)[-1]
        allowed_emails = {e.lower() for e in settings.ALLOWED_LOGIN_EMAILS}
        if email not in allowed_emails and domain != settings.ALLOWED_LOGIN_DOMAIN.lower():
            await sync_to_async(LoginAttempt.objects.create)(email=email, success=False)
            return AuthError(
                message=f"Only @{settings.ALLOWED_LOGIN_DOMAIN} accounts can sign in here."
            )

        request = info.context.request
        user = await sync_to_async(authenticate)(request, username=email, password=password)
        if user is None:
            await sync_to_async(LoginAttempt.objects.create)(email=email, success=False)
            return AuthError(message="Invalid email or password.")

        if user.mfa_enabled:
            await _session_set(request, MFA_PENDING_USER_KEY, user.pk)
            await _session_set(request, MFA_PENDING_ATTEMPTS_KEY, 0)
            return MfaRequired()

        await sync_to_async(auth_login)(request, user)
        await sync_to_async(LoginAttempt.objects.create)(email=email, user=user, success=True)
        return user  # type: ignore[return-value]

    @strawberry.mutation
    async def verify_mfa_code(self, info: Info, code: str) -> LoginResult:
        request = info.context.request
        user_id = await _session_get(request, MFA_PENDING_USER_KEY)
        if not user_id:
            return AuthError(message="No pending sign-in requires verification.")

        user = await sync_to_async(User.objects.filter(pk=user_id).first)()
        if user is None or not user.mfa_enabled:
            await _clear_mfa_challenge(request)
            return AuthError(message="No pending sign-in requires verification.")

        attempts = await _session_get(request, MFA_PENDING_ATTEMPTS_KEY, 0)
        if attempts >= MAX_MFA_ATTEMPTS:
            await _clear_mfa_challenge(request)
            await sync_to_async(LoginAttempt.objects.create)(
                email=user.email, user=user, success=False
            )
            return AuthError(message="Too many attempts. Please sign in again.")

        verified = await sync_to_async(_verify_mfa_code)(user, code)
        if not verified:
            await _session_set(request, MFA_PENDING_ATTEMPTS_KEY, attempts + 1)
            return AuthError(message="Invalid verification code.")

        await _clear_mfa_challenge(request)
        await sync_to_async(auth_login)(request, user)
        await sync_to_async(LoginAttempt.objects.create)(email=user.email, user=user, success=True)
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
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(handle_django_errors=True)
    def change_password(
        self, info: Info, old_password: str, new_password: str
    ) -> UserType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise DjangoValidationError("You must be signed in to change your password.")
        if not user.check_password(old_password):
            raise DjangoValidationError("Current password is incorrect.")

        validate_password(new_password, user=user)
        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        update_session_auth_hash(info.context.request, user)
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(handle_django_errors=True)
    def begin_mfa_setup(self, info: Info) -> MfaSetupType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise DjangoValidationError("You must be signed in to set up MFA.")
        if user.mfa_enabled:
            raise DjangoValidationError(
                "MFA is already enabled. Disable it before setting up a new device."
            )

        secret = pyotp.random_base32()
        user.mfa_secret = encrypt(secret)
        user.save(update_fields=["mfa_secret"])

        uri = pyotp.TOTP(secret).provisioning_uri(
            name=user.email, issuer_name="Phoenix Platform"
        )
        return MfaSetupType(secret=secret, provisioning_uri=uri)

    @strawberry_django.mutation(handle_django_errors=True)
    def confirm_mfa_setup(self, info: Info, code: str) -> MfaConfirmedType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise DjangoValidationError("You must be signed in to set up MFA.")
        if not user.mfa_secret:
            raise DjangoValidationError("Start MFA setup before confirming a code.")

        secret = decrypt(user.mfa_secret)
        if not pyotp.TOTP(secret).verify(code.strip().replace(" ", ""), valid_window=1):
            raise DjangoValidationError("That code didn't match. Try again.")

        with transaction.atomic():
            user.mfa_enabled = True
            user.mfa_required = False
            user.save(update_fields=["mfa_enabled", "mfa_required"])
            codes = _generate_recovery_codes(user)
            IamAuditEvent.objects.create(
                event_type=IamAuditEvent.EventType.MFA_ENABLED,
                actor=user,
                target_user=user,
                detail=user.email,
            )
        return MfaConfirmedType(user=user, recovery_codes=codes)  # type: ignore[arg-type]

    @strawberry_django.mutation(handle_django_errors=True)
    def disable_mfa(self, info: Info, password: str) -> UserType:
        user = info.context.request.user
        if not user.is_authenticated:
            raise DjangoValidationError("You must be signed in to disable MFA.")
        if not user.check_password(password):
            raise DjangoValidationError("Current password is incorrect.")

        with transaction.atomic():
            user.mfa_enabled = False
            user.mfa_required = False
            user.mfa_secret = ""
            user.save(update_fields=["mfa_enabled", "mfa_required", "mfa_secret"])
            user.mfa_recovery_codes.all().delete()
            IamAuditEvent.objects.create(
                event_type=IamAuditEvent.EventType.MFA_DISABLED,
                actor=user,
                target_user=user,
                detail=user.email,
            )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(handle_django_errors=True)
    def regenerate_mfa_recovery_codes(self, info: Info, password: str) -> MfaRecoveryCodesType:
        """Issues a fresh set of recovery codes, invalidating the previous set (A.8.5).

        Re-authentication is required because holding these codes is equivalent
        to holding the second factor.
        """
        user = info.context.request.user
        if not user.is_authenticated:
            raise DjangoValidationError("You must be signed in to manage recovery codes.")
        if not user.mfa_enabled:
            raise DjangoValidationError("Enable MFA before generating recovery codes.")
        if not user.check_password(password):
            raise DjangoValidationError("Current password is incorrect.")

        with transaction.atomic():
            codes = _generate_recovery_codes(user)
            IamAuditEvent.objects.create(
                event_type=IamAuditEvent.EventType.MFA_CODES_REGENERATED,
                actor=user,
                target_user=user,
                detail=user.email,
            )
        return MfaRecoveryCodesType(recovery_codes=codes)

    @strawberry_django.mutation(handle_django_errors=True)
    def update_my_profile(self, info: Info, data: MyProfileInput) -> UserType:
        """Self-service edit of the caller's own contact attributes.

        Email, username and role membership are deliberately not editable here —
        those decide access and stay administrator-owned (A.5.16, A.5.18). Every
        change is written to the immutable trail like an administrative one.
        """
        user = info.context.request.user
        if not user.is_authenticated:
            raise DjangoValidationError("You must be signed in to update your profile.")
        if user.auth_provider == User.AuthProvider.ENTRA_ID:
            raise DjangoValidationError(
                "Your profile is managed by Microsoft Entra ID and cannot be edited here."
            )

        user.first_name = data.first_name.strip()
        user.last_name = data.last_name.strip()
        user.department = data.department.strip()
        user.full_clean(exclude=["password"])
        user.save(update_fields=["first_name", "last_name", "department"])
        IamAuditEvent.objects.create(
            event_type=IamAuditEvent.EventType.PROFILE_UPDATED,
            actor=user,
            target_user=user,
            detail=user.email,
        )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(handle_django_errors=True)
    def update_my_avatar(self, info: Info, image_base64: str) -> UserType:
        """Sets the caller's profile photo from a base64-encoded image.

        The bytes are decoded, checked and re-encoded server-side (see
        `domains.iam.images`) so what gets stored is always a plain square JPEG
        with no embedded metadata, whatever the client sent.
        """
        user = info.context.request.user
        if not user.is_authenticated:
            raise DjangoValidationError("You must be signed in to change your photo.")

        image = decode_avatar(image_base64)
        with transaction.atomic():
            UserAvatar.objects.update_or_create(
                user=user,
                defaults={"image": image, "content_type": STORED_CONTENT_TYPE},
            )
            IamAuditEvent.objects.create(
                event_type=IamAuditEvent.EventType.PROFILE_UPDATED,
                actor=user,
                target_user=user,
                detail=f"{user.email} · profile photo updated",
            )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(handle_django_errors=True)
    def remove_my_avatar(self, info: Info) -> UserType:
        """Deletes the caller's profile photo, falling back to their initials."""
        user = info.context.request.user
        if not user.is_authenticated:
            raise DjangoValidationError("You must be signed in to change your photo.")

        with transaction.atomic():
            deleted, _ = UserAvatar.objects.filter(user=user).delete()
            if deleted:
                IamAuditEvent.objects.create(
                    event_type=IamAuditEvent.EventType.PROFILE_UPDATED,
                    actor=user,
                    target_user=user,
                    detail=f"{user.email} · profile photo removed",
                )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(
        handle_django_errors=True, extensions=[require_roles(Role.Name.ADMIN)]
    )
    def admin_reset_mfa(self, info: Info, user_id: strawberry.ID) -> UserType:
        """Clears a user's MFA enrollment — recovery path for a lost device (A.8.5)."""
        user = User.objects.get(pk=user_id)
        with transaction.atomic():
            user.mfa_enabled = False
            user.mfa_secret = ""
            user.save(update_fields=["mfa_enabled", "mfa_secret"])
            user.mfa_recovery_codes.all().delete()
            IamAuditEvent.objects.create(
                event_type=IamAuditEvent.EventType.MFA_RESET,
                actor=_actor(info),
                target_user=user,
                detail=user.email,
            )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(
        handle_django_errors=True, extensions=[require_roles(Role.Name.ADMIN)]
    )
    def set_mfa_required(self, info: Info, user_id: strawberry.ID, required: bool) -> UserType:
        user = User.objects.get(pk=user_id)
        user.mfa_required = required
        user.save(update_fields=["mfa_required"])
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(
        handle_django_errors=True, extensions=[require_roles(Role.Name.ADMIN)]
    )
    def create_user(self, info: Info, data: UserCreateInput) -> UserType:
        validate_password(data.password)
        try:
            role = Role.objects.get(name=data.role_name)
        except Role.DoesNotExist as exc:
            raise DjangoValidationError("Selected role does not exist.") from exc

        with transaction.atomic():
            user = User(
                email=data.email.strip().lower(),
                username=data.username,
                first_name=data.first_name,
                last_name=data.last_name,
                department=data.department,
                # A.8.5 — the admin can require MFA, but enrollment itself
                # can only happen when the user signs in (see begin_mfa_setup).
                mfa_required=data.require_mfa,
                # A.5.17 — temporary passwords must be changed at first use.
                must_change_password=True,
                # A.5.18 — every new grant enters the periodic recertification cycle.
                next_access_review_date=timezone.now().date()
                + timedelta(days=NEW_USER_ACCESS_REVIEW_DAYS),
            )
            user.set_password(data.password)
            user.full_clean(exclude=["password"])
            user.save()
            user.roles.add(role)
            IamAuditEvent.objects.create(
                event_type=IamAuditEvent.EventType.USER_CREATED,
                actor=_actor(info),
                target_user=user,
                detail=f"{user.email} ({role.name})",
            )

        if data.send_welcome_email:
            send_mail(
                "Your account has been created",
                "An account has been created for you.\n\n"
                f"Email: {user.email}\n"
                f"Temporary password: {data.password}\n\n"
                f"Sign in at {settings.FRONTEND_URL}/auth/login — you'll be "
                "asked to set a new password.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        return user  # type: ignore[return-value]

    @strawberry_django.mutation(
        handle_django_errors=True, extensions=[require_roles(Role.Name.ADMIN)]
    )
    def update_user(self, info: Info, user_id: strawberry.ID, data: UserUpdateInput) -> UserType:
        user = User.objects.get(pk=user_id)
        user.email = data.email.strip().lower()
        user.username = data.username
        user.first_name = data.first_name
        user.last_name = data.last_name
        user.department = data.department
        user.full_clean(exclude=["password"])
        user.save(
            update_fields=["email", "username", "first_name", "last_name", "department"]
        )
        IamAuditEvent.objects.create(
            event_type=IamAuditEvent.EventType.USER_UPDATED,
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
        if user.is_superuser:
            raise DjangoValidationError("You cannot delete a superadmin account.")
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

    @strawberry_django.mutation(extensions=[require_roles(Role.Name.ADMIN)])
    def assign_permission(self, info: Info, data: RolePermissionInput) -> RolePermissionResult:
        try:
            permission = Permission.objects.get(pk=data.permission_id)
            role = Role.objects.get(name=data.role_name)
        except (Permission.DoesNotExist, Role.DoesNotExist):
            return RoleError(message="Role or permission not found.")
        permission.roles.add(role)
        IamAuditEvent.objects.create(
            event_type=IamAuditEvent.EventType.PERMISSION_GRANTED,
            actor=_actor(info),
            detail=f"{permission.resource}:{permission.action} → {role.name}",
        )
        return permission  # type: ignore[return-value]

    @strawberry_django.mutation(extensions=[require_roles(Role.Name.ADMIN)])
    def revoke_permission(self, info: Info, data: RolePermissionInput) -> RolePermissionResult:
        try:
            permission = Permission.objects.get(pk=data.permission_id)
            role = Role.objects.get(name=data.role_name)
        except (Permission.DoesNotExist, Role.DoesNotExist):
            return RoleError(message="Role or permission not found.")
        permission.roles.remove(role)
        IamAuditEvent.objects.create(
            event_type=IamAuditEvent.EventType.PERMISSION_REVOKED,
            actor=_actor(info),
            detail=f"{permission.resource}:{permission.action} → {role.name}",
        )
        return permission  # type: ignore[return-value]
