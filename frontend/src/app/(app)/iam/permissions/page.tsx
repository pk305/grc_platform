'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Text
} from '@radix-ui/themes';
import { PageTitle } from '@/components/common/PageTitle';
import { StatCard } from '@/components/dashboard/StatCard';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { createAppColumnHelper } from '@/lib/data-grid/table';
import {
  useIamPermissionsQuery,
  useIamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import type {
  IamPermissionsQuery,
  IamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import {
  isPrivilegedGrant,
  permissionActionLabel,
  permissionResourceLabel,
  roleLabel
} from '@/lib/iam-roles';

type PermissionRow = IamPermissionsQuery['permissions'][number];
type UserRow = IamUsersQuery['users'][number];

const EMPTY_PERMISSIONS: PermissionRow[] = [];
const EMPTY_USERS: UserRow[] = [];

const columnHelper = createAppColumnHelper<PermissionRow>();

type PermissionFilter = 'all' | 'privileged' | 'approvals' | 'unassigned';

export default function PermissionsPage() {
  const { data, loading } = useIamPermissionsQuery();
  const { data: usersData } = useIamUsersQuery();
  const [filter, setFilter] = useState<PermissionFilter>('all');

  const permissions = data?.permissions ?? EMPTY_PERMISSIONS;
  const users = usersData?.users ?? EMPTY_USERS;

  const holdersByPermission = useMemo(() => {
    const holders = new Map<string, number>();
    for (const permission of permissions) {
      const granted = new Set(permission.roles.map(role => role.name));
      holders.set(
        permission.id,
        users.filter(user => user.roles.some(role => granted.has(role.name)))
          .length
      );
    }
    return holders;
  }, [permissions, users]);

  const resourceCount = new Set(permissions.map(p => p.resource)).size;
  const privileged = permissions.filter(isPrivilegedGrant);
  const approvals = permissions.filter(p => p.action === 'approve');
  const unassigned = permissions.filter(p => p.roles.length === 0);

  const filteredPermissions = useMemo(() => {
    switch (filter) {
      case 'privileged':
        return permissions.filter(isPrivilegedGrant);
      case 'approvals':
        return permissions.filter(p => p.action === 'approve');
      case 'unassigned':
        return permissions.filter(p => p.roles.length === 0);
      default:
        return permissions;
    }
  }, [permissions, filter]);

  function toggleFilter(next: PermissionFilter) {
    setFilter(current => (current === next ? 'all' : next));
  }

  function exportCatalog() {
    const header = 'permission,resource,action,roles';
    const lines = permissions.map(permission =>
      [
        `${permission.resource}:${permission.action}`,
        permission.resource,
        permission.action,
        permission.roles.map(role => role.name).join(' ')
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `permission-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const columns = columnHelper.columns([
    columnHelper.accessor(row => permissionResourceLabel(row.resource), {
      id: 'resource',
      header: 'Resource',
      sortFn: 'alphanumeric',
      cell: ({ row }) => (
        <Flex direction="column">
          <Flex align="center" gap="2">
            <Text weight="medium">
              {permissionResourceLabel(row.original.resource)}
            </Text>
            {isPrivilegedGrant(row.original) && (
              <Badge color="amber" variant="soft">
                Privileged
              </Badge>
            )}
          </Flex>
          <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
            {row.original.resource}:{row.original.action}
          </Text>
        </Flex>
      )
    }),
    columnHelper.accessor(row => permissionActionLabel(row.action), {
      id: 'action',
      header: 'Action',
      sortFn: 'alphanumeric',
      cell: ({ getValue, row }) => (
        <Badge
          color={row.original.action === 'approve' ? 'amber' : 'gray'}
          variant="outline"
        >
          {getValue()}
        </Badge>
      )
    }),
    columnHelper.accessor(
      row => row.roles.map(role => roleLabel(role.name)).join(' '),
      {
        id: 'roles',
        header: 'Roles granted',
        cell: ({ row }) => (
          <Flex gap="1" wrap="wrap">
            {row.original.roles.length === 0 ? (
              <Text size="1" color="gray">
                none
              </Text>
            ) : (
              row.original.roles.map(role => (
                <Badge key={role.id} color="blue" variant="soft">
                  {roleLabel(role.name)}
                </Badge>
              ))
            )}
          </Flex>
        )
      }
    ),
    columnHelper.accessor(row => holdersByPermission.get(row.id) ?? 0, {
      id: 'holders',
      header: 'Holders',
      sortFn: 'alphanumeric',
      cell: ({ getValue }) => (
        <Text size="2" color="gray">
          {getValue()}
        </Text>
      )
    })
  ]);

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="Permissions" />
      <Flex direction="column" gap="5">
        <Flex justify="between" align="end" wrap="wrap" gap="3">
          <Box>
            <Heading as="h2" size="6" mb="1">
              Permissions
            </Heading>
            <Text as="p" color="gray" className="mb-0">
              The access-control catalog — which roles may perform which action
              on which resource.
            </Text>
          </Box>
          <Button
            variant="soft"
            onClick={exportCatalog}
            disabled={permissions.length === 0}
          >
            Export catalog
          </Button>
        </Flex>

        <Grid columns={{ initial: '2', md: '4' }} gap="3">
          <StatCard
            label="Total permissions"
            value={permissions.length}
            hint={`Across ${resourceCount} resource${resourceCount === 1 ? '' : 's'}`}
            selected={filter === 'all'}
            onClick={() => toggleFilter('all')}
          />
          <StatCard
            label="Privileged grants"
            value={privileged.length}
            tone="warning"
            hint="Administer users and role assignment"
            selected={filter === 'privileged'}
            onClick={() => toggleFilter('privileged')}
          />
          <StatCard
            label="Approval rights"
            value={approvals.length}
            hint="Sign-off actions, kept to few roles"
            selected={filter === 'approvals'}
            onClick={() => toggleFilter('approvals')}
          />
          <StatCard
            label="Unassigned"
            value={unassigned.length}
            tone={unassigned.length > 0 ? 'warning' : 'primary'}
            hint="Granted to no role"
            selected={filter === 'unassigned'}
            onClick={() => toggleFilter('unassigned')}
          />
        </Grid>

        <DataGrid
          title="Permission catalog"
          data={filteredPermissions}
          columns={columns}
          getRowId={permission => permission.id}
          isLoading={loading}
          searchPlaceholder="Search resource, action, or role"
          emptyMessage={
            filter === 'all'
              ? 'No permissions defined.'
              : 'No permissions match this filter.'
          }
        />
      </Flex>
    </Box>
  );
}
