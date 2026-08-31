'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Checkbox,
  Dialog,
  Flex,
  IconButton,
  Text
} from '@radix-ui/themes';
import {
  useIamAssignPermissionMutation,
  useIamRevokePermissionMutation
} from '@/features/iam/__generated__/queries.generated';
import type { IamPermissionsQuery } from '@/features/iam/__generated__/queries.generated';
import {
  isPrivilegedGrant,
  permissionActionLabel,
  permissionResourceLabel
} from '@/lib/iam-roles';

type PermissionRow = IamPermissionsQuery['permissions'][number];

export interface EditRolePermissionsDialogProps {
  roleName: string;
  roleLabel: string;
  permissions: PermissionRow[];
  onChanged: () => void;
}

function grantedIds(permissions: PermissionRow[], roleName: string) {
  return new Set(
    permissions
      .filter(permission =>
        permission.roles.some(role => role.name === roleName)
      )
      .map(permission => permission.id)
  );
}

export function EditRolePermissionsDialog({
  roleName,
  roleLabel,
  permissions,
  onChanged
}: EditRolePermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [assignPermission, { loading: assigning }] =
    useIamAssignPermissionMutation();
  const [revokePermission, { loading: revoking }] =
    useIamRevokePermissionMutation();

  const saving = assigning || revoking;

  const byResource = new Map<string, PermissionRow[]>();
  for (const permission of permissions) {
    const group = byResource.get(permission.resource) ?? [];
    group.push(permission);
    byResource.set(permission.resource, group);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setChecked(grantedIds(permissions, roleName));
      setError(null);
    }
    setOpen(nextOpen);
  }

  function toggle(permissionId: string) {
    setChecked(current => {
      const next = new Set(current);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    const initial = grantedIds(permissions, roleName);
    const toAssign = [...checked].filter(id => !initial.has(id));
    const toRevoke = [...initial].filter(id => !checked.has(id));

    const results = await Promise.all([
      ...toAssign.map(permissionId =>
        assignPermission({
          variables: { data: { roleName, permissionId } }
        }).then(result => result.data?.assignPermission)
      ),
      ...toRevoke.map(permissionId =>
        revokePermission({
          variables: { data: { roleName, permissionId } }
        }).then(result => result.data?.revokePermission)
      )
    ]);

    const messages = results.flatMap(payload =>
      payload && 'message' in payload ? [payload.message] : []
    );
    onChanged();
    if (messages.length > 0) {
      setError(messages.join(' '));
      return;
    }
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <IconButton
          variant="soft"
          size="1"
          aria-label={`Edit ${roleLabel} permissions`}
        >
          <span className="fas fa-pen" aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content
        maxWidth="820px"
        width="90vw"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(85vh, 800px)',
          overflow: 'hidden'
        }}
      >
        <Dialog.Title style={{ flexShrink: 0 }}>
          Edit permissions — {roleLabel}
        </Dialog.Title>
        <Dialog.Description
          size="2"
          color="gray"
          mb="4"
          style={{ flexShrink: 0 }}
        >
          Grant or revoke catalog permissions for this role. Changes apply to
          every member and are recorded in the audit log.
        </Dialog.Description>

        <Flex
          direction="column"
          gap="4"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            paddingRight: 'var(--space-3)',
            marginRight: 'calc(var(--space-3) * -1)'
          }}
        >
          {[...byResource.entries()].map(([resource, group]) => (
            <Flex key={resource} direction="column" gap="2">
              <Text size="2" weight="medium">
                {permissionResourceLabel(resource)}
              </Text>
              {group.map(permission => (
                <Text key={permission.id} as="label" size="2">
                  <Flex align="center" gap="2">
                    <Checkbox
                      checked={checked.has(permission.id)}
                      onCheckedChange={() => toggle(permission.id)}
                    />
                    {permissionActionLabel(permission.action)}
                    <Text
                      size="1"
                      color="gray"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {permission.resource}:{permission.action}
                    </Text>
                    {isPrivilegedGrant(permission) && (
                      <Badge color="amber" variant="soft">
                        Privileged
                      </Badge>
                    )}
                  </Flex>
                </Text>
              ))}
            </Flex>
          ))}
        </Flex>

        {error && (
          <Callout.Root color="amber" size="1" mt="4" style={{ flexShrink: 0 }}>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex gap="3" mt="4" justify="end" style={{ flexShrink: 0 }}>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button loading={saving} onClick={handleSave}>
            Save changes
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
