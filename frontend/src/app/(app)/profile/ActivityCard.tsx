'use client';

import { useState } from 'react';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { useMyAuditEventsQuery } from '@/features/profile/__generated__/queries.generated';
import { AUDIT_EVENT_COLOR, auditEventLabel } from '@/lib/iam-roles';
import { SectionCard } from './SectionCard';

const PAGE_SIZE = 25;

/**
 * The account holder's own audit trail — sign-ins, security changes and any
 * administrative action taken on the account. Scoped server-side to this user
 * (A.5.34, A.8.15); the tenant-wide log lives under Administration.
 */
export function ActivityCard() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { data, loading } = useMyAuditEventsQuery({
    variables: { limit },
    fetchPolicy: 'cache-and-network'
  });

  const events = data?.myAuditEvents ?? [];
  const canLoadMore = events.length >= limit;

  return (
    <SectionCard
      title="Account activity"
      description="Recorded automatically and retained for audit — entries cannot be edited or removed."
    >
      {loading && events.length === 0 && (
        <Text size="2" color="gray">
          Loading activity…
        </Text>
      )}

      {!loading && events.length === 0 && (
        <Text size="2" color="gray">
          Nothing recorded on this account yet.
        </Text>
      )}

      <Flex direction="column" gap="3">
        {events.map(event => (
          <Flex key={event.id} align="start" gap="3">
            <Box style={{ minWidth: 150 }}>
              <Badge
                color={AUDIT_EVENT_COLOR[event.eventType] ?? 'gray'}
                variant="soft"
              >
                {auditEventLabel(event.eventType)}
              </Badge>
            </Box>
            <Box style={{ flexGrow: 1 }}>
              <Text as="div" size="2">
                {event.detail || '—'}
              </Text>
              <Text as="div" size="1" color="gray">
                {event.actor}
                {event.ipAddress ? ` · ${event.ipAddress}` : ''}
              </Text>
            </Box>
            <Text
              size="1"
              color="gray"
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {new Date(String(event.createdAt)).toLocaleString()}
            </Text>
          </Flex>
        ))}
      </Flex>

      {canLoadMore && (
        <Flex justify="center" mt="4">
          <Button
            variant="soft"
            color="gray"
            size="1"
            loading={loading}
            onClick={() => setLimit(current => current + PAGE_SIZE)}
          >
            Show more
          </Button>
        </Flex>
      )}
    </SectionCard>
  );
}
