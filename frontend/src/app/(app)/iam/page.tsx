'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Badge, Box, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { PageTitle } from '@/components/common/PageTitle';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  useIamAccessSummaryQuery,
  useIamAuditEventsQuery,
  useIamPermissionsQuery,
  useIamRolesQuery,
  useIamUsersQuery
} from '@/features/iam/__generated__/queries.generated';
import {
  accessReviewStatus,
  AUDIT_EVENT_COLOR,
  auditEventLabel,
  isPrivilegedGrant,
  permissionResourceLabel,
  roleLabel
} from '@/lib/iam-roles';
import type {
  IamPermissionsQuery,
  IamRolesQuery,
  IamUsersQuery
} from '@/features/iam/__generated__/queries.generated';

const EMPTY_USERS: IamUsersQuery['users'] = [];
const EMPTY_ROLES: IamRolesQuery['roles'] = [];
const EMPTY_PERMISSIONS: IamPermissionsQuery['permissions'] = [];

/** Review buckets in the order they are surfaced, worst first. */
const REVIEW_BUCKETS = [
  { label: 'Overdue', color: 'var(--red-9)' },
  { label: 'Due soon', color: 'var(--amber-9)' },
  { label: 'Scheduled', color: 'var(--blue-9)' },
  { label: 'Not scheduled', color: 'var(--gray-8)' }
] as const;

function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function Panel({
  title,
  action,
  children
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card size="2" style={{ background: 'var(--color-panel-solid)' }}>
      <Flex justify="between" align="center" gap="3" mb="3">
        <Text weight="medium">{title}</Text>
        {action}
      </Flex>
      {children}
    </Card>
  );
}

function Meter({
  label,
  sublabel,
  value,
  pct,
  color = 'var(--accent-9)',
  badge
}: {
  label: string;
  sublabel?: string;
  value: ReactNode;
  pct: number;
  color?: string;
  badge?: ReactNode;
}) {
  return (
    <Flex align="center" gap="3">
      <Box style={{ width: 132, flexShrink: 0 }}>
        <Flex align="center" gap="2">
          <Text size="2">{label}</Text>
          {badge}
        </Flex>
        {sublabel && (
          <Text as="div" size="1" color="gray">
            {sublabel}
          </Text>
        )}
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
            width: `${Math.min(100, Math.max(0, pct))}%`,
            height: '100%',
            background: color
          }}
        />
      </Box>
      <Text size="2" style={{ width: 40, textAlign: 'right' }}>
        {value}
      </Text>
    </Flex>
  );
}

