'use client';

import { FormEvent, useId, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, TextField } from '@/components/ui';
import AcentriaLogo from '@/components/common/AcentriaLogo';
import AuthShowcasePanel from '@/components/auth/AuthShowcasePanel';
import { PageTitle } from '@/components/common/PageTitle';

const ALLOWED_EMAIL_DOMAIN = 'acentriagroup.com';
const SSO_REDIRECT_URL = '/api/auth/sso/entra';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;

const FIELD_HEIGHT_STYLE = {
  '--text-field-height': 'calc(2.25rem + 2px)'
} as CSSProperties;

const MESSAGES = {
  invalidFormat: 'Enter a valid email address.',
  domainNotAllowed: `Only @${ALLOWED_EMAIL_DOMAIN} accounts can use single sign-on.`
} as const;

function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > MAX_EMAIL_LENGTH) return false;
  const localPart = value.split('@')[0];
  if (!localPart || localPart.length > MAX_LOCAL_PART_LENGTH) return false;
  return EMAIL_PATTERN.test(value);
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

export default function SsoPage() {
  const router = useRouter();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      event.preventDefault();
      setError(MESSAGES.invalidFormat);
      return;
    }

    const domain = trimmed.split('@')[1];
    if (domain !== ALLOWED_EMAIL_DOMAIN) {
      event.preventDefault();
      setError(MESSAGES.domainNotAllowed);
      return;
    }

    setSubmitting(true);
  }

  return (
    <div className="d-flex min-vh-100 overflow-hidden">
      <PageTitle title="Single Sign-On" />
      <div
        className="d-flex flex-column justify-content-center position-relative auth-panel flex-grow-1"
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
            <h1 className="h3 fw-bold mb-1">Sign in with SSO</h1>
            <p className="text-700 mb-0">
              Enter your organisation email to continue with Microsoft Entra ID.
            </p>
          </div>

          <form
            action={SSO_REDIRECT_URL}
            method="get"
            onSubmit={handleSubmit}
            noValidate
          >
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

            <input
              type="hidden"
              name="email"
              value={email.trim().toLowerCase()}
            />

            <div className="mb-4">
              <TextField
                id="email"
                label="Work email"
                style={FIELD_HEIGHT_STYLE}
                type="email"
                inputMode="email"
                placeholder={`name@${ALLOWED_EMAIL_DOMAIN}`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                spellCheck={false}
                maxLength={MAX_EMAIL_LENGTH}
                helpText={`Only @${ALLOWED_EMAIL_DOMAIN} accounts are permitted.`}
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
              Continue
            </Button>
          </form>

          <div className="text-center mb-4">
            <button
              type="button"
              className="btn btn-link p-0 fs--1 fw-semi-bold"
              onClick={() => router.push('/auth/login')}
            >
              Back to sign in
            </button>
          </div>

          <ComplianceFooter />
        </main>

        <HalftoneDots className="bottom-0 start-0" />
      </div>

      <AuthShowcasePanel />
    </div>
  );
}
