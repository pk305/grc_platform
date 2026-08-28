'use client';

import {
  FormEvent,
  KeyboardEvent,
  Suspense,
  useId,
  useState,
  type CSSProperties
} from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, IconButton, TextField } from '@/components/ui';
import AcentriaLogo from '@/components/common/AcentriaLogo';
import AuthShowcasePanel from '@/components/auth/AuthShowcasePanel';
import {
  useRequestPasswordResetMutation,
  useResetPasswordMutation
} from '@/features/auth/__generated__/queries.generated';

const MIN_PASSWORD_LENGTH = 8; // matches Django's default MinimumLengthValidator
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';
const ALLOWED_EMAIL_DOMAIN = 'acentriagroup.com';

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;

const FIELD_HEIGHT_STYLE = {
  '--text-field-height': 'calc(2.25rem + 2px)'
} as CSSProperties;

const MESSAGES = {
  invalidEmail: 'Enter a valid email address.',
  domainNotAllowed: `Only @${ALLOWED_EMAIL_DOMAIN} accounts can request a reset here.`,
  resetRequested:
    "If that email is associated with an account, we've sent a reset link to it.",
  tooShort: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  allNumeric: "Password can't be entirely numeric.",
  mismatch: 'Passwords do not match.',
  invalidLink: 'This reset link is invalid or has expired.',
  unavailable: 'Something went wrong. Please try again.',
  passwordUpdated: 'Your password has been updated.'
} as const;

function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > MAX_EMAIL_LENGTH) return false;
  const localPart = value.split('@')[0];
  if (!localPart || localPart.length > MAX_LOCAL_PART_LENGTH) return false;
  return EMAIL_PATTERN.test(value);
}

function isKnownEmail(value: string): boolean {
  if (!isValidEmail(value)) return false;
  return value.split('@')[1] === ALLOWED_EMAIL_DOMAIN;
}

function isAllNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return MESSAGES.tooShort;
  if (isAllNumeric(password)) return MESSAGES.allNumeric;
  return null;
}

function HalftoneDots({ className }: { className: string }) {
  return (
    <div
      className={`position-absolute overflow-hidden ${className}`}
      style={{ width: '100%', height: 120, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Image
        src="/assets/logo/fluid-dots-red.svg"
        alt=""
        fill
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'bottom' }}
      />
    </div>
  );
}

function ComplianceFooter() {
  return (
    <footer className="border-top pt-3 d-flex flex-wrap gap-2 column-gap-3 fs--2 text-600">
      <Link href="/policies/privacy" className="text-700">
        Privacy notice
      </Link>
      <Link href="/policies/acceptable-use" className="text-700">
        Acceptable use policy
      </Link>
      <Link href="/support" className="text-700">
        Contact support
      </Link>
      <span className="ms-auto">v{APP_VERSION}</span>
    </footer>
  );
}

function RequestResetForm({ initialEmail }: { initialEmail: string }) {
  const errorId = useId();

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [requestPasswordReset, { loading: submitting }] =
    useRequestPasswordResetMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError(MESSAGES.invalidEmail);
      return;
    }
    if (!isKnownEmail(trimmed)) {
      setError(MESSAGES.domainNotAllowed);
      return;
    }

    try {
      await requestPasswordReset({ variables: { email: trimmed } });
      setRequested(true);
    } catch {
      setError(MESSAGES.unavailable);
    }
  }

  if (requested) {
    return (
      <div className="mb-3">
        <h1 className="h3 fw-bold mb-1">Check your email</h1>
        <p className="text-700">{MESSAGES.resetRequested}</p>
        <Link href="/auth/login" className="fw-semi-bold">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3">
        <h1 className="h3 fw-bold mb-1">Reset your password</h1>
        <p className="text-700 mb-0">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            id={errorId}
            className="alert alert-danger py-2"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <TextField
            id="email"
            name="email"
            label="Email address"
            style={FIELD_HEIGHT_STYLE}
            type="email"
            inputMode="email"
            placeholder="name@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            autoFocus
            spellCheck={false}
            maxLength={MAX_EMAIL_LENGTH}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            required
          />
        </div>

        <Button
          type="submit"
          size="3"
          color="gray"
          highContrast
          className="w-100 mb-4"
          loading={submitting}
        >
          Send reset link
        </Button>
      </form>
    </>
  );
}

