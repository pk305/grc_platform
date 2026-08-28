'use client';

import { Box, Flex, Heading, Text } from '@radix-ui/themes';
import { PageTitle } from '@/components/common/PageTitle';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { createAppColumnHelper } from '@/lib/data-grid/table';
import {
  useIamPermissionsQuery,
  useIamRolesQuery,
  useIamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import type {
  IamRolesQuery,
  IamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import { useAuth } from '@/features/auth/AuthContext';
import { roleLabel } from '@/lib/iam-roles';
import { RoleMembersDialog } from './RoleMembersDialog';

type RoleRow = IamRolesQuery['roles'][number];

const EMPTY_ROLES: RoleRow[] = [];
const EMPTY_USERS: IamUsersQuery['users'] = [];
const EMPTY_PERMISSIONS: {
  id: string;
  roles: { id: string; name: string }[];
}[] = [];

const columnHelper = createAppColumnHelper<RoleRow>();

export default function RolesPage() {
  const { isAdmin } = useAuth();
  const { data, loading } = useIamRolesQuery();
  const { data: usersData, refetch: refetchUsers } = useIamUsersQuery();
  const { data: permissionsData } = useIamPermissionsQuery();

  const roles = data?.roles ?? EMPTY_ROLES;
  const users = usersData?.users ?? EMPTY_USERS;
  const permissions = permissionsData?.permissions ?? EMPTY_PERMISSIONS;

  function membersOf(roleName: string) {
    return users.filter(user =>
      user.roles.some(role => role.name === roleName)
    );
  }

  function permissionCountOf(roleName: string) {
    return permissions.filter(permission =>
      permission.roles.some(role => role.name === roleName)
    ).length;
  }

  const columns = columnHelper.columns([
    columnHelper.accessor(row => roleLabel(row.name), {
      id: 'label',
      header: 'Role',
      sortFn: 'alphanumeric',
      cell: ({ row }) => (
        <Flex direction="column">
          <Text weight="medium">{roleLabel(row.original.name)}</Text>
          <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
            {row.original.name}
          </Text>
        </Flex>
      )
    }),
    columnHelper.display({
      id: 'members',
      header: 'Members',
      cell: ({ row }) => (
        <RoleMembersDialog
          roleName={row.original.name}
          roleLabel={roleLabel(row.original.name)}
          members={membersOf(row.original.name)}
          canManage={isAdmin}
          onChanged={() => refetchUsers()}
        />
      )
    }),
    columnHelper.display({
      id: 'permissions',
      header: 'Permissions granted',
      cell: ({ row }) => (
        <Text size="2" color="gray">
          {permissionCountOf(row.original.name)}
        </Text>
      )
    })
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
            <Text as="p" color="gray">
              Role-based access control — the fixed set of roles users can hold.
            </Text>
          </Box>
        </Flex>

        <DataGrid
          data={roles}
          columns={columns}
          getRowId={role => role.id}
          isLoading={loading}
          enableGlobalFilter={false}
          enablePagination={false}
          emptyMessage="No roles defined."
        />

        <Text size="1" color="gray">
          Roles are a fixed set defined by the platform; assign or revoke them
          per user from Users, or from a role&apos;s member list here.
        </Text>
      </Flex>
    </Box>
  );
}
