'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Button,
  Callout,
  Flex,
  IconButton
} from '@radix-ui/themes';
import { useIamDeleteUserMutation } from '@/features/iam/__generated__/queries.generated';
import type { IamUserRow } from './ManageUserDialog';

export interface DeleteUserButtonProps {
  user: IamUserRow;
  currentUserId: string | null;
  onChanged: () => void;
}

export function DeleteUserButton({
  user,
  currentUserId,
  onChanged
}: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteUser, { loading }] = useIamDeleteUserMutation();

  const isSelf = user.id === currentUserId;
  const disabledReason = isSelf
    ? "You can't delete your own account."
    : user.isSuperuser
      ? "Superadmin accounts can't be deleted."
      : null;

  async function handleDelete() {
    setError(null);
    const result = await deleteUser({
      variables: { userId: user.id },
      refetchQueries: ['IamUsers']
    });
    const payload = result.data?.deleteUser;
    if (payload && 'messages' in payload) {
      setError(payload.messages.map(m => m.message).join(' '));
      return;
    }
    setOpen(false);
    onChanged();
  }

  if (disabledReason) {
    return (
      <IconButton
        variant="soft"
        color="gray"
        size="1"
        aria-label="Delete user"
        title={disabledReason}
        disabled
      >
        <span className="fas fa-trash-alt" aria-hidden="true" />
      </IconButton>
    );
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialog.Trigger>
        <IconButton
          variant="soft"
          color="red"
          size="1"
          aria-label="Delete user"
        >
          <span className="fas fa-trash-alt" aria-hidden="true" />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Delete {user.email}?</AlertDialog.Title>
        <AlertDialog.Description size="2">
          This permanently removes the account. This cannot be undone.
        </AlertDialog.Description>
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
          <Button color="red" onClick={handleDelete} loading={loading}>
            Delete
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
