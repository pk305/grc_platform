'use client';

import { useState } from 'react';
import {
  Button,
  Callout,
  Dialog,
  Flex,
  Grid,
  Text,
  TextField
} from '@radix-ui/themes';
import { useIamCreateUserMutation } from '@/features/iam/__generated__/queries.generated';

export interface NewUserDialogProps {
  onCreated: () => void;
}

export function NewUserDialog({ onCreated }: NewUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [createUser, { loading }] = useIamCreateUserMutation();

  function reset() {
    setEmail('');
    setUsername('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setError(null);
  }

  async function handleSubmit() {
    if (!email.trim() || !username.trim() || !password) {
      setError('Email, username and password are required.');
      return;
    }
    setError(null);

    const result = await createUser({
      variables: {
        data: {
          email: email.trim(),
          username: username.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim()
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
        <Button>New user</Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>New user</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Create a local account. Roles can be assigned afterwards.
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
            />
          </label>

          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Temporary password *
            </Text>
            <TextField.Root
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
          <Button onClick={handleSubmit} loading={loading}>
            Create user
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