function ResetPasswordForm({ uid, token }: { uid: string; token: string }) {
  const passwordHelpId = useId();
  const errorId = useId();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resetPassword, { loading: submitting }] = useResetPasswordMutation();

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState('CapsLock'));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirmPassword) {
      setError(MESSAGES.mismatch);
      return;
    }

    try {
      const { data } = await resetPassword({
        variables: { uid, token, newPassword: password }
      });
      const result = data?.resetPassword;
      if (result?.__typename === 'OperationInfo') {
        setError(result.messages[0]?.message ?? MESSAGES.invalidLink);
        return;
      }
      setDone(true);
    } catch {
      setError(MESSAGES.unavailable);
    }
  }

  if (done) {
    return (
      <div className="mb-3">
        <h1 className="h3 fw-bold mb-1">Password updated</h1>
        <p className="text-700">{MESSAGES.passwordUpdated}</p>
        <Link href="/auth/login" className="fw-semi-bold">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3">
        <h1 className="h3 fw-bold mb-1">Set a new password</h1>
        <p className="text-700 mb-0">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div
            id={errorId}
            className="alert alert-danger py-2"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div className="mb-3">
          <TextField
            id="new-password"
            name="newPassword"
            label="New password"
            style={FIELD_HEIGHT_STYLE}
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyUp={handlePasswordKey}
            onKeyDown={handlePasswordKey}
            autoComplete="new-password"
            aria-describedby={
              [capsLockOn ? passwordHelpId : null, error ? errorId : null]
                .filter(Boolean)
                .join(' ') || undefined
            }
            aria-invalid={Boolean(error)}
            required
            slotEnd={
              <IconButton
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                <span
                  className={showPassword ? 'far fa-eye-slash' : 'far fa-eye'}
                  aria-hidden="true"
                />
              </IconButton>
            }
          />
          <div
            id={passwordHelpId}
            className="form-text"
            aria-live="polite"
            style={{ minHeight: '1.25rem' }}
          >
            {capsLockOn
              ? 'Caps lock is on'
              : `At least ${MIN_PASSWORD_LENGTH} characters, not all numbers.`}
          </div>
        </div>

        <div className="mb-4">
          <TextField
            id="confirm-password"
            name="confirmPassword"
            label="Confirm new password"
            style={FIELD_HEIGHT_STYLE}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={Boolean(error)}
            required
            slotEnd={
              <IconButton
                type="button"
                onClick={() => setShowConfirmPassword(s => !s)}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
                aria-pressed={showConfirmPassword}
              >
                <span
                  className={
                    showConfirmPassword ? 'far fa-eye-slash' : 'far fa-eye'
                  }
                  aria-hidden="true"
                />
              </IconButton>
            }
          />
        </div>

        <Button
          type="submit"
          size="3"
          color="gray"
          highContrast
          className="w-100 mb-4"
          loading={submitting}
        >
          Reset password
        </Button>
      </form>
    </>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const email = searchParams.get('email') ?? '';

  return uid && token ? (
    <ResetPasswordForm uid={uid} token={token} />
  ) : (
    <RequestResetForm initialEmail={email} />
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="d-flex min-vh-100 overflow-hidden">
      <div
        className="d-flex flex-column justify-content-center position-relative bg-white flex-grow-1"
        style={{ flex: '1 1 45%' }}
      >
        <main
          className="mx-auto w-100 px-4 animate__animated animate__fadeIn animate__faster"
          style={{ maxWidth: 400 }}
        >
          <div className="d-flex flex-column align-items-center mb-4">
            <AcentriaLogo width={220} priority />
          </div>

          <Suspense fallback={null}>
            <ResetPasswordContent />
          </Suspense>

          <ComplianceFooter />
        </main>

        <HalftoneDots className="bottom-0 start-0" />
      </div>

      <AuthShowcasePanel />
    </div>
  );
}
