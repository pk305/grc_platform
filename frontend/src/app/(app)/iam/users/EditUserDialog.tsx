'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Callout,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Text,
  TextField
} from '@radix-ui/themes';
import {
  useIamUpdateUserMutation,
  useIamUsernameAvailableQuery
} from '@/features/iam/__generated__/queries.generated';
import type { IamUserRow } from './ManageUserDialog';

export interface EditUserDialogProps {
  user: IamUserRow;
  onChanged: () => void;
}

export function EditUserDialog({ user, onChanged }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [department, setDepartment] = useState(user.department ?? '');
  const [error, setError] = useState<string | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState(user.username);

  const [updateUser, { loading }] = useIamUpdateUserMutation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username.trim()), 400);
    return () => clearTimeout(timer);
  }, [username]);

  const trimmedUsername = username.trim();
  const isEmailShapedUsername = trimmedUsername.includes('@');
  const usernameUnchanged = trimmedUsername === user.username;
  const { data: usernameCheckData, loading: checkingUsername } =
    useIamUsernameAvailableQuery({
      variables: { username: debouncedUsername },
      skip: !debouncedUsername || isEmailShapedUsername || usernameUnchanged,
      fetchPolicy: 'network-only'
    });

  const usernameStatus:
    'idle' | 'invalid' | 'checking' | 'available' | 'taken' = !trimmedUsername
    ? 'idle'
    : usernameUnchanged
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
    setEmail(user.email);
    setUsername(user.username);
    setDebouncedUsername(user.username);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setDepartment(user.department ?? '');
    setError(null);
  }

  async function handleSubmit() {
    if (!email.trim() || !username.trim()) {
      setError('Email and username are required.');
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

    const result = await updateUser({
      variables: {
        userId: user.id,
        data: {
          email: email.trim(),
          username: username.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          department: department.trim()
        }
      },
      refetchQueries: ['IamUsers']
    });

    const payload = result.data?.updateUser;
    if (payload && 'messages' in payload) {
      setError(payload.messages.map(m => m.message).join(' '));
      return;
    }

    setOpen(false);
    onChanged();
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
        <IconButton variant="soft" color="gray" size="1" aria-label="Edit user">
          <span className="fas fa-pen" aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Edit user</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          {user.email}
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
            Save
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
