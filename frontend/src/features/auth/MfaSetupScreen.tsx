'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import AcentriaLogo from '@/components/common/AcentriaLogo';
import AuthShowcasePanel from '@/components/auth/AuthShowcasePanel';
import { PageTitle } from '@/components/common/PageTitle';
import { useBeginMfaSetupMutation } from './__generated__/queries.generated';
import { MfaEnrollForm } from './MfaEnrollForm';
import { RecoveryCodesGrid } from './RecoveryCodesGrid';
import { useAuth } from './AuthContext';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

function ComplianceFooter() {
  return (
    <footer className="border-top pt-3 d-flex flex-wrap gap-2 column-gap-3 fs--2 text-600">
      <span>Set up multi-factor authentication</span>
      <span className="ms-auto">v{APP_VERSION}</span>
    </footer>
  );
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

      <MfaEnrollForm
        secret={secret}
        provisioningUri={provisioningUri}
        onEnrolled={onEnrolled}
      />
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

      <div className="mb-3">
        <RecoveryCodesGrid codes={codes} />
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
