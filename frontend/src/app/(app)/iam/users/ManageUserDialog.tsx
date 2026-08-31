'use client';

import { useState } from 'react';
import {
  AlertDialog,
  Button,
  Callout,
  Dialog,
  Flex,
  IconButton,
  Switch,
  Text
} from '@radix-ui/themes';
import {
  useIamAdminResetMfaMutation,
  useIamAssignRoleMutation,
  useIamDeleteUserMutation,
  useIamRevokeRoleMutation,
  useIamSetMfaRequiredMutation,
  useIamSetUserActiveMutation
} from '@/features/iam/__generated__/queries.generated';
import type {
  IamRolesQuery,
  IamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import { roleLabel } from '@/lib/iam-roles';

export type IamUserRow = IamUsersQuery['users'][number];
export type IamRoleRow = IamRolesQuery['roles'][number];

export interface ManageUserDialogProps {
  user: IamUserRow;
  roles: IamRoleRow[];
  currentUserId: string | null;
  onChanged: () => void;
}

export function ManageUserDialog({
  user,
  roles,
  currentUserId,
  onChanged
}: ManageUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSelf = user.id === currentUserId;

  const [setUserActive] = useIamSetUserActiveMutation();
  const [assignRole] = useIamAssignRoleMutation();
  const [revokeRole] = useIamRevokeRoleMutation();
  const [deleteUser, { loading: deleting }] = useIamDeleteUserMutation();
  const [setMfaRequired] = useIamSetMfaRequiredMutation();
  const [adminResetMfa, { loading: resettingMfa }] =
    useIamAdminResetMfaMutation();

  const heldRoleNames = new Set(user.roles.map(role => role.name));

  async function toggleActive(next: boolean) {
    setError(null);
    const result = await setUserActive({
      variables: { userId: user.id, isActive: next },
      refetchQueries: ['IamUsers']
    });
    const payload = result.data?.setUserActive;
    if (payload && 'messages' in payload) {
      setError(payload.messages.map(m => m.message).join(' '));
      return;
    }
    onChanged();
  }

  async function toggleRole(roleName: string, held: boolean) {
    setError(null);
    if (held) {
      const result = await revokeRole({
        variables: { data: { userId: user.id, roleName } },
        refetchQueries: ['IamUsers']
      });
      const payload = result.data?.revokeRole;
      if (payload && 'message' in payload) {
        setError(payload.message);
        return;
      }
    } else {
      const result = await assignRole({
        variables: { data: { userId: user.id, roleName } },
        refetchQueries: ['IamUsers']
      });
      const payload = result.data?.assignRole;
      if (payload && 'message' in payload) {
        setError(payload.message);
        return;
      }
    }
    onChanged();
  }

  async function toggleMfaRequired(next: boolean) {
    setError(null);
    const result = await setMfaRequired({
      variables: { userId: user.id, required: next },
      refetchQueries: ['IamUsers']
    });
    const payload = result.data?.setMfaRequired;
    if (payload && 'messages' in payload) {
      setError(payload.messages.map(m => m.message).join(' '));
      return;
    }
    onChanged();
  }

  async function handleResetMfa() {
    setError(null);
    const result = await adminResetMfa({
      variables: { userId: user.id },
      refetchQueries: ['IamUsers']
    });
    const payload = result.data?.adminResetMfa;
    if (payload && 'messages' in payload) {
      setError(payload.messages.map(m => m.message).join(' '));
      return;
    }
    onChanged();
  }

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

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton
          variant="soft"
          color="gray"
          size="1"
          aria-label="Manage user"
        >
          <span className="fas fa-user-cog" aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="440px">
        <Dialog.Title>
          {user.firstName} {user.lastName}
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          {user.email}
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <Text as="label" size="2" color={isSelf ? 'gray' : undefined}>
            <Flex align="center" gap="2">
              <Switch
                checked={user.isActive}
                onCheckedChange={toggleActive}
                disabled={isSelf}
                size="1"
              />
              Active account
              {isSelf && (
                <Text size="1" color="gray">
                  (you can&apos;t deactivate your own account)
                </Text>
              )}
            </Flex>
          </Text>

          <Flex direction="column" gap="2">
            <Text size="2" weight="medium">
              Roles
            </Text>
            {roles.map(role => (
              <Text as="label" size="2" key={role.id}>
                <Flex align="center" gap="2">
                  <Switch
                    checked={heldRoleNames.has(role.name)}
                    onCheckedChange={() =>
                      toggleRole(role.name, heldRoleNames.has(role.name))
                    }
                    size="1"
                  />
                  {roleLabel(role.name)}
                </Flex>
              </Text>
            ))}
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" weight="medium">
              Multi-factor authentication
            </Text>
            {user.mfaEnabled ? (
              <Flex align="center" gap="2" wrap="wrap">
                <Text size="2" color="green">
                  Enabled
                </Text>
                <AlertDialog.Root>
                  <AlertDialog.Trigger>
                    <Button variant="soft" color="red" size="1">
                      Reset MFA
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Content maxWidth="420px">
                    <AlertDialog.Title>
                      Reset MFA for {user.email}?
                    </AlertDialog.Title>
                    <AlertDialog.Description size="2">
                      This clears their authenticator enrollment and recovery
                      codes. Use this if they&apos;ve lost their device — they
                      will need to set up MFA again at next sign-in.
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
                          onClick={handleResetMfa}
                          loading={resettingMfa}
                        >
                          Reset MFA
                        </Button>
                      </AlertDialog.Action>
                    </Flex>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              </Flex>
            ) : (
              <Text as="label" size="2">
                <Flex align="center" gap="2">
                  <Switch
                    checked={user.mfaRequired}
                    onCheckedChange={toggleMfaRequired}
                    size="1"
                  />
                  Require MFA setup at next sign-in
                </Flex>
              </Text>
            )}
          </Flex>

          {error && (
            <Callout.Root color="amber" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>

        <Flex gap="3" mt="5" justify="between">
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button variant="soft" color="red" disabled={isSelf}>
                <span className="fas fa-trash-alt" aria-hidden="true" />
                Delete user
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="420px">
              <AlertDialog.Title>Delete {user.email}?</AlertDialog.Title>
              <AlertDialog.Description size="2">
                This permanently removes the account. This cannot be undone.
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

          <Dialog.Close>
            <Button variant="soft" color="gray">
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
