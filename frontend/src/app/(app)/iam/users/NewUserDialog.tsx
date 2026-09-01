'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Callout,
  Checkbox,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Select,
  Text,
  TextField
} from '@radix-ui/themes';
import {
  useIamCreateUserMutation,
  useIamUsernameAvailableQuery
} from '@/features/iam/__generated__/queries.generated';
import { roleLabel } from '@/lib/iam-roles';
import { useToast } from '@/components/common/Toast';
import { generateTemporaryPassword } from '@/lib/password';
import type { IamRoleRow } from './ManageUserDialog';

export interface NewUserDialogProps {
  roles: IamRoleRow[];
  onCreated: () => void;
}

export function NewUserDialog({ roles, onCreated }: NewUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [roleName, setRoleName] = useState('');
  const [requireMfa, setRequireMfa] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState('');

  const [createUser, { loading }] = useIamCreateUserMutation();
  const showToast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.trim()), 400);
    return () => clearTimeout(timer);
  }, [username]);

  const trimmedUsername = username.trim();
  const isEmailShapedUsername = trimmedUsername.includes('@');
  const { data: usernameCheckData, loading: checkingUsername } =
    useIamUsernameAvailableQuery({
      variables: { username: debouncedUsername },
      skip: !debouncedUsername || isEmailShapedUsername,
      fetchPolicy: 'network-only'
    });

  const usernameStatus:
    'idle' | 'invalid' | 'checking' | 'available' | 'taken' = !trimmedUsername
    ? 'idle'
    : isEmailShapedUsername
      ? 'invalid'
      : debouncedUsername !== trimmedUsername || checkingUsername
        ? 'checking'
        : usernameCheckData?.usernameAvailable === false
          ? 'taken'
          : usernameCheckData?.usernameAvailable === true
            ? 'available'
            : 'idle';

  function reset() {
    setEmail('');
    setUsername('');
    setDebouncedUsername('');
    setPassword('');
    setShowPassword(false);
    setFirstName('');
    setLastName('');
    setDepartment('');
    setRoleName('');
    setRequireMfa(false);
    setSendWelcomeEmail(false);
    setError(null);
  }

  async function handleCopyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      showToast('Password copied to clipboard.', 'success');
    } catch {
      setError('Could not copy the password to the clipboard.');
    }
  }

  async function handleSubmit() {
    if (!email.trim() || !username.trim() || !password || !roleName) {
      setError('Email, username, password and role are required.');
      return;
    }
    if (usernameStatus === 'invalid') {
      setError('Username cannot be an email address.');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('That username is already taken.');
      return;
    }
    setError(null);

    const result = await createUser({
      variables: {
        data: {
          email: email.trim(),
          username: username.trim(),
          password,
          roleName,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          department: department.trim(),
          requireMfa,
          sendWelcomeEmail
        }
      },
      refetchQueries: ['IamUsers']
    });

    const payload = result.data?.createUser;
    if (payload && 'messages' in payload) {
      setError(payload.messages.map(m => m.message).join(' '));
      return;
    }

    setOpen(false);
    reset();
    onCreated();
    showToast(`${email.trim()} was created.`, 'success');
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (next) {
          setPassword(generateTemporaryPassword());
        } else {
          reset();
        }
      }}
    >
      <Dialog.Trigger>
        <Button>New user</Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>New user</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Create a local account. The user must change this password at first
          sign-in, and access is scheduled for review in 90 days.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Grid columns="2" gap="2">
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                First name
              </Text>
              <TextField.Root
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </label>
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Last name
              </Text>
              <TextField.Root
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </label>
          </Grid>

          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Email *
            </Text>
            <TextField.Root
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane.doe@example.com"
            />
          </label>

          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Username *
            </Text>
            <TextField.Root
              value={username}
              onChange={e => setUsername(e.target.value)}
              color={
                usernameStatus === 'taken' || usernameStatus === 'invalid'
                  ? 'red'
                  : undefined
              }
            />
            {usernameStatus === 'invalid' && (
              <Text as="p" size="1" color="red" mt="1">
                <span
                  className="fas fa-exclamation-circle"
                  aria-hidden="true"
                />{' '}
                Username cannot be an email address
              </Text>
            )}
            {usernameStatus === 'checking' && (
              <Text as="p" size="1" color="gray" mt="1">
                Checking availability…
              </Text>
            )}
            {usernameStatus === 'available' && (
              <Text as="p" size="1" color="green" mt="1">
                <span className="fas fa-check-circle" aria-hidden="true" />{' '}
                Username is available
              </Text>
            )}
            {usernameStatus === 'taken' && (
              <Text as="p" size="1" color="red" mt="1">
                <span
                  className="fas fa-exclamation-circle"
                  aria-hidden="true"
                />{' '}
                Username is already taken
              </Text>
            )}
          </label>

          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Department
            </Text>
            <TextField.Root
              value={department}
              onChange={e => setDepartment(e.target.value)}
            />
          </label>

          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Temporary password *
            </Text>
            <Flex gap="2">
              <TextField.Root
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ flex: 1, fontFamily: 'var(--code-font-family)' }}
              />
              <IconButton
                type="button"
                variant="soft"
                color="gray"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
              >
                <span
                  className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}
                  aria-hidden="true"
                />
              </IconButton>
              <IconButton
                type="button"
                variant="soft"
                color="gray"
                aria-label="Copy password"
                onClick={handleCopyPassword}
              >
                <span className="fas fa-copy" aria-hidden="true" />
              </IconButton>
              <IconButton
                type="button"
                variant="soft"
                color="gray"
                aria-label="Generate a new password"
                onClick={() => setPassword(generateTemporaryPassword())}
              >
                <span className="fas fa-sync-alt" aria-hidden="true" />
              </IconButton>
            </Flex>
          </label>

          <Text as="label" size="2">
            <Flex align="center" gap="2">
              <Checkbox
                checked={requireMfa}
                onCheckedChange={checked => setRequireMfa(checked === true)}
              />
              Require MFA setup at first sign-in
            </Flex>
          </Text>

          <Text as="label" size="2">
            <Flex align="center" gap="2">
              <Checkbox
                checked={sendWelcomeEmail}
                onCheckedChange={checked =>
                  setSendWelcomeEmail(checked === true)
                }
              />
              Email the temporary password to the user
            </Flex>
          </Text>

          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Role *
            </Text>
            <Select.Root value={roleName} onValueChange={setRoleName}>
              <Select.Trigger
                placeholder="Choose a role"
                style={{ width: '100%' }}
              />
              <Select.Content>
                {roles.map(role => (
                  <Select.Item key={role.id} value={role.name}>
                    {roleLabel(role.name)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </label>

          {error && (
            <Callout.Root color="amber" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={
              usernameStatus === 'taken' ||
              usernameStatus === 'invalid' ||
              usernameStatus === 'checking'
            }
          >
            Create user
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
