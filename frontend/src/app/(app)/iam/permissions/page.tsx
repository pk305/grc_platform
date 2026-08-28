'use client';

import { Badge, Box, Flex, Heading, Text } from '@radix-ui/themes';
import { PageTitle } from '@/components/common/PageTitle';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { createAppColumnHelper } from '@/lib/data-grid/table';
import { useIamPermissionsQuery } from '@/features/iam/__generated__/queries.generated';
import type { IamPermissionsQuery } from '@/features/iam/__generated__/queries.generated';
import {
  permissionActionLabel,
  permissionResourceLabel,
  roleLabel
} from '@/lib/iam-roles';

type PermissionRow = IamPermissionsQuery['permissions'][number];

const EMPTY_PERMISSIONS: PermissionRow[] = [];

const columnHelper = createAppColumnHelper<PermissionRow>();

const columns = columnHelper.columns([
  columnHelper.accessor(row => permissionResourceLabel(row.resource), {
    id: 'resource',
    header: 'Resource',
    sortFn: 'alphanumeric'
  }),
  columnHelper.accessor(row => permissionActionLabel(row.action), {
    id: 'action',
    header: 'Action',
    sortFn: 'alphanumeric',
    cell: ({ getValue }) => (
      <Badge color="gray" variant="outline">
        {getValue()}
      </Badge>
    )
  }),
  columnHelper.display({
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
  })
]);

export default function PermissionsPage() {
  const { data, loading } = useIamPermissionsQuery();
  const permissions = data?.permissions ?? EMPTY_PERMISSIONS;

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="Permissions" />
      <Flex direction="column" gap="5">
        <Flex justify="between" align="end" wrap="wrap" gap="3">
          <Box>
            <Heading as="h2" size="6" mb="1">
              Permissions
            </Heading>
            <Text as="p" color="gray">
              The access-control catalog — which roles may perform which action
              on which resource.
            </Text>
          </Box>
        </Flex>

        <DataGrid
          data={permissions}
          columns={columns}
          getRowId={permission => permission.id}
          isLoading={loading}
          searchPlaceholder="Search resource or action"
          emptyMessage="No permissions defined."
        />

        <Text size="1" color="gray">
          Permissions are defined by the platform, not user-editable. The Users,
          Roles and Risk register rows are enforced today on their GraphQL
          mutations; the rest document the intended access model.
        </Text>
      </Flex>
    </Box>
  );
}
