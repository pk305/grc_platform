'use client';

import {
  FormEvent,
  KeyboardEvent,
  useId,
  useRef,
  useState,
  type CSSProperties
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, IconButton, Text, TextField } from '@/components/ui';
import AcentriaLogo from '@/components/common/AcentriaLogo';
import AuthShowcasePanel from '@/components/auth/AuthShowcasePanel';
import { useAuth } from '@/features/auth/AuthContext';

const ALLOWED_EMAIL_DOMAIN = 'acentriagroup.com';

const ALLOWED_LOGIN_EMAILS = ['pknuek@gmail.com'];
const TRUSTED_DEVICE_DAYS = 30;
const SSO_ENTRY_URL = '/auth/sso';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

const FIELD_HEIGHT_STYLE = {
  '--text-field-height': 'calc(2.25rem + 2px)'
} as CSSProperties;

const MESSAGES = {
  emailRequired: 'Enter an email address',
  emailInvalid: 'Enter a valid email address',
  passwordRequired: 'Enter your password',
  invalidCredentials: 'Email or password is incorrect.',
  domainNotAllowed: `Only @${ALLOWED_EMAIL_DOMAIN} accounts can sign in here.`,
  unavailable: 'Sign-in is unavailable right now. Try again in a few minutes.'
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | null {
  if (!value) return MESSAGES.emailRequired;
  if (!EMAIL_PATTERN.test(value)) return MESSAGES.emailInvalid;
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return MESSAGES.passwordRequired;
  return null;
}

function MicrosoftIcon() {
  return (
    <Image
      src="/assets/brand/microsoft.svg"
      alt=""
      width={16}
      height={16}
      className="me-2"
      style={{ objectFit: 'contain' }}
    />
  );
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

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const passwordHelpId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorToastRef = useRef<HTMLDivElement>(null);

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState('CapsLock'));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError(null);
    setPasswordError(null);

    const trimmedEmail = email.trim();
    const emailValidationError = validateEmail(trimmedEmail);
    const passwordValidationError = validatePassword(password);
    if (emailValidationError || passwordValidationError) {
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      return;
    }

    const domain = trimmedEmail.toLowerCase().split('@')[1];
    if (
      !ALLOWED_LOGIN_EMAILS.includes(trimmedEmail.toLowerCase()) &&
      domain !== ALLOWED_EMAIL_DOMAIN
    ) {
      setEmailError(MESSAGES.domainNotAllowed);
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(trimmedEmail, password);
      if (!result.success) {
        setPasswordError(result.error ?? MESSAGES.invalidCredentials);
        return;
      }
      router.push('/');
    } catch {
      if (errorToastRef.current) {
        const { Toast } = await import('bootstrap');
        Toast.getOrCreateInstance(errorToastRef.current).show();
      }
    } finally {
      setSubmitting(false);
    }
  }

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
            <Text
              size="1"
              weight="medium"
              color="gray"
              mt="2"
              style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
              className="mt-4"
            >
              Phoenix Platform
            </Text>
          </div>

          <div className="mb-3">
            <h1 className="h3 fw-bold mb-1">Sign in</h1>
            <p className="text-700 mb-0">
              Use your organisation account to continue.
            </p>
          </div>

          <a
            href={SSO_ENTRY_URL}
            className="d-flex align-items-center justify-content-center"
          >
            <MicrosoftIcon />
            Continue with Microsoft Entra ID
          </a>

          <div className="position-relative mb-3">
            <hr className="bg-200" />
            <div className="divider-content-center">or sign in with email</div>
          </div>

          <form onSubmit={handleSubmit} noValidate={false}>
            <div className="mb-3">
              <TextField
                id="email"
                name="email"
                label="Work email"
                style={FIELD_HEIGHT_STYLE}
                type="email"
                inputMode="email"
                placeholder={`name@${ALLOWED_EMAIL_DOMAIN}`}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                autoComplete="username"
                spellCheck={false}
                helpText={`Only @${ALLOWED_EMAIL_DOMAIN} accounts are permitted.`}
                error={emailError}
                required
              />
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-baseline mb-1">
                <Text as="label" htmlFor="password" size="2" weight="medium">
                  Password
                </Text>
                <Link
                  href={`/auth/reset-password?email=${encodeURIComponent(email.trim())}`}
                  className="fs--1
                   fw-semi-bold"
                >
                  Reset password
                </Link>
              </div>
              <TextField
                id="password"
                name="password"
                style={FIELD_HEIGHT_STYLE}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                onKeyUp={handlePasswordKey}
                onKeyDown={handlePasswordKey}
                autoComplete="current-password"
                aria-describedby={capsLockOn ? passwordHelpId : undefined}
                error={passwordError}
                required
                slotEnd={
                  <IconButton
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                  >
                    <span
                      className={
                        showPassword ? 'far fa-eye-slash' : 'far fa-eye'
                      }
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
                {capsLockOn && 'Caps lock is on'}
              </div>
            </div>

            <div className="form-check mb-4">
              <input
                id="trust-device"
                name="trustDevice"
                className="form-check-input"
                type="checkbox"
                checked={trustDevice}
                onChange={e => setTrustDevice(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="trust-device">
                Trust this device for {TRUSTED_DEVICE_DAYS} days
                <span className="d-block fs--1 text-600">
                  Not recommended on shared computers
                </span>
              </label>
            </div>

            <Button
              type="submit"
              size="3"
              color="gray"
              highContrast
              className="w-100 mb-4"
              loading={submitting}
            >
              Sign in
            </Button>
          </form>

          <ComplianceFooter />
        </main>

        <HalftoneDots className="bottom-0 start-0" />
      </div>

      <AuthShowcasePanel />

      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
        <div
          ref={errorToastRef}
          className="toast"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <strong className="me-auto">Sign in</strong>
            <button
              className="btn-close"
              type="button"
              data-bs-dismiss="toast"
              aria-label="Close"
            />
          </div>
          <div className="toast-body">{MESSAGES.unavailable}</div>
        </div>
      </div>
    </div>
  );
}
