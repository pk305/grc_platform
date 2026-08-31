'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  Tabs,
  Text
} from '@radix-ui/themes';
import Avatar from '@/components/common/Avatar';
import { PageTitle } from '@/components/common/PageTitle';
import { Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { useMyProfileQuery } from '@/features/profile/__generated__/queries.generated';
import {
  AUTH_PROVIDER_LABEL,
  accessReviewStatus,
  roleLabel
} from '@/lib/iam-roles';
import { AccessCard } from './AccessCard';
import { AvatarUploadDialog } from './AvatarUploadDialog';
import { ActivityCard } from './ActivityCard';
import { ChangePasswordCard } from './ChangePasswordCard';
import { MfaCard } from './MfaCard';
import { ProfileDetailsCard } from './ProfileDetailsCard';
import type { ProfileUser } from './types';

function PostureTile({
  label,
  value,
  tone = 'gray'
}: {
  label: string;
  value: string;
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'gray';
}) {
  return (
    <Card size="1" style={{ background: 'var(--color-panel-solid)' }}>
      <Text as="div" size="1" color="gray">
        {label}
      </Text>
      <Badge color={tone} variant="soft" mt="1">
        {value}
      </Badge>
    </Card>
  );
}

function ProfileHeader({
  user,
  onChanged
}: {
  user: ProfileUser;
  onChanged: () => void;
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const review = accessReviewStatus(user.nextAccessReviewDate as string | null);

  return (
    <Flex align="center" gap="4" wrap="wrap">
      <Flex direction="column" align="center" gap="2">
        <Avatar
          name={fullName}
          src={user.avatarUrl}
          size="3xl"
          round="circle"
        />
        <AvatarUploadDialog user={user} onChanged={onChanged} />
      </Flex>
      <Box>
        <Heading as="h2" size="6" mb="1">
          {fullName}
        </Heading>
        <Text as="p" color="gray" className="mb-2">
          {user.email}
          {user.department ? ` · ${user.department}` : ''}
        </Text>
        <Flex gap="2" wrap="wrap">
          {user.isSuperuser && (
            <Badge color="red" variant="soft">
              Superuser
            </Badge>
          )}
          {user.roles.map(role => (
            <Badge key={role.id} variant="soft">
              {roleLabel(role.name)}
            </Badge>
          ))}
          <Badge
            color={user.authProvider === 'entra_id' ? 'blue' : 'gray'}
            variant="soft"
          >
            {AUTH_PROVIDER_LABEL[user.authProvider] ?? user.authProvider}
          </Badge>
          <Badge color={review.color} variant="soft">
            Review: {review.label}
          </Badge>
        </Flex>
      </Box>
    </Flex>
  );
}

const TABS = ['details', 'security', 'access', 'activity'] as const;

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState<string>(TABS[0]);
  const { data, loading, refetch } = useMyProfileQuery({
    fetchPolicy: 'cache-and-network'
  });

  const user = data?.me ?? null;

  // Deep links such as /profile#security open straight on that tab. The hash
  // is a client-only value (it never reaches the server), so it can only be
  // read after mount — the one-off sync below is deliberate.
  useEffect(() => {
    const requested = window.location.hash.replace('#', '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ((TABS as readonly string[]).includes(requested)) setTab(requested);
  }, []);

  function handleTabChange(next: string) {
    setTab(next);
    window.history.replaceState(null, '', next === TABS[0] ? ' ' : `#${next}`);
  }

  /** Keep the navbar's account menu in step with edits made here. */
  async function handleChanged() {
    await Promise.all([refetch(), refreshUser()]);
  }

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="My Profile" />
      <Flex direction="column" gap="5">
        {loading && !user ? (
          <Flex direction="column" gap="3">
            <Skeleton width="320px" height="2.5rem" />
            <Skeleton height="12rem" />
          </Flex>
        ) : !user ? (
          <Text color="gray">
            Your account could not be loaded. Try signing in again.
          </Text>
        ) : (
          <>
            <ProfileHeader user={user} onChanged={handleChanged} />

            <Grid columns={{ initial: '2', md: '4' }} gap="3">
              <PostureTile
                label="Multi-factor authentication"
                value={user.mfaEnabled ? 'Enabled' : 'Not enabled'}
                tone={user.mfaEnabled ? 'green' : 'amber'}
              />
              <PostureTile
                label="Recovery codes"
                value={
                  user.mfaEnabled
                    ? `${user.mfaRecoveryCodesRemaining} unused`
                    : 'Not applicable'
                }
                tone={
                  !user.mfaEnabled
                    ? 'gray'
                    : user.mfaRecoveryCodesRemaining === 0
                      ? 'red'
                      : user.mfaRecoveryCodesRemaining <= 3
                        ? 'amber'
                        : 'green'
                }
              />
              <PostureTile
                label="Password"
                value={
                  user.authProvider === 'entra_id'
                    ? 'Managed by Entra ID'
                    : user.mustChangePassword
                      ? 'Change required'
                      : 'Set'
                }
                tone={user.mustChangePassword ? 'amber' : 'green'}
              />
              <PostureTile
                label="Roles held"
                value={
                  user.isSuperuser
                    ? 'Superuser'
                    : `${user.roles.length} assigned`
                }
                tone={user.isSuperuser ? 'red' : 'gray'}
              />
            </Grid>

            <Tabs.Root value={tab} onValueChange={handleTabChange}>
              <Tabs.List>
                <Tabs.Trigger value="details">Details</Tabs.Trigger>
                <Tabs.Trigger value="security">Security</Tabs.Trigger>
                <Tabs.Trigger value="access">Access</Tabs.Trigger>
                <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
              </Tabs.List>

              <Box pt="4">
                <Tabs.Content value="details">
                  <ProfileDetailsCard user={user} onSaved={handleChanged} />
                </Tabs.Content>
                <Tabs.Content value="security">
                  <Flex direction="column" gap="3">
                    <ChangePasswordCard user={user} />
                    <MfaCard user={user} onChanged={handleChanged} />
                  </Flex>
                </Tabs.Content>
                <Tabs.Content value="access">
                  <AccessCard user={user} />
                </Tabs.Content>
                <Tabs.Content value="activity">
                  <ActivityCard />
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </>
        )}
      </Flex>
    </Box>
  );
}
