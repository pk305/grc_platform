'use client';

import { FormEvent, KeyboardEvent, useId, useState } from 'react';
import { Box, Button, Callout, Flex, Grid, Text } from '@radix-ui/themes';
import { IconButton, TextField } from '@/components/ui';
import {
  PasswordRequirement,
  PasswordStrengthMeter
} from '@/components/common/PasswordStrength';
import { useChangePasswordMutation } from '@/features/auth/__generated__/queries.generated';
import { MIN_PASSWORD_LENGTH, isCommonPassword } from '@/lib/password';
import { SectionCard } from './SectionCard';
import type { ProfileUser } from './types';

const MESSAGES = {
  fieldsRequired: 'Enter your current password and a new password.',
  mismatch: 'Passwords do not match.',
  notReady: 'Your new password does not meet the requirements below.',
  unavailable: 'Something went wrong. Please try again.'
} as const;

function RevealButton({
  shown,
  onToggle
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <IconButton
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
    >
      <span
        className={shown ? 'far fa-eye-slash' : 'far fa-eye'}
        aria-hidden="true"
      />
    </IconButton>
  );
}

/** Self-service password change (A.5.17 — authentication information). */
export function ChangePasswordCard({ user }: { user: ProfileUser }) {
  const capsHelpId = useId();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [changePassword, { loading }] = useChangePasswordMutation();

  const isFederated = user.authProvider === 'entra_id';
  const lengthOk = newPassword.length >= MIN_PASSWORD_LENGTH;
  const differentFromCurrent =
    newPassword.length > 0 && newPassword !== oldPassword;
  const notCommon = newPassword.length > 0 && !isCommonPassword(newPassword);
  const requirementsMet = lengthOk && differentFromCurrent && notCommon;
  const confirmMatches =
    confirmPassword.length > 0 && confirmPassword === newPassword;

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState('CapsLock'));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(MESSAGES.fieldsRequired);
      return;
    }
    if (!requirementsMet) {
      setError(MESSAGES.notReady);
      return;
    }
    if (!confirmMatches) {
      setError(MESSAGES.mismatch);
      return;
    }

    try {
      const { data } = await changePassword({
        variables: { oldPassword, newPassword },
        refetchQueries: ['MyProfile', 'Me']
      });
      const result = data?.changePassword;
      if (result?.__typename === 'OperationInfo') {
        setError(result.messages.map(m => m.message).join(' '));
        return;
      }
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch {
      setError(MESSAGES.unavailable);
    }
  }

  if (isFederated) {
    return (
      <SectionCard
        title="Password"
        description="How you prove who you are when signing in."
      >
        <Callout.Root color="blue" size="1">
          <Callout.Text>
            You sign in through Microsoft Entra ID, so your password and its
            policy are managed there. Change it from your Microsoft account.
          </Callout.Text>
        </Callout.Root>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Password"
      description="Changing your password signs out your other sessions."
    >
      {user.mustChangePassword && (
        <Callout.Root color="amber" size="1" mb="3">
          <Callout.Text>
            You are signed in with a temporary password. Choose a permanent one
            now.
          </Callout.Text>
        </Callout.Root>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Box mb="3" style={{ maxWidth: 360 }}>
          <TextField
            id="profile-current-password"
            name="currentPassword"
            label="Current password"
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={e => {
              setOldPassword(e.target.value);
              if (error) setError(null);
            }}
            onKeyUp={handlePasswordKey}
            onKeyDown={handlePasswordKey}
            autoComplete="current-password"
            required
            slotEnd={
              <RevealButton
                shown={showOld}
                onToggle={() => setShowOld(s => !s)}
              />
            }
          />
        </Box>

        <Grid columns={{ initial: '1', sm: '2' }} gap="3" mb="2">
          <TextField
            id="profile-new-password"
            name="newPassword"
            label="New password"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={e => {
              setNewPassword(e.target.value);
              if (error) setError(null);
            }}
            autoComplete="new-password"
            aria-describedby={capsLockOn ? capsHelpId : undefined}
            required
            slotEnd={
              <RevealButton
                shown={showNew}
                onToggle={() => setShowNew(s => !s)}
              />
            }
          />
          <TextField
            id="profile-confirm-password"
            name="confirmPassword"
            label="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
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
              <RevealButton
                shown={showConfirm}
                onToggle={() => setShowConfirm(s => !s)}
              />
            }
          />
        </Grid>

        <div id={capsHelpId} className="form-text mb-2" aria-live="polite">
          {capsLockOn && 'Caps lock is on'}
        </div>

        <ul className="list-unstyled mb-2 d-flex flex-column gap-1">
          <PasswordRequirement met={lengthOk}>
            At least {MIN_PASSWORD_LENGTH} characters — a passphrase works well
          </PasswordRequirement>
          <PasswordRequirement met={differentFromCurrent}>
            Different from your current password
          </PasswordRequirement>
          <PasswordRequirement met={notCommon}>
            Not a commonly used password
          </PasswordRequirement>
        </ul>

        <PasswordStrengthMeter value={newPassword} />

        {error && (
          <Callout.Root color="amber" size="1" mb="3">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex align="center" gap="3">
          <Button
            type="submit"
            loading={loading}
            disabled={!oldPassword || !requirementsMet || !confirmMatches}
          >
            Update password
          </Button>
          <Text size="1" color="gray" aria-live="polite">
            {saved ? 'Password updated.' : ''}
          </Text>
        </Flex>
      </form>
    </SectionCard>
  );
}
