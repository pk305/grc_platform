'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Text, TextField } from '@/components/ui';
import AcentriaLogo from '@/components/common/AcentriaLogo';
import AuthShowcasePanel from '@/components/auth/AuthShowcasePanel';
import { PageTitle } from '@/components/common/PageTitle';
import {
  useBeginMfaSetupMutation,
  useConfirmMfaSetupMutation
} from './__generated__/queries.generated';
import { useAuth } from './AuthContext';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

const MESSAGES = {
  codeRequired: 'Enter the 6-digit code from your authenticator app.',
  unavailable: 'Something went wrong. Please try again.'
} as const;

function ComplianceFooter() {
  return (
    <footer className="border-top pt-3 d-flex flex-wrap gap-2 column-gap-3 fs--2 text-600">
      <span>Set up multi-factor authentication</span>
      <span className="ms-auto">v{APP_VERSION}</span>
    </footer>
  );
}

function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

function EnrollStep({
  secret,
  provisioningUri,
  onEnrolled
}: {
  secret: string;
  provisioningUri: string;
  onEnrolled: (recoveryCodes: string[]) => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorToastRef = useRef<HTMLDivElement>(null);

  const [confirmMfaSetup] = useConfirmMfaSetupMutation();

  useEffect(() => {
    let cancelled = false;
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(provisioningUri, { width: 220, margin: 1 }).then(url => {
        if (!cancelled) setQrDataUrl(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [provisioningUri]);

  async function submitCode(value: string) {
    setError(null);
    if (!value.trim()) {
      setError(MESSAGES.codeRequired);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await confirmMfaSetup({
        variables: { code: value.trim() }
      });
      const result = data?.confirmMfaSetup;
      if (result?.__typename === 'OperationInfo') {
        setError(result.messages.map(m => m.message).join(' '));
        return;
      }
      if (result?.__typename === 'MfaConfirmedType') {
        onEnrolled(result.recoveryCodes);
      }
    } catch {
      if (errorToastRef.current) {
        const { Toast } = await import('bootstrap');
        Toast.getOrCreateInstance(errorToastRef.current).show();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitCode(code);
  }

  function handleCodeChange(value: string) {
    setCode(value);
    if (error) setError(null);
    if (/^\d{6}$/.test(value.trim())) {
      submitCode(value);
    }
  }

  return (
    <>
      <div className="mb-3">
        <h1 className="h3 fw-bold mb-1">Set up multi-factor authentication</h1>
        <p className="text-700 mb-0">
          Your account requires MFA. Scan the QR code with an authenticator app
          (Google Authenticator, 1Password, Microsoft Authenticator), then enter
          the 6-digit code it shows.
        </p>
      </div>

      <div className="d-flex justify-content-center mb-3">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="MFA enrollment QR code"
            width={220}
            height={220}
          />
        ) : (
          <div style={{ width: 220, height: 220 }} className="bg-200 rounded" />
        )}
      </div>

      <div className="mb-3 text-center">
        <Text size="1" color="gray">
          Can&apos;t scan it? Enter this key manually:
        </Text>
        <div
          className="fs--1 fw-semi-bold mt-1"
          style={{
            fontFamily: 'var(--code-font-family, monospace)',
            letterSpacing: '0.05em'
          }}
        >
          {formatSecret(secret)}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <TextField
            id="mfa-setup-code"
            name="mfaSetupCode"
            label="6-digit code"
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={e => handleCodeChange(e.target.value)}
            autoComplete="one-time-code"
            autoFocus
            error={error}
            required
          />
        </div>

        <Button
          type="submit"
          size="3"
          color="gray"
          highContrast
          className="w-100"
          loading={submitting}
        >
          Verify and enable MFA
        </Button>
      </form>

      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 5 }}>
        <div
          ref={errorToastRef}
          className="toast"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <strong className="me-auto">MFA setup</strong>
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
    </>
  );
}

function RecoveryCodesStep({
  codes,
  onContinue
}: {
  codes: string[];
  onContinue: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <>
      <div className="mb-3">
        <h1 className="h3 fw-bold mb-1">Save your recovery codes</h1>
        <p className="text-700 mb-0">
          Each code can be used once to sign in if you lose access to your
          authenticator app. Store them somewhere safe — they won&apos;t be
          shown again.
        </p>
      </div>

      <div className="bg-100 rounded p-3 mb-3">
        <div className="row row-cols-2 g-2">
          {codes.map(code => (
            <div key={code} className="col">
              <Text
                size="2"
                style={{ fontFamily: 'var(--code-font-family, monospace)' }}
              >
                {code}
              </Text>
            </div>
          ))}
        </div>
      </div>

      <div className="form-check mb-4">
        <input
          id="ack-recovery-codes"
          className="form-check-input"
          type="checkbox"
          checked={acknowledged}
          onChange={e => setAcknowledged(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="ack-recovery-codes">
          I&apos;ve saved these recovery codes somewhere safe
        </label>
      </div>

      <Button
        type="button"
        size="3"
        color="gray"
        highContrast
        className="w-100"
        disabled={!acknowledged}
        onClick={onContinue}
      >
        Continue
      </Button>
    </>
  );
}

export default function MfaSetupScreen() {
  const router = useRouter();
  const { refreshUser, logout } = useAuth();
  const [beginMfaSetup] = useBeginMfaSetupMutation();

  const [setup, setSetup] = useState<{
    secret: string;
    provisioningUri: string;
  } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    beginMfaSetup().then(({ data }) => {
      if (cancelled) return;
      const result = data?.beginMfaSetup;
      if (result?.__typename === 'MfaSetupType') {
        setSetup({
          secret: result.secret,
          provisioningUri: result.provisioningUri
        });
      } else if (result?.__typename === 'OperationInfo') {
        setLoadError(result.messages.map(m => m.message).join(' '));
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleContinue() {
    await refreshUser();
    router.push('/');
  }

  return (
    <div className="d-flex min-vh-100 overflow-hidden">
      <PageTitle title="Set Up Multi-Factor Authentication" />
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

          {loadError ? (
            <div className="alert alert-danger py-2" role="alert">
              {loadError}
            </div>
          ) : recoveryCodes ? (
            <RecoveryCodesStep
              codes={recoveryCodes}
              onContinue={handleContinue}
            />
          ) : setup ? (
            <EnrollStep
              secret={setup.secret}
              provisioningUri={setup.provisioningUri}
              onEnrolled={setRecoveryCodes}
            />
          ) : (
            <div className="text-center py-5">
              <span
                className="spinner-border spinner-border-sm"
                aria-hidden="true"
              />
            </div>
          )}

          <div className="text-center mt-3">
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

          <ComplianceFooter />
        </main>
      </div>

      <AuthShowcasePanel />
    </div>
  );
}
