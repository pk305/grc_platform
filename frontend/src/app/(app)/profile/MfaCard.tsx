'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Badge,
  Button,
  Callout,
  Dialog,
  Flex,
  Text,
  TextField
} from '@radix-ui/themes';
import {
  useBeginMfaSetupMutation,
  useDisableMfaMutation
} from '@/features/auth/__generated__/queries.generated';
import { SectionCard } from '@/components/common/SectionCard';
import { useRegenerateMfaRecoveryCodesMutation } from '@/features/profile/__generated__/queries.generated';
import { MfaEnrollForm } from '@/features/auth/MfaEnrollForm';
import { RecoveryCodesGrid } from '@/features/auth/RecoveryCodesGrid';
import type { ProfileUser } from './types';

const REFETCH = ['MyProfile', 'Me', 'MyAuditEvents'];

/** Warning threshold — below this, recovery codes should be reissued. */
const LOW_RECOVERY_CODES = 3;

function EnableMfaDialog({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [setup, setSetup] = useState<{
    secret: string;
    provisioningUri: string;
  } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [beginMfaSetup, { loading }] = useBeginMfaSetupMutation();

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSetup(null);
      setCodes(null);
      setError(null);
      return;
    }

    const { data } = await beginMfaSetup();
    const result = data?.beginMfaSetup;
    if (result?.__typename === 'MfaSetupType') {
      setSetup({
        secret: result.secret,
        provisioningUri: result.provisioningUri
      });
    } else if (result?.__typename === 'OperationInfo') {
      setError(result.messages.map(m => m.message).join(' '));
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <Button>Set up authenticator app</Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="420px">
        <Dialog.Title>
          {codes
            ? 'Save your recovery codes'
            : 'Set up multi-factor authentication'}
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          {codes
            ? 'Each code can be used once if you lose your authenticator app. They will not be shown again.'
            : 'Scan the QR code with an authenticator app, then enter the 6-digit code it shows.'}
        </Dialog.Description>

        {error && (
          <Callout.Root color="amber" size="1" mb="3">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {codes ? (
          <>
            <RecoveryCodesGrid codes={codes} />
            <Flex justify="end" mt="4">
              <Button
                onClick={() => {
                  handleOpenChange(false);
                  onChanged();
                }}
              >
                Done
              </Button>
            </Flex>
          </>
        ) : setup ? (
          <MfaEnrollForm
            secret={setup.secret}
            provisioningUri={setup.provisioningUri}
            onEnrolled={setCodes}
            idPrefix="profile-mfa"
          />
        ) : (
          !error && (
            <Flex justify="center" py="5">
              <Button loading={loading} variant="ghost" disabled>
                Preparing enrollment
              </Button>
            </Flex>
          )
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

function RegenerateCodesDialog({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [regenerate, { loading }] = useRegenerateMfaRecoveryCodesMutation();

  function reset() {
    setPassword('');
    setCodes(null);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    const { data } = await regenerate({
      variables: { password },
      refetchQueries: REFETCH
    });
    const result = data?.regenerateMfaRecoveryCodes;
    if (result?.__typename === 'OperationInfo') {
      setError(result.messages.map(m => m.message).join(' '));
      return;
    }
    if (result?.__typename === 'MfaRecoveryCodesType') {
      setPassword('');
      setCodes(result.recoveryCodes);
      onChanged();
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Dialog.Trigger>
        <Button variant="soft" color="gray">
          Regenerate recovery codes
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="420px">
        <Dialog.Title>Regenerate recovery codes</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          {codes
            ? 'These replace your previous codes, which no longer work.'
            : 'A new set replaces your existing codes immediately. Confirm your password to continue.'}
        </Dialog.Description>

        {codes ? (
          <>
            <RecoveryCodesGrid codes={codes} />
            <Flex justify="end" mt="4">
              <Dialog.Close>
                <Button>Done</Button>
              </Dialog.Close>
            </Flex>
          </>
        ) : (
          <>
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Current password
              </Text>
              <TextField.Root
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            {error && (
              <Callout.Root color="amber" size="1" mt="3">
                <Callout.Text>{error}</Callout.Text>
              </Callout.Root>
            )}

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={!password}
              >
                Generate new codes
              </Button>
            </Flex>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

function DisableMfaDialog({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [disableMfa, { loading }] = useDisableMfaMutation();

  async function handleSubmit() {
    setError(null);
    const { data } = await disableMfa({
      variables: { password },
      refetchQueries: REFETCH
    });
    const result = data?.disableMfa;
    if (result?.__typename === 'OperationInfo') {
      setError(result.messages.map(m => m.message).join(' '));
      return;
    }
    setPassword('');
    setOpen(false);
    onChanged();
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) {
          setPassword('');
          setError(null);
        }
      }}
    >
      <AlertDialog.Trigger>
        <Button variant="soft" color="red">
          Turn off MFA
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>
          Turn off multi-factor authentication
        </AlertDialog.Title>
        <AlertDialog.Description size="2" mb="4">
          Your account will be protected by your password alone, and your
          recovery codes will be destroyed. This is recorded in the audit log.
        </AlertDialog.Description>

        <label>
          <Text as="div" size="2" weight="medium" mb="1">
            Current password
          </Text>
          <TextField.Root
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && (
          <Callout.Root color="amber" size="1" mt="3">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <Button
            color="red"
            onClick={handleSubmit}
            loading={loading}
            disabled={!password}
          >
            Turn off MFA
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

/**
 * Multi-factor authentication (A.8.5 — secure authentication). Enrollment,
 * recovery codes and removal all re-verify the account holder and are written
 * to the audit trail.
 */
export function MfaCard({
  user,
  onChanged
}: {
  user: ProfileUser;
  onChanged: () => void;
}) {
  const codesLeft = user.mfaRecoveryCodesRemaining;

  return (
    <SectionCard
      title="Multi-factor authentication"
      description="A second factor from an authenticator app, on top of your password."
      action={
        <Badge color={user.mfaEnabled ? 'green' : 'amber'} variant="soft">
          {user.mfaEnabled ? 'Enabled' : 'Not enabled'}
        </Badge>
      }
    >
      {!user.mfaEnabled && user.mfaRequired && (
        <Callout.Root color="amber" size="1" mb="3">
          <Callout.Text>
            Your administrator requires MFA on this account. You will be asked
            to enrol at your next sign-in.
          </Callout.Text>
        </Callout.Root>
      )}

      {user.mfaEnabled && codesLeft <= LOW_RECOVERY_CODES && (
        <Callout.Root color={codesLeft === 0 ? 'red' : 'amber'} size="1" mb="3">
          <Callout.Text>
            {codesLeft === 0
              ? 'You have no recovery codes left. Generate a new set so you can still sign in if you lose your authenticator app.'
              : `Only ${codesLeft} recovery code${codesLeft === 1 ? '' : 's'} left.`}
          </Callout.Text>
        </Callout.Root>
      )}

      <Flex direction="column" gap="3">
        <Text size="2" color="gray">
          {user.mfaEnabled
            ? `Authenticator app enrolled · ${codesLeft} unused recovery code${codesLeft === 1 ? '' : 's'}.`
            : 'Add an authenticator app to protect your account if your password is ever exposed.'}
        </Text>

        <Flex gap="3" wrap="wrap">
          {user.mfaEnabled ? (
            <>
              <RegenerateCodesDialog onChanged={onChanged} />
              {!user.mfaRequired && <DisableMfaDialog onChanged={onChanged} />}
            </>
          ) : (
            <EnableMfaDialog onChanged={onChanged} />
          )}
        </Flex>

        {user.mfaEnabled && user.mfaRequired && (
          <Text size="1" color="gray">
            MFA is required on this account by your administrator, so it
            can&apos;t be turned off here.
          </Text>
        )}
      </Flex>
    </SectionCard>
  );
}