export default function IamOverviewPage() {
  const { data: summaryData } = useIamAccessSummaryQuery();
  const { data: usersData, loading: usersLoading } = useIamUsersQuery();
  const { data: rolesData } = useIamRolesQuery();
  const { data: permissionsData } = useIamPermissionsQuery();
  const { data: eventsData, loading: eventsLoading } = useIamAuditEventsQuery({
    variables: { limit: 8 }
  });

  const summary = summaryData?.accessSummary;
  const users = usersData?.users ?? EMPTY_USERS;
  const roles = rolesData?.roles ?? EMPTY_ROLES;
  const permissions = permissionsData?.permissions ?? EMPTY_PERMISSIONS;
  const events = eventsData?.auditEvents ?? [];

  /** Roles holding a grant that can administer identities or role assignment. */
  const privilegedRoles = useMemo(() => {
    const names = new Set<string>();
    for (const permission of permissions) {
      if (!isPrivilegedGrant(permission)) continue;
      for (const role of permission.roles) names.add(role.name);
    }
    return names;
  }, [permissions]);

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

  const permissionsByResource = useMemo(() => {
    const counts = new Map<string, { total: number; granted: number }>();
    for (const permission of permissions) {
      const entry = counts.get(permission.resource) ?? { total: 0, granted: 0 };
      entry.total += 1;
      if (permission.roles.length > 0) entry.granted += 1;
      counts.set(permission.resource, entry);
    }
    return Array.from(counts.entries())
      .map(([resource, entry]) => ({ resource, ...entry }))
      .sort((a, b) => b.total - a.total);
  }, [permissions]);

  const reviews = useMemo(() => {
    const counts = new Map<string, number>(
      REVIEW_BUCKETS.map(bucket => [bucket.label, 0])
    );
    for (const user of users) {
      if (!user.isActive) continue;
      const status = accessReviewStatus(
        user.nextAccessReviewDate as string | null
      );
      counts.set(status.label, (counts.get(status.label) ?? 0) + 1);
    }
    return counts;
  }, [users]);

  const activeUsers = users.filter(user => user.isActive);
  const privilegedUsers = activeUsers.filter(user =>
    user.roles.some(role => privilegedRoles.has(role.name))
  );
  const mfaEnabled = activeUsers.filter(user => user.mfaEnabled);
  const mfaRequired = activeUsers.filter(user => user.mfaRequired);
  const ssoUsers = activeUsers.filter(user => user.authProvider === 'entra_id');
  const overdueReviews = reviews.get('Overdue') ?? 0;
  const dueSoonReviews = reviews.get('Due soon') ?? 0;
  const reviewsDue = overdueReviews + dueSoonReviews;
  const signInFailures = summary?.signInFailures24h ?? 0;
  const activeCount = summary?.activeUsersCount ?? activeUsers.length;
  const reviewTotal = activeUsers.length;

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="IAM Overview" />
      <Flex direction="column" gap="5">
        <Box>
          <Heading as="h2" size="6" mb="1">
            Identity &amp; access overview
          </Heading>
          <Text as="p" color="gray" className="mb-0">
            Identity management, access control, and access review.
          </Text>
        </Box>

        <Grid columns={{ initial: '2', md: '3', xl: '6' }} gap="3">
          <StatCard
            label="Active users"
            value={usersLoading ? '…' : activeCount}
            hint={`${summary?.ssoUsersCount ?? ssoUsers.length} via Entra ID SSO`}
            href="/iam/users"
          />
          <StatCard
            label="Deactivated users"
            value={
              usersLoading
                ? '…'
                : (summary?.deactivatedUsersCount ??
                  users.length - activeUsers.length)
            }
            hint="Retained for audit"
            href="/iam/users"
          />
          <StatCard
            label="Privileged users"
            value={usersLoading ? '…' : privilegedUsers.length}
            tone="warning"
            hint={`Across ${privilegedRoles.size} privileged role${privilegedRoles.size === 1 ? '' : 's'}`}
            href="/iam/roles"
          />
          <StatCard
            label="Reviews due"
            value={usersLoading ? '…' : reviewsDue}
            tone={
              overdueReviews > 0
                ? 'danger'
                : reviewsDue > 0
                  ? 'warning'
                  : 'primary'
            }
            hint={`${overdueReviews} overdue · ${dueSoonReviews} due soon`}
            href="/iam/users"
          />
          <StatCard
            label="MFA coverage"
            value={
              usersLoading ? '…' : `${percent(mfaEnabled.length, reviewTotal)}%`
            }
            tone={
              mfaEnabled.length === reviewTotal && reviewTotal > 0
                ? 'success'
                : 'warning'
            }
            hint={`${mfaEnabled.length} of ${reviewTotal} active identities`}
            href="/iam/users"
          />
          <StatCard
            label="Sign-in failures (24h)"
            value={signInFailures}
            tone={signInFailures > 0 ? 'danger' : 'primary'}
            hint={`${summary?.successfulSignIns24h ?? 0} successful sign-ins`}
            href="/iam/audit-log"
          />
        </Grid>

        <Grid columns={{ initial: '1', lg: '2' }} gap="3">
          <Panel
            title="Users by role"
            action={
              <Link href="/iam/roles" className="fs--1 fw-semi-bold">
                Manage roles
              </Link>
            }
          >
            <Flex direction="column" gap="3">
              {usersByRole.map(role => (
                <Meter
                  key={role.name}
                  label={roleLabel(role.name)}
                  sublabel={role.name}
                  value={role.count}
                  pct={role.pct}
                  badge={
                    privilegedRoles.has(role.name) ? (
                      <Badge color="amber" variant="soft" size="1">
                        Privileged
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </Flex>
          </Panel>

          <Panel
            title="Access review status"
            action={
              <Link href="/iam/users" className="fs--1 fw-semi-bold">
                Review users
              </Link>
            }
          >
            <Flex direction="column" gap="3">
              {REVIEW_BUCKETS.map(bucket => {
                const count = reviews.get(bucket.label) ?? 0;
                return (
                  <Meter
                    key={bucket.label}
                    label={bucket.label}
                    value={count}
                    pct={percent(count, reviewTotal)}
                    color={bucket.color}
                  />
                );
              })}
              <Text size="1" color="gray">
                {reviewTotal} active identities in scope for periodic access
                review.
              </Text>
            </Flex>
          </Panel>
        </Grid>

        <Grid columns={{ initial: '1', lg: '2' }} gap="3">
          <Panel
            title="Authentication posture"
            action={
              <Link href="/iam/users" className="fs--1 fw-semi-bold">
                Manage users
              </Link>
            }
          >
            <Flex direction="column" gap="3">
              <Meter
                label="MFA enrolled"
                sublabel={`${mfaRequired.length} required to enrol`}
                value={mfaEnabled.length}
                pct={percent(mfaEnabled.length, reviewTotal)}
                color="var(--green-9)"
              />
              <Meter
                label="Entra ID SSO"
                sublabel="Federated sign-in"
                value={ssoUsers.length}
                pct={percent(ssoUsers.length, reviewTotal)}
                color="var(--blue-9)"
              />
              <Meter
                label="Local accounts"
                sublabel="Password sign-in"
                value={activeUsers.length - ssoUsers.length}
                pct={percent(activeUsers.length - ssoUsers.length, reviewTotal)}
                color="var(--gray-8)"
              />
            </Flex>
          </Panel>

          <Panel
            title="Permission catalog"
            action={
              <Link href="/iam/permissions" className="fs--1 fw-semi-bold">
                Open catalog
              </Link>
            }
          >
            <Flex direction="column" gap="3">
              {permissionsByResource.map(entry => (
                <Meter
                  key={entry.resource}
                  label={permissionResourceLabel(entry.resource)}
                  sublabel={`${entry.granted} of ${entry.total} granted`}
                  value={entry.total}
                  pct={percent(entry.granted, entry.total)}
                />
              ))}
              <Text size="1" color="gray">
                {permissions.length} permissions across {roles.length} roles.
              </Text>
            </Flex>
          </Panel>
        </Grid>

        <Panel
          title="Recent access events"
          action={
            <Link href="/iam/audit-log" className="fs--1 fw-semi-bold">
              Open audit log
            </Link>
          }
        >
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
        </Panel>
      </Flex>
    </Box>
  );
}
