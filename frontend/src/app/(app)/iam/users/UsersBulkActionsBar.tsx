'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Button,
  Callout,
  Flex,
  Popover,
  Select,
  Text
} from '@radix-ui/themes';
import {
  useIamAssignRoleMutation,
  useIamDeleteUserMutation,
  useIamSetUserActiveMutation,
  useIamStartAccessReviewMutation
} from '@/features/iam/__generated__/queries.generated';
import { roleLabel } from '@/lib/iam-roles';
import type { IamRoleRow, IamUserRow } from './ManageUserDialog';

export interface UsersBulkActionsBarProps {
  selectedUsers: IamUserRow[];
  roles: IamRoleRow[];
  currentUserId: string | null;
  isSuperuser: boolean;
  clearSelection: () => void;
  onChanged: () => void;
}

function pluralUsers(count: number): string {
  return count === 1 ? 'user' : 'users';
}

export function UsersBulkActionsBar({
  selectedUsers,
  roles,
  currentUserId,
  isSuperuser,
  clearSelection,
  onChanged
}: UsersBulkActionsBarProps) {
  const [assignRole, { loading: assigning }] = useIamAssignRoleMutation();
  const [setUserActive, { loading: deactivating }] =
    useIamSetUserActiveMutation();
  const [startAccessReview, { loading: startingReview }] =
    useIamStartAccessReviewMutation();
  const [deleteUser, { loading: deleting }] = useIamDeleteUserMutation();
  const [roleToAssign, setRoleToAssign] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Never let a bulk action deactivate or delete the account that's
  // performing it — that would lock the admin out mid-operation.
  const removableUsers = selectedUsers.filter(
    user => user.id !== currentUserId
  );
  const selfSelected = removableUsers.length < selectedUsers.length;

  async function handleAssignRole() {
    if (!roleToAssign) return;
    await Promise.all(
      selectedUsers.map(user =>
        assignRole({
          variables: { data: { userId: user.id, roleName: roleToAssign } }
        })
      )
    );
    setAssignOpen(false);
    setRoleToAssign('');
    clearSelection();
    onChanged();
  }

  async function handleStartAccessReview() {
    await startAccessReview({
      variables: { userIds: selectedUsers.map(user => user.id) }
    });
    clearSelection();
    onChanged();
  }

  async function handleDeactivate() {
    setError(null);
    const results = await Promise.all(
      removableUsers.map(user =>
        setUserActive({ variables: { userId: user.id, isActive: false } })
      )
    );
    const messages = results.flatMap(result => {
      const payload = result.data?.setUserActive;
      return payload && 'messages' in payload
        ? payload.messages.map(m => m.message)
        : [];
    });
    if (messages.length > 0) {
      setError(messages.join(' '));
      onChanged();
      return;
    }
    clearSelection();
    onChanged();
  }

  async function handleDelete() {
    setError(null);
    const results = await Promise.all(
      removableUsers.map(user => deleteUser({ variables: { userId: user.id } }))
    );
    const messages = results.flatMap(result => {
      const payload = result.data?.deleteUser;
      return payload && 'messages' in payload
        ? payload.messages.map(m => m.message)
        : [];
    });
    if (messages.length > 0) {
      setError(messages.join(' '));
      onChanged();
      return;
    }
    clearSelection();
    onChanged();
  }

  return (
    <Flex direction="column" gap="2">
      {error && (
        <Callout.Root color="amber" size="1">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      <Flex align="center" gap="3" wrap="wrap">
        <Popover.Root open={assignOpen} onOpenChange={setAssignOpen}>
          <Popover.Trigger>
            <Button variant="soft" size="2">
              Assign role
            </Button>
          </Popover.Trigger>
          <Popover.Content maxWidth="260px">
            <Flex direction="column" gap="3">
              <Text size="2" weight="medium">
                Assign a role to {selectedUsers.length}{' '}
                {pluralUsers(selectedUsers.length)}
              </Text>
              <Select.Root value={roleToAssign} onValueChange={setRoleToAssign}>
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
              <Button
                size="2"
                disabled={!roleToAssign}
                loading={assigning}
                onClick={handleAssignRole}
              >
                Apply
              </Button>
            </Flex>
          </Popover.Content>
        </Popover.Root>

        <Button
          variant="soft"
          size="2"
          loading={startingReview}
          onClick={handleStartAccessReview}
        >
          Start access review
        </Button>

        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button
              variant="soft"
              color="red"
              size="2"
              disabled={removableUsers.length === 0}
            >
              Deactivate
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="420px">
            <AlertDialog.Title>
              Deactivate {removableUsers.length}{' '}
              {pluralUsers(removableUsers.length)}?
            </AlertDialog.Title>
            <AlertDialog.Description size="2">
              These accounts will no longer be able to sign in. This can be
              reversed later.
              {selfSelected &&
                ' Your own account was left out of the selection.'}
            </AlertDialog.Description>
            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button
                  color="red"
                  onClick={handleDeactivate}
                  loading={deactivating}
                >
                  Deactivate
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>

        {isSuperuser && (
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button
                variant="soft"
                color="red"
                size="2"
                disabled={removableUsers.length === 0}
              >
                <span className="fas fa-trash-alt" aria-hidden="true" />
                Delete
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="420px">
              <AlertDialog.Title>
                Delete {removableUsers.length}{' '}
                {pluralUsers(removableUsers.length)}?
              </AlertDialog.Title>
              <AlertDialog.Description size="2">
                This permanently removes these accounts. This cannot be undone.
                {selfSelected &&
                  ' Your own account was left out of the selection.'}
              </AlertDialog.Description>
              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button color="red" onClick={handleDelete} loading={deleting}>
                    Delete
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        )}
      </Flex>
    </Flex>
  );
}
