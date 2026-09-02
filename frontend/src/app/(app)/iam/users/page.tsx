'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge, Box, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { StatCard } from '@/components/dashboard/StatCard';
import { createAppColumnHelper } from '@/lib/data-grid/table';
import {
  useIamAccessSummaryQuery,
  useIamRolesQuery,
  useIamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import type { IamUsersQuery } from '@/features/iam/__generated__/queries.generated';
import { useAuth } from '@/features/auth/AuthContext';
import {
  AUTH_PROVIDER_LABEL,
  accessReviewStatus,
  roleLabel
} from '@/lib/iam-roles';
import { PageTitle } from '@/components/common/PageTitle';
import { NewUserDialog } from './NewUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { ManageUserDialog } from './ManageUserDialog';
import { DeleteUserButton } from './DeleteUserButton';
import { UsersBulkActionsBar } from './UsersBulkActionsBar';

type UserRow = IamUsersQuery['users'][number];

const EMPTY_USERS: UserRow[] = [];
const EMPTY_ROLES: IamUsersQuery['users'][number]['roles'] = [];

const columnHelper = createAppColumnHelper<UserRow>();

type UserFilter =
  'all' | 'active' | 'deactivated' | 'privileged' | 'pending' | 'sso';

function isPrivileged(user: UserRow): boolean {
  return user.roles.some(role => role.name === 'admin');
}

export default function UsersPage() {
  const { user: currentUser, isAdmin, isSuperuser } = useAuth();
  const { data, loading, refetch } = useIamUsersQuery();
  const { data: rolesData } = useIamRolesQuery();
  const { data: summaryData } = useIamAccessSummaryQuery();
  const users = data?.users ?? EMPTY_USERS;
  const roles = rolesData?.roles ?? EMPTY_ROLES;
  const summary = summaryData?.accessSummary;
  const [filter, setFilter] = useState<UserFilter>('all');
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') ?? undefined;

  const activeCount =
    summary?.activeUsersCount ?? users.filter(u => u.isActive).length;
  const deactivatedCount =
    summary?.deactivatedUsersCount ?? users.filter(u => !u.isActive).length;
  const privilegedCount = users.filter(isPrivileged).length;
  const pendingCount = users.filter(u => u.roles.length === 0).length;
  const ssoCount =
    summary?.ssoUsersCount ??
    users.filter(u => u.authProvider === 'entra_id').length;

  const filteredUsers = useMemo(() => {
    switch (filter) {
      case 'active':
        return users.filter(u => u.isActive);
      case 'deactivated':
        return users.filter(u => !u.isActive);
      case 'privileged':
        return users.filter(isPrivileged);
      case 'pending':
        return users.filter(u => u.roles.length === 0);
      case 'sso':
        return users.filter(u => u.authProvider === 'entra_id');
      default:
        return users;
    }
  }, [users, filter]);

  function toggleFilter(next: UserFilter) {
    setFilter(current => (current === next ? 'all' : next));
  }

  const columns = columnHelper.columns([
    columnHelper.accessor(row => `${row.firstName} ${row.lastName}`.trim(), {
      id: 'name',
      header: 'Name',
      sortFn: 'alphanumeric'
    }),
    columnHelper.accessor('email', { header: 'Email', sortFn: 'alphanumeric' }),
    columnHelper.accessor('username', {
      header: 'Username',
      sortFn: 'alphanumeric'
    }),
    columnHelper.accessor('entraObjectId', {
      header: 'Entra Object ID',
      cell: ({ getValue }) => (
        <Text
          size="1"
          color="gray"
          style={{ fontFamily: 'var(--code-font-family)' }}
        >
          {getValue() ?? '—'}
        </Text>
      )
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      sortFn: 'alphanumeric',
      cell: ({ getValue }) => (
        <Text size="2" color="gray">
          {getValue() || '—'}
        </Text>
      )
    }),
    columnHelper.display({
      id: 'roles',
      header: 'Roles',
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
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge color="green" variant="soft">
            Active
          </Badge>
        ) : (
          <Badge color="gray" variant="soft">
            Deactivated
          </Badge>
        )
    }),
    columnHelper.accessor('authProvider', {
      header: 'Auth',
      cell: ({ getValue }) => (
        <Text size="2" color="gray">
          {AUTH_PROVIDER_LABEL[getValue()] ?? getValue()}
        </Text>
      )
    }),
    columnHelper.accessor('mfaEnabled', {
      header: 'MFA',
      cell: ({ getValue, row }) =>
        getValue() ? (
          <Badge color="green" variant="soft">
            Enabled
          </Badge>
        ) : row.original.mfaRequired ? (
          <Badge color="red" variant="soft">
            Required
          </Badge>
        ) : (
          <Badge color="gray" variant="soft">
            Disabled
          </Badge>
        )
    }),
    columnHelper.accessor('lastLogin', {
      header: 'Last sign-in (UTC)',
      sortFn: 'datetime',
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <Text size="2" color="gray">
            {value ? new Date(String(value)).toLocaleString() : 'Never'}
          </Text>
        );
      }
    }),
    columnHelper.accessor('dateJoined', {
      header: 'Provisioned',
      sortFn: 'datetime',
      cell: ({ getValue }) => (
        <Text size="2" color="gray">
          {new Date(String(getValue())).toLocaleDateString()}
        </Text>
      )
    }),
    columnHelper.accessor('nextAccessReviewDate', {
      header: 'Access review',
      cell: ({ getValue }) => {
        const { label, color } = accessReviewStatus(
          getValue() as string | null
        );
        return (
          <Badge color={color} variant="soft">
            {label}
          </Badge>
        );
      }
    }),
    ...(isAdmin
      ? [
          columnHelper.display({
            id: 'actions',
            header: '',
            cell: ({ row }) => (
              <Flex gap="2" justify="end">
                <EditUserDialog
                  user={row.original}
                  onChanged={() => refetch()}
                />
                <ManageUserDialog
                  user={row.original}
                  roles={roles}
                  currentUserId={currentUser?.id ?? null}
                  onChanged={() => refetch()}
                />
                {isSuperuser && (
                  <DeleteUserButton
                    user={row.original}
                    currentUserId={currentUser?.id ?? null}
                    onChanged={() => refetch()}
                  />
                )}
              </Flex>
            )
          })
        ]
      : [])
  ]);

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="Users" />
      <Flex direction="column" gap="5">
        <Flex justify="between" align="end" wrap="wrap" gap="3">
          <Box>
            <Heading as="h2" size="6" mb="1">
              Users
            </Heading>
            <Text as="p" color="gray" className="mb-0">
              Identity lifecycle — accounts, activation, and role assignment.
            </Text>
          </Box>
          {isAdmin && (
            <NewUserDialog roles={roles} onCreated={() => refetch()} />
          )}
        </Flex>

        <Grid columns={{ initial: '2', md: '3', xl: '6' }} gap="3">
          <StatCard
            label="Total identities"
            value={users.length}
            hint="Click a card to filter"
            selected={filter === 'all'}
            onClick={() => toggleFilter('all')}
          />
          <StatCard
            label="Active"
            value={activeCount}
            tone="success"
            hint={
              users.length
                ? `${Math.round((activeCount / users.length) * 100)}% of population`
                : undefined
            }
            selected={filter === 'active'}
            onClick={() => toggleFilter('active')}
          />
          <StatCard
            label="Deactivated"
            value={deactivatedCount}
            hint="Retained for audit"
            selected={filter === 'deactivated'}
            onClick={() => toggleFilter('deactivated')}
          />
          <StatCard
            label="Privileged users"
            value={privilegedCount}
            tone="warning"
            hint="Holds the admin role"
            selected={filter === 'privileged'}
            onClick={() => toggleFilter('privileged')}
          />
          <StatCard
            label="Awaiting role assignment"
            value={pendingCount}
            tone={pendingCount > 0 ? 'warning' : 'primary'}
            hint="No roles assigned"
            selected={filter === 'pending'}
            onClick={() => toggleFilter('pending')}
          />
          <StatCard
            label="SSO / Entra ID"
            value={ssoCount}
            hint="Signs in via Microsoft Entra ID"
            selected={filter === 'sso'}
            onClick={() => toggleFilter('sso')}
          />
        </Grid>

        <DataGrid
          title="User Accounts"
          initialGlobalFilter={initialSearch}
          data={filteredUsers}
          columns={columns}
          enableRowSelection={isAdmin}
          renderBulkActions={
            isAdmin
              ? ({ selectedRows, clearSelection }) => (
                  <UsersBulkActionsBar
                    selectedUsers={selectedRows}
                    roles={roles}
                    currentUserId={currentUser?.id ?? null}
                    isSuperuser={isSuperuser}
                    clearSelection={clearSelection}
                    onChanged={() => refetch()}
                  />
                )
              : undefined
          }
          getRowId={user => user.id}
          isLoading={loading}
          searchPlaceholder="Search name, email or username"
          emptyMessage="No users found."
        />

        {!isAdmin && (
          <Text size="1" color="gray">
            Only administrators can create users, change roles, or deactivate
            accounts.
          </Text>
        )}
      </Flex>
    </Box>
  );
}
