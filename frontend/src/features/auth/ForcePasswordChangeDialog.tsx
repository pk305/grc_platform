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
import Image from 'next/image';
import { Button, IconButton, Text, TextField } from '@/components/ui';
import AcentriaLogo from '@/components/common/AcentriaLogo';
import AuthShowcasePanel from '@/components/auth/AuthShowcasePanel';
import { PageTitle } from '@/components/common/PageTitle';
import { useChangePasswordMutation } from './__generated__/queries.generated';
import { useAuth } from './AuthContext';
import {
  MIN_PASSWORD_LENGTH,
  STRENGTH_LABELS,
  isCommonPassword,
  scoreStrength
} from '@/lib/password';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

const FIELD_HEIGHT_STYLE = {
  '--text-field-height': 'calc(2.25rem + 2px)'
} as CSSProperties;

const MESSAGES = {
  fieldsRequired: 'Enter your temporary password and a new password.',
  mismatch: 'Passwords do not match.',
  notReady: 'Your new password does not meet the requirements below.',
  unavailable: 'Something went wrong. Please try again.'
} as const;

function StrengthMeter({ value }: { value: string }) {
  const score = scoreStrength(value);
  const colors = ['bg-300', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];

  return (
    <div className="mb-3">
      <div className="d-flex gap-1 mb-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`rounded-pill ${i < score ? colors[score] : 'bg-300'}`}
            style={{ height: 4, flex: 1 }}
          />
        ))}
      </div>
      <Text size="1" color="gray">
        Strength: {STRENGTH_LABELS[score]}
      </Text>
    </div>
  );
}

function Requirement({
  met,
  children
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`d-flex align-items-start gap-2 ${met ? 'text-success' : 'text-700'}`}
    >
      <span
        className={met ? 'far fa-check-circle mt-1' : 'far fa-circle mt-1'}
        aria-hidden="true"
        style={{ fontSize: '0.75rem' }}
      />
      <span className="fs--1">{children}</span>
    </li>
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
      <span>Signed in with a temporary password</span>
      <span className="ms-auto">v{APP_VERSION}</span>
    </footer>
  );
}

export default function ForcePasswordChangeDialog() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const passwordHelpId = useId();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorToastRef = useRef<HTMLDivElement>(null);

  const [changePassword] = useChangePasswordMutation();

  const lengthOk = newPassword.length >= MIN_PASSWORD_LENGTH;
  const differentFromTemp =
    newPassword.length > 0 && newPassword !== oldPassword;
  const notCommon = newPassword.length > 0 && !isCommonPassword(newPassword);
  const requirementsMet = lengthOk && differentFromTemp && notCommon;
  const confirmMatches =
    confirmPassword.length > 0 && confirmPassword === newPassword;
  const canSubmit =
    oldPassword.length > 0 && requirementsMet && confirmMatches && !submitting;

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState('CapsLock'));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(MESSAGES.fieldsRequired);
      return;
    }
    if (!requirementsMet) {
      setError(MESSAGES.notReady);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(MESSAGES.mismatch);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await changePassword({
        variables: { oldPassword, newPassword }
      });
      const result = data?.changePassword;
      if (result?.__typename === 'OperationInfo') {
        setError(result.messages.map(m => m.message).join(' '));
        return;
      }
      await refreshUser();
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
      <PageTitle title="Set a New Password" />
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

          <div className="mb-3">
            <h1 className="h3 fw-bold mb-1">Set a new password</h1>
            <p className="text-700 mb-0">
              You signed in with a temporary password, which can only be used
              once.
            </p>
            <p className="text-700 mb-3">
              Choose a new password to continue to your account.
            </p>
            {user && (
              <span className="badge bg-200 text-800 rounded-pill fw-normal">
                Signed in as {user.email}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3 mt-3">
              <TextField
                id="temp-password"
                name="tempPassword"
                label="Temporary password"
                style={FIELD_HEIGHT_STYLE}
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={e => {
                  setOldPassword(e.target.value);
                  if (error) setError(null);
                }}
                onKeyUp={handlePasswordKey}
                onKeyDown={handlePasswordKey}
                autoComplete="current-password"
                autoFocus
                required
                slotEnd={
                  <IconButton
                    type="button"
                    onClick={() => setShowOldPassword(s => !s)}
                    aria-label={
                      showOldPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showOldPassword}
                  >
                    <span
                      className={
                        showOldPassword ? 'far fa-eye-slash' : 'far fa-eye'
                      }
                      aria-hidden="true"
                    />
                  </IconButton>
                }
              />
            </div>

            <div className="mb-2">
              <TextField
                id="new-password"
                name="newPassword"
                label="New password"
                style={FIELD_HEIGHT_STYLE}
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="new-password"
                aria-describedby={capsLockOn ? passwordHelpId : undefined}
                required
                slotEnd={
                  <IconButton
                    type="button"
                    onClick={() => setShowNewPassword(s => !s)}
                    aria-label={
                      showNewPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showNewPassword}
                  >
                    <span
                      className={
                        showNewPassword ? 'far fa-eye-slash' : 'far fa-eye'
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
                style={{ minHeight: capsLockOn ? '1.25rem' : 0 }}
              >
                {capsLockOn && 'Caps lock is on'}
              </div>
            </div>

            <ul className="list-unstyled mb-2 d-flex flex-column gap-1">
              <Requirement met={lengthOk}>
                At least {MIN_PASSWORD_LENGTH} characters — a passphrase works
                well
              </Requirement>
              <Requirement met={differentFromTemp}>
                Different from your temporary password
              </Requirement>
              <Requirement met={notCommon}>
                Not a commonly used password
              </Requirement>
            </ul>

            <StrengthMeter value={newPassword} />

            <div className="mb-4">
              <TextField
                id="confirm-password"
                name="confirmPassword"
                label="Confirm new password"
                style={FIELD_HEIGHT_STYLE}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="new-password"
                error={
                  confirmPassword.length > 0 && !confirmMatches
                    ? MESSAGES.mismatch
                    : undefined
                }
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

            {error && (
              <div
                className="alert alert-danger py-2"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="3"
              color="gray"
              highContrast
              className="w-100 mb-4"
              loading={submitting}
              disabled={!canSubmit}
            >
              Save new password
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                color="gray"
                size="1"
                onClick={() => logout()}
              >
                Sign out
              </Button>
            </div>
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
            <strong className="me-auto">Set a new password</strong>
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
