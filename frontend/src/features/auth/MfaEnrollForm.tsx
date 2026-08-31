'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button, Text, TextField } from '@/components/ui';
import { useConfirmMfaSetupMutation } from './__generated__/queries.generated';

const MESSAGES = {
  codeRequired: 'Enter the 6-digit code from your authenticator app.',
  unavailable: 'Something went wrong. Please try again.'
} as const;

function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

export interface MfaEnrollFormProps {
  /** TOTP secret from `beginMfaSetup`, shown for manual entry. */
  secret: string;
  /** otpauth:// URI from `beginMfaSetup`, rendered as the QR code. */
  provisioningUri: string;
  /** Called with the one-time recovery codes once the code verifies. */
  onEnrolled: (recoveryCodes: string[]) => void;
  /** Prefix for the field id, so two forms can coexist on a page. */
  idPrefix?: string;
}

/**
 * TOTP enrollment: QR code, manual key, and the confirmation code field.
 * Shared by the forced-enrollment screen and self-service setup on the
 * profile page so both drive the same verified flow (A.8.5).
 */
export function MfaEnrollForm({
  secret,
  provisioningUri,
  onEnrolled,
  idPrefix = 'mfa-setup'
}: MfaEnrollFormProps) {
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
            id={`${idPrefix}-code`}
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
