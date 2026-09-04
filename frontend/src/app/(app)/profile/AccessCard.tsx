'use client';

import { useMemo } from 'react';
import { Badge, Box, DataList, Flex, Grid, Text } from '@radix-ui/themes';
import { SectionCard } from '@/components/common/SectionCard';
import { useMyPermissionsQuery } from '@/features/profile/__generated__/queries.generated';
import {
  accessReviewStatus,
  isPrivilegedGrant,
  permissionActionLabel,
  permissionResourceLabel,
  roleDescription,
  roleLabel
} from '@/lib/iam-roles';
import type { ProfileUser } from './types';

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '—';
}

/**
 * What the account holder can do and when that access is next recertified —
 * the user-facing side of access control and access review (A.5.15, A.5.18).
 */
export function AccessCard({ user }: { user: ProfileUser }) {
  const { data, loading } = useMyPermissionsQuery();

  const roleNames = useMemo(
    () => new Set(user.roles.map(role => role.name)),
    [user.roles]
  );

  /** Permissions reachable through the roles this account holds. */
  const grantsByResource = useMemo(() => {
    const permissions = data?.permissions ?? [];
    const mine = permissions.filter(
      permission =>
        user.isSuperuser ||
        permission.roles.some(role => roleNames.has(role.name))
    );

    const grouped = new Map<
      string,
      { action: string; isoClause: string; privileged: boolean }[]
    >();
    for (const permission of mine) {
      const entry = grouped.get(permission.resource) ?? [];
      entry.push({
        action: permission.action,
        isoClause: permission.isoClause,
        privileged: isPrivilegedGrant(permission)
      });
      grouped.set(permission.resource, entry);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data, roleNames, user.isSuperuser]);

  const review = accessReviewStatus(user.nextAccessReviewDate as string | null);

  return (
    <Flex direction="column" gap="3">
      <SectionCard
        title="Roles"
        description="Access is granted by role. Ask an administrator if you need a different one."
      >
        {user.isSuperuser && (
          <Badge color="red" variant="soft" mb="3">
            Superuser — unrestricted access
          </Badge>
        )}
        <Flex direction="column" gap="3">
          {user.roles.length === 0 && !user.isSuperuser && (
            <Text size="2" color="gray">
              No roles assigned yet, so you can only see your own account.
            </Text>
          )}
          {user.roles.map(role => (
            <Box key={role.id}>
              <Flex align="center" gap="2">
                <Badge variant="soft">{roleLabel(role.name)}</Badge>
                <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
                  {role.name}
                </Text>
              </Flex>
              <Text as="div" size="2" color="gray" mt="1">
                {roleDescription(role.name)}
              </Text>
            </Box>
          ))}
        </Flex>
      </SectionCard>

      <SectionCard
        title="Effective permissions"
        description="Every action your roles allow, as enforced by the API."
      >
        {loading && (
          <Text size="2" color="gray">
            Loading permissions…
          </Text>
        )}
        {!loading && grantsByResource.length === 0 && (
          <Text size="2" color="gray">
            Your roles carry no permissions yet.
          </Text>
        )}
        <Grid columns={{ initial: '1', sm: '2' }} gap="3">
          {grantsByResource.map(([resource, grants]) => (
            <Box key={resource}>
              <Text as="div" size="2" weight="medium" mb="1">
                {permissionResourceLabel(resource)}
              </Text>
              <Flex gap="1" wrap="wrap">
                {grants.map(grant => (
                  <Badge
                    key={grant.action}
                    variant="soft"
                    color={grant.privileged ? 'amber' : 'gray'}
                    title={
                      grant.isoClause
                        ? `ISO 27001 ${grant.isoClause}`
                        : undefined
                    }
                  >
                    {permissionActionLabel(grant.action)}
                  </Badge>
                ))}
              </Flex>
            </Box>
          ))}
        </Grid>
      </SectionCard>

      <SectionCard
        title="Account lifecycle"
        description="Your access is recertified on a schedule; an administrator confirms it is still needed."
      >
        <DataList.Root
          size="2"
          orientation={{ initial: 'vertical', sm: 'horizontal' }}
        >
          <DataList.Item>
            <DataList.Label minWidth="160px">Status</DataList.Label>
            <DataList.Value>
              <Badge color={user.isActive ? 'green' : 'red'} variant="soft">
                {user.isActive ? 'Active' : 'Deactivated'}
              </Badge>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="160px">Next access review</DataList.Label>
            <DataList.Value>
              <Flex align="center" gap="2">
                <Badge color={review.color} variant="soft">
                  {review.label}
                </Badge>
                <Text size="2" color="gray">
                  {formatDate(user.nextAccessReviewDate as string | null)}
                </Text>
              </Flex>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="160px">Account created</DataList.Label>
            <DataList.Value>
              {formatDateTime(user.dateJoined as string)}
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="160px">Last sign-in</DataList.Label>
            <DataList.Value>
              {formatDateTime(user.lastLogin as string | null)}
            </DataList.Value>
          </DataList.Item>
        </DataList.Root>
      </SectionCard>
    </Flex>
  );
}
