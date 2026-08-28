'use client';

import { Badge, Box, Flex, Heading, Text } from '@radix-ui/themes';
import { PageTitle } from '@/components/common/PageTitle';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { createAppColumnHelper } from '@/lib/data-grid/table';
import { useIamAuditEventsQuery } from '@/features/iam/__generated__/queries.generated';
import type { IamAuditEventsQuery } from '@/features/iam/__generated__/queries.generated';
import { AUDIT_EVENT_COLOR, auditEventLabel } from '@/lib/iam-roles';

type AuditEventRow = IamAuditEventsQuery['auditEvents'][number];

const EMPTY_EVENTS: AuditEventRow[] = [];

const columnHelper = createAppColumnHelper<AuditEventRow>();

const columns = columnHelper.columns([
  columnHelper.accessor('eventType', {
    header: 'Event',
    sortFn: 'alphanumeric',
    cell: ({ getValue }) => {
      const eventType = getValue();
      return (
        <Badge color={AUDIT_EVENT_COLOR[eventType] ?? 'gray'} variant="soft">
          {auditEventLabel(eventType)}
        </Badge>
      );
    }
  }),
  columnHelper.accessor('actor', { header: 'Actor', sortFn: 'alphanumeric' }),
  columnHelper.accessor('detail', { header: 'Detail' }),
  columnHelper.accessor('createdAt', {
    header: 'When',
    sortFn: 'datetime',
    cell: ({ getValue }) => (
      <Text size="2" color="gray">
        {new Date(String(getValue())).toLocaleString()}
      </Text>
    )
  })
]);

export default function AuditLogPage() {
  const { data, loading } = useIamAuditEventsQuery({
    variables: { limit: 200 }
  });
  const events = data?.auditEvents ?? EMPTY_EVENTS;

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="Audit Log" />
      <Flex direction="column" gap="5">
        <Flex justify="between" align="end" wrap="wrap" gap="3">
          <Box>
            <Heading as="h2" size="6" mb="1">
              Audit Log
            </Heading>
            <Text as="p" color="gray">
              Identity and access activity — account changes, role grants, and
              sign-ins.
            </Text>
          </Box>
        </Flex>

        <DataGrid
          data={events}
          columns={columns}
          getRowId={event => event.id}
          isLoading={loading}
          searchPlaceholder="Search actor or detail"
          emptyMessage="No access events recorded yet."
        />
      </Flex>
    </Box>
  );
}
