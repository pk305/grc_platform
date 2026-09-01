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
import { useIamAuditEventsQuery } from '@/features/iam/__generated__/queries.generated';
import type { IamAuditEventsQuery } from '@/features/iam/__generated__/queries.generated';
import { useAuth } from '@/features/auth/AuthContext';
import { AUDIT_EVENT_COLOR, auditEventLabel } from '@/lib/iam-roles';

type AuditEventRow = IamAuditEventsQuery['auditEvents'][number];

const EMPTY_EVENTS: AuditEventRow[] = [];

const columnHelper = createAppColumnHelper<AuditEventRow>();

type EventFilter = 'all' | 'account' | 'roles' | 'failures';

function isAccountEvent(event: AuditEventRow): boolean {
  return (
    event.eventType.startsWith('user.') || event.eventType.startsWith('mfa.')
  );
}

function isRoleEvent(event: AuditEventRow): boolean {
  return event.eventType.startsWith('role.');
}

function isFailedSignIn(event: AuditEventRow): boolean {
  return event.eventType === 'login.failed';
}

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const columns = columnHelper.columns([
  columnHelper.accessor('eventType', {
    header: 'Event',
    sortFn: 'alphanumeric',
    cell: ({ getValue }) => {
      const eventType = getValue();
      return (
        <Flex direction="column" align="start" gap="1">
          <Badge color={AUDIT_EVENT_COLOR[eventType] ?? 'gray'} variant="soft">
            {auditEventLabel(eventType)}
          </Badge>
          <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
            {eventType}
          </Text>
        </Flex>
      );
    }
  }),
  columnHelper.accessor('actor', {
    header: 'Actor',
    sortFn: 'alphanumeric',
    cell: ({ getValue }) => <Text weight="medium">{getValue()}</Text>
  }),
  columnHelper.accessor('detail', {
    header: 'Detail',
    cell: ({ getValue }) => (
      <Text size="2" color="gray">
        {getValue() || '—'}
      </Text>
    )
  }),
  columnHelper.accessor('createdAt', {
    header: 'When',
    sortFn: 'datetime',
    cell: ({ getValue }) => (
      <Text size="2" color="gray" style={{ whiteSpace: 'nowrap' }}>
        {new Date(String(getValue())).toLocaleString()}
      </Text>
    )
  })
]);

export default function AuditLogPage() {
  const { isAdmin } = useAuth();
  const { data, loading } = useIamAuditEventsQuery({
    variables: { limit: 200 }
  });
  const [filter, setFilter] = useState<EventFilter>('all');

  const events = data?.auditEvents ?? EMPTY_EVENTS;

  const accountEvents = events.filter(isAccountEvent);
  const roleEvents = events.filter(isRoleEvent);
  const failedSignIns = events.filter(isFailedSignIn);
  const actorCount = new Set(events.map(event => event.actor)).size;

  const filteredEvents = useMemo(() => {
    switch (filter) {
      case 'account':
        return events.filter(isAccountEvent);
      case 'roles':
        return events.filter(isRoleEvent);
      case 'failures':
        return events.filter(isFailedSignIn);
      default:
        return events;
    }
  }, [events, filter]);

  function toggleFilter(next: EventFilter) {
    setFilter(current => (current === next ? 'all' : next));
  }

  function exportLog() {
    const header = 'event,actor,detail,timestamp';
    const lines = events.map(event =>
      [
        event.eventType,
        csvField(event.actor),
        csvField(event.detail),
        new Date(String(event.createdAt)).toISOString()
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `iam-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="Audit Log" />
      <Flex direction="column" gap="5">
        <Flex justify="between" align="end" wrap="wrap" gap="3">
          <Box>
            <Heading as="h2" size="6" mb="1">
              Audit Log
            </Heading>
            <Text as="p" color="gray" className="mb-0">
              Identity and access activity — account changes, role grants, and
              sign-ins.
            </Text>
          </Box>
          {isAdmin && (
            <Button
              variant="soft"
              onClick={exportLog}
              disabled={events.length === 0}
            >
              Export log
            </Button>
          )}
        </Flex>

        <Grid columns={{ initial: '2', md: '4' }} gap="3">
          <StatCard
            label="Events"
            value={events.length}
            hint={`Most recent · ${actorCount} actor${actorCount === 1 ? '' : 's'}`}
            selected={filter === 'all'}
            onClick={() => toggleFilter('all')}
          />
          <StatCard
            label="Account changes"
            value={accountEvents.length}
            hint="User lifecycle and MFA"
            selected={filter === 'account'}
            onClick={() => toggleFilter('account')}
          />
          <StatCard
            label="Role changes"
            value={roleEvents.length}
            hint="Grants and revocations"
            selected={filter === 'roles'}
            onClick={() => toggleFilter('roles')}
          />
          <StatCard
            label="Failed sign-ins"
            value={failedSignIns.length}
            tone={failedSignIns.length > 0 ? 'danger' : 'primary'}
            hint="Unsuccessful authentication attempts"
            selected={filter === 'failures'}
            onClick={() => toggleFilter('failures')}
          />
        </Grid>

        <DataGrid
          title="Event trail"
          data={filteredEvents}
          columns={columns}
          getRowId={event => event.id}
          isLoading={loading}
          searchPlaceholder="Search event, actor, or detail"
          emptyMessage={
            filter === 'all'
              ? 'No access events recorded yet.'
              : 'No events match this filter.'
          }
        />

        <Text size="1" color="gray">
          Events are recorded automatically and cannot be edited or deleted. The
          trail shows the 200 most recent events; export includes the same
          window and is limited to administrators.
        </Text>
      </Flex>
    </Box>
  );
}
