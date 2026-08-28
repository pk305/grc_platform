'use client';

import { useMemo } from 'react';
import { Badge, Box, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { PageTitle } from '@/components/common/PageTitle';
import {
  useIamAccessSummaryQuery,
  useIamAuditEventsQuery,
  useIamPermissionsQuery,
  useIamRolesQuery,
  useIamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import { AUDIT_EVENT_COLOR, auditEventLabel, roleLabel } from '@/lib/iam-roles';
import type {
  IamRolesQuery,
  IamUsersQuery
} from '@/features/iam/__generated__/queries.generated';

const EMPTY_USERS: IamUsersQuery['users'] = [];
const EMPTY_ROLES: IamRolesQuery['roles'] = [];

function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Card size="2">
      <Text size="2" color="gray" mb="1">
        {label}
      </Text>
      <Text as="div" size="7" weight="bold">
        {value}
      </Text>
      <Text size="1" color="gray">
        {detail}
      </Text>
    </Card>
  );
}

export default function IamOverviewPage() {
  const { data: summaryData } = useIamAccessSummaryQuery();
  const { data: usersData } = useIamUsersQuery();
  const { data: rolesData } = useIamRolesQuery();
  const { data: permissionsData } = useIamPermissionsQuery();
  const { data: eventsData, loading: eventsLoading } = useIamAuditEventsQuery({
    variables: { limit: 8 }
  });

  const summary = summaryData?.accessSummary;
  const users = usersData?.users ?? EMPTY_USERS;
  const roles = rolesData?.roles ?? EMPTY_ROLES;
  const permissions = permissionsData?.permissions ?? [];
  const events = eventsData?.auditEvents ?? [];

  const usersByRole = useMemo(() => {
    const counts = new Map<string, number>();
    for (const role of roles) counts.set(role.name, 0);
    for (const user of users) {
      for (const role of user.roles) {
        counts.set(role.name, (counts.get(role.name) ?? 0) + 1);
      }
    }
    const maxCount = Math.max(1, ...counts.values());
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, pct: (count / maxCount) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [roles, users]);

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="IAM Overview" />
      <Flex direction="column" gap="5">
        <Box>
          <Heading as="h2" size="6" mb="1">
            Identity &amp; access overview
          </Heading>
          <Text as="p" color="gray">
            Mapped to ISO/IEC 27001:2022 Annex A — identity management, access
            control, and access review.
          </Text>
        </Box>

        <Grid columns={{ initial: '2', md: '4' }} gap="3">
          <StatCard
            label="Active users"
            value={
              summary?.activeUsersCount ?? users.filter(u => u.isActive).length
            }
            detail={`${summary?.ssoUsersCount ?? 0} via Entra ID SSO`}
          />
          <StatCard
            label="Deactivated users"
            value={
              summary?.deactivatedUsersCount ??
              users.filter(u => !u.isActive).length
            }
            detail="Retained for audit"
          />
          <StatCard
            label="Roles in use"
            value={roles.length}
            detail={`${usersByRole.filter(r => r.count > 0).length} with members`}
          />
          <StatCard
            label="Permissions defined"
            value={permissions.length}
            detail="Access-control catalog"
          />
        </Grid>

        <Grid columns={{ initial: '1', lg: '2' }} gap="3">
          <Card size="2">
            <Flex justify="between" align="center" mb="3">
              <Text weight="medium">Users by role</Text>
              <Link href="/iam/roles" className="fs--1 fw-semi-bold">
                Manage roles
              </Link>
            </Flex>
            <Flex direction="column" gap="3">
              {usersByRole.map(role => (
                <Flex key={role.name} align="center" gap="3">
                  <Box style={{ width: 120, flexShrink: 0 }}>
                    <Text size="2">{roleLabel(role.name)}</Text>
                    <Text
                      as="div"
                      size="1"
                      color="gray"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {role.name}
                    </Text>
                  </Box>
                  <Box
                    style={{
                      flexGrow: 1,
                      height: 8,
                      borderRadius: 4,
                      background: 'var(--gray-a4)',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      style={{
                        width: `${role.pct}%`,
                        height: '100%',
                        background: 'var(--accent-9)'
                      }}
                    />
                  </Box>
                  <Text size="2" style={{ width: 28, textAlign: 'right' }}>
                    {role.count}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Card>

          <Card size="2">
            <Flex justify="between" align="center" mb="3">
              <Text weight="medium">Recent access events</Text>
              <Link href="/iam/audit-log" className="fs--1 fw-semi-bold">
                Open audit log
              </Link>
            </Flex>
            <Flex direction="column" gap="3">
              {!eventsLoading && events.length === 0 && (
                <Text size="2" color="gray">
                  No access events recorded yet.
                </Text>
              )}
              {events.map(event => (
                <Flex key={event.id} justify="between" align="start" gap="3">
                  <Flex direction="column" gap="1">
                    <Flex align="center" gap="2">
                      <Badge
                        color={AUDIT_EVENT_COLOR[event.eventType] ?? 'gray'}
                        variant="soft"
                      >
                        {auditEventLabel(event.eventType)}
                      </Badge>
                      <Text size="1" color="gray">
                        {event.actor}
                      </Text>
                    </Flex>
                    <Text size="1" color="gray">
                      {event.detail}
                    </Text>
                  </Flex>
                  <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(String(event.createdAt)).toLocaleString()}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Card>
        </Grid>
      </Flex>
    </Box>
  );
}
