'use client';

import { useState } from 'react';
import { Button, Callout, Dialog, Flex, Text } from '@radix-ui/themes';
import { useIamRevokeRoleMutation } from '@/features/iam/__generated__/queries.generated';
import type { IamUsersQuery } from '@/features/iam/__generated__/queries.generated';

export interface RoleMembersDialogProps {
  roleName: string;
  roleLabel: string;
  members: IamUsersQuery['users'];
  canManage: boolean;
  onChanged: () => void;
}

export function RoleMembersDialog({
  roleName,
  roleLabel,
  members,
  canManage,
  onChanged
}: RoleMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeRole, { loading }] = useIamRevokeRoleMutation();

  async function handleRevoke(userId: string) {
    setError(null);
    const result = await revokeRole({
      variables: { data: { userId, roleName } },
      refetchQueries: ['IamUsers']
    });
    const payload = result.data?.revokeRole;
    if (payload && 'message' in payload) {
      setError(payload.message);
      return;
    }
    onChanged();
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="soft" size="1">
          {members.length} member{members.length === 1 ? '' : 's'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="440px">
        <Dialog.Title>{roleLabel}</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Users holding this role.
        </Dialog.Description>

        <Flex direction="column" gap="2">
          {members.length === 0 && (
            <Text size="2" color="gray">
              No users hold this role.
            </Text>
          )}
          {members.map(member => (
            <Flex key={member.id} align="center" justify="between" gap="3">
              <Flex direction="column">
                <Text size="2">
                  {member.firstName} {member.lastName}
                </Text>
                <Text size="1" color="gray">
                  {member.email}
                </Text>
              </Flex>
              {canManage && (
                <Button
                  variant="soft"
                  color="red"
                  size="1"
                  loading={loading}
                  onClick={() => handleRevoke(member.id)}
                >
                  Revoke
                </Button>
              )}
            </Flex>
          ))}

          {error && (
            <Callout.Root color="amber" size="1">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
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
