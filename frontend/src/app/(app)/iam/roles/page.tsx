'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Code,
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
  useIamRolesQuery,
  useIamStartAccessReviewMutation,
  useIamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import type {
  IamPermissionsQuery,
  IamRolesQuery,
  IamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import { useAuth } from '@/features/auth/AuthContext';
import {
  accessReviewStatus,
  isPrivilegedGrant,
  roleDescription,
  roleLabel
} from '@/lib/iam-roles';
import { RoleMembersDialog } from './RoleMembersDialog';
import { EditRolePermissionsDialog } from './EditRolePermissionsDialog';

type RoleRow = IamRolesQuery['roles'][number];
type UserRow = IamUsersQuery['users'][number];
type PermissionRow = IamPermissionsQuery['permissions'][number];

const EMPTY_ROLES: RoleRow[] = [];
const EMPTY_USERS: UserRow[] = [];
const EMPTY_PERMISSIONS: PermissionRow[] = [];

const KEY_PERMISSION_CHIPS = 3;

const columnHelper = createAppColumnHelper<RoleRow>();

type RoleFilter = 'all' | 'privileged' | 'unused' | 'review';

interface RoleStats {
  members: UserRow[];
  permissions: PermissionRow[];
  /** Can administer identities or role assignment (A.8.2 privileged access). */
  privileged: boolean;
  overdueReviews: number;
  dueSoonReviews: number;
  unscheduledReviews: number;
}

export default function RolesPage() {
  const { isAdmin } = useAuth();
  const { data, loading } = useIamRolesQuery();
  const { data: usersData, refetch: refetchUsers } = useIamUsersQuery();
  const { data: permissionsData, refetch: refetchPermissions } =
    useIamPermissionsQuery();
  const [startAccessReview, { loading: startingReview }] =
    useIamStartAccessReviewMutation();
  const [filter, setFilter] = useState<RoleFilter>('all');

  const roles = data?.roles ?? EMPTY_ROLES;
  const users = usersData?.users ?? EMPTY_USERS;
  const permissions = permissionsData?.permissions ?? EMPTY_PERMISSIONS;

  const statsByRole = useMemo(() => {
    const stats = new Map<string, RoleStats>();
    for (const role of roles) {
      const members = users.filter(user =>
        user.roles.some(held => held.name === role.name)
      );
      const granted = permissions.filter(permission =>
        permission.roles.some(holder => holder.name === role.name)
      );
      const reviews = members.map(member =>
        accessReviewStatus(member.nextAccessReviewDate as string | null)
      );
      stats.set(role.name, {
        members,
        permissions: granted,
        privileged: granted.some(isPrivilegedGrant),
        overdueReviews: reviews.filter(r => r.label === 'Overdue').length,
        dueSoonReviews: reviews.filter(r => r.label === 'Due soon').length,
        unscheduledReviews: reviews.filter(r => r.label === 'Not scheduled')
          .length
      });
    }
    return stats;
  }, [roles, users, permissions]);

  function statsOf(roleName: string): RoleStats {
    return (
      statsByRole.get(roleName) ?? {
        members: [],
        permissions: [],
        privileged: false,
        overdueReviews: 0,
        dueSoonReviews: 0,
        unscheduledReviews: 0
      }
    );
  }

  const privilegedRoles = roles.filter(role => statsOf(role.name).privileged);
  const privilegedHolders = new Set(
    privilegedRoles.flatMap(role =>
      statsOf(role.name).members.map(member => member.id)
    )
  ).size;
  const unusedRoles = roles.filter(
    role => statsOf(role.name).members.length === 0
  );
  const reviewsDueRoles = roles.filter(role => {
    const stats = statsOf(role.name);
    return stats.overdueReviews + stats.dueSoonReviews > 0;
  });
  const anyOverdue = roles.some(role => statsOf(role.name).overdueReviews > 0);

  const filteredRoles = useMemo(() => {
    switch (filter) {
      case 'privileged':
        return roles.filter(role => statsByRole.get(role.name)?.privileged);
      case 'unused':
        return roles.filter(
          role => (statsByRole.get(role.name)?.members.length ?? 0) === 0
        );
      case 'review':
        return roles.filter(role => {
          const stats = statsByRole.get(role.name);
          return stats
            ? stats.overdueReviews + stats.dueSoonReviews > 0
            : false;
        });
      default:
        return roles;
    }
  }, [roles, statsByRole, filter]);

  function toggleFilter(next: RoleFilter) {
    setFilter(current => (current === next ? 'all' : next));
  }

  function exportRoleMatrix() {
    const header = ['permission', ...roles.map(role => role.name)];
    const lines = permissions.map(permission => {
      const grantedTo = new Set(permission.roles.map(role => role.name));
      return [
        `${permission.resource}:${permission.action}`,
        ...roles.map(role => (grantedTo.has(role.name) ? 'x' : ''))
      ].join(',');
    });
    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `role-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleStartAccessReview(
    selectedRoles: RoleRow[],
    clearSelection: () => void
  ) {
    const memberIds = new Set(
      selectedRoles.flatMap(role =>
        statsOf(role.name).members.map(member => member.id)
      )
    );
    if (memberIds.size === 0) return;
    await startAccessReview({ variables: { userIds: [...memberIds] } });
    clearSelection();
    await refetchUsers();
  }

  const columns = columnHelper.columns([
    columnHelper.accessor(row => roleLabel(row.name), {
      id: 'label',
      header: 'Role',
      sortFn: 'alphanumeric',
      cell: ({ row }) => (
        <Flex direction="column" style={{ maxWidth: 320 }}>
          <Flex align="center" gap="2">
            <Text weight="medium">{roleLabel(row.original.name)}</Text>
            {statsOf(row.original.name).privileged && (
              <Badge color="amber" variant="soft">
                Privileged
              </Badge>
            )}
          </Flex>
          <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
            {row.original.name}
          </Text>
          <Text size="1" color="gray">
            {roleDescription(row.original.name)}
          </Text>
        </Flex>
      )
    }),
    columnHelper.accessor(row => statsOf(row.name).members.length, {
      id: 'members',
      header: 'Members',
      sortFn: 'alphanumeric',
      cell: ({ row }) => (
        <RoleMembersDialog
          roleName={row.original.name}
          roleLabel={roleLabel(row.original.name)}
          members={statsOf(row.original.name).members}
          canManage={isAdmin}
          onChanged={() => refetchUsers()}
        />
      )
    }),
    columnHelper.accessor(row => statsOf(row.name).permissions.length, {
      id: 'permissionCount',
      header: 'Permissions',
      sortFn: 'alphanumeric',
      cell: ({ getValue }) => (
        <Text size="2" color="gray">
          {getValue()}
        </Text>
      )
    }),
    columnHelper.accessor(
      row =>
        statsOf(row.name)
          .permissions.map(p => `${p.resource}:${p.action}`)
          .join(' '),
      {
        id: 'keyPermissions',
        header: 'Key permissions',
        cell: ({ row }) => {
          const granted = statsOf(row.original.name).permissions;
          if (granted.length === 0) {
            return (
              <Text size="1" color="gray">
                none
              </Text>
            );
          }
          return (
            <Flex gap="1" wrap="wrap" align="center">
              {granted.slice(0, KEY_PERMISSION_CHIPS).map(permission => (
                <Code key={permission.id} size="1" variant="soft" color="gray">
                  {permission.resource}:{permission.action}
                </Code>
              ))}
              {granted.length > KEY_PERMISSION_CHIPS && (
                <Text size="1" color="gray">
                  +{granted.length - KEY_PERMISSION_CHIPS}
                </Text>
              )}
            </Flex>
          );
        }
      }
    ),
    columnHelper.display({
      id: 'reviews',
      header: 'Member reviews',
      cell: ({ row }) => {
        const stats = statsOf(row.original.name);
        if (stats.overdueReviews > 0) {
          return (
            <Badge color="red" variant="soft">
              {stats.overdueReviews} overdue
            </Badge>
          );
        }
        if (stats.dueSoonReviews > 0) {
          return (
            <Badge color="amber" variant="soft">
              {stats.dueSoonReviews} due soon
            </Badge>
          );
        }
        if (stats.unscheduledReviews > 0) {
          return (
            <Badge color="gray" variant="soft">
              Not scheduled
            </Badge>
          );
        }
        if (stats.members.length > 0) {
          return (
            <Badge color="green" variant="soft">
              Current
            </Badge>
          );
        }
        return (
          <Text size="2" color="gray">
            —
          </Text>
        );
      }
    }),
    ...(isAdmin
      ? [
          columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => (
              <Flex justify="end">
                <EditRolePermissionsDialog
                  roleName={row.original.name}
                  roleLabel={roleLabel(row.original.name)}
                  permissions={permissions}
                  onChanged={() => refetchPermissions()}
                />
              </Flex>
            )
          })
        ]
      : [])
  ]);

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="Roles" />
      <Flex direction="column" gap="5">
        <Flex justify="between" align="end" wrap="wrap" gap="3">
          <Box>
            <Heading as="h2" size="6" mb="1">
              Roles
            </Heading>
            <Text as="p" color="gray" className="mb-0">
              Core RBAC — permissions attach to roles only, never directly to
              users.
            </Text>
          </Box>
          <Button
            variant="soft"
            onClick={exportRoleMatrix}
            disabled={permissions.length === 0}
          >
            Export role matrix
          </Button>
        </Flex>

        <Grid columns={{ initial: '2', md: '4' }} gap="3">
          <StatCard
            label="Total roles"
            value={roles.length}
            hint={`Covering ${permissions.length} permissions · ${users.length} users`}
            selected={filter === 'all'}
            onClick={() => toggleFilter('all')}
          />
          <StatCard
            label="Privileged roles"
            value={privilegedRoles.length}
            tone="warning"
            hint={`${privilegedHolders} holder${privilegedHolders === 1 ? '' : 's'} — can administer access`}
            selected={filter === 'privileged'}
            onClick={() => toggleFilter('privileged')}
          />
          <StatCard
            label="Unused roles"
            value={unusedRoles.length}
            tone={unusedRoles.length > 0 ? 'warning' : 'primary'}
            hint="No members assigned"
            selected={filter === 'unused'}
            onClick={() => toggleFilter('unused')}
          />
          <StatCard
            label="Reviews due"
            value={reviewsDueRoles.length}
            tone={
              anyOverdue
                ? 'danger'
                : reviewsDueRoles.length > 0
                  ? 'warning'
                  : 'primary'
            }
            hint="Roles with member access reviews due"
            selected={filter === 'review'}
            onClick={() => toggleFilter('review')}
          />
        </Grid>

        <DataGrid
          title="Role directory"
          data={filteredRoles}
          columns={columns}
          getRowId={role => role.id}
          isLoading={loading}
          enableRowSelection={isAdmin}
          renderBulkActions={
            isAdmin
              ? ({ selectedRows, clearSelection }) => {
                  const memberCount = new Set(
                    selectedRows.flatMap(role =>
                      statsOf(role.name).members.map(member => member.id)
                    )
                  ).size;
                  return (
                    <Button
                      variant="soft"
                      size="2"
                      disabled={memberCount === 0}
                      loading={startingReview}
                      onClick={() =>
                        handleStartAccessReview(selectedRows, clearSelection)
                      }
                    >
                      Start access review ({memberCount} member
                      {memberCount === 1 ? '' : 's'})
                    </Button>
                  );
                }
              : undefined
          }
          enablePagination={false}
          searchPlaceholder="Search role, code, or permission"
          emptyMessage={
            filter === 'all'
              ? 'No roles defined.'
              : 'No roles match this filter.'
          }
        />
      </Flex>
    </Box>
  );
}
