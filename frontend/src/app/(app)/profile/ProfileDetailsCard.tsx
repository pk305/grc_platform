'use client';

import { FormEvent, useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Code,
  DataList,
  Flex,
  Grid,
  Text,
  TextField
} from '@radix-ui/themes';
import { SectionCard } from '@/components/common/SectionCard';
import { useUpdateMyProfileMutation } from '@/features/profile/__generated__/queries.generated';
import { AUTH_PROVIDER_LABEL } from '@/lib/iam-roles';
import type { ProfileUser } from './types';

/**
 * Contact attributes the account holder maintains themselves. Email, username
 * and role membership decide access and so stay administrator-owned
 * (ISO/IEC 27001:2022 A.5.16) — they are shown here read-only.
 */
export function ProfileDetailsCard({
  user,
  onSaved
}: {
  user: ProfileUser;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [department, setDepartment] = useState(user.department ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [updateMyProfile, { loading }] = useUpdateMyProfileMutation();

  const isFederated = user.authProvider === 'entra_id';
  const dirty =
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    department !== (user.department ?? '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const { data } = await updateMyProfile({
      variables: {
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          department: department.trim()
        }
      },
      refetchQueries: ['MyProfile', 'Me']
    });

    const result = data?.updateMyProfile;
    if (result?.__typename === 'OperationInfo') {
      setError(result.messages.map(m => m.message).join(' '));
      return;
    }
    setSaved(true);
    onSaved();
  }

  return (
    <Flex direction="column" gap="3">
      <SectionCard
        title="Personal details"
        description="Shown to colleagues alongside the records you own."
      >
        {isFederated && (
          <Callout.Root color="blue" size="1" mb="3">
            <Callout.Text>
              Your details come from Microsoft Entra ID and are maintained in
              your directory profile. Contact your administrator to change them.
            </Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Grid columns={{ initial: '1', sm: '2' }} gap="3" mb="3">
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                First name
              </Text>
              <TextField.Root
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                disabled={isFederated}
                autoComplete="given-name"
                maxLength={150}
              />
            </label>
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Last name
              </Text>
              <TextField.Root
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                disabled={isFederated}
                autoComplete="family-name"
                maxLength={150}
              />
            </label>
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Department
              </Text>
              <TextField.Root
                value={department}
                onChange={e => setDepartment(e.target.value)}
                disabled={isFederated}
                autoComplete="organization"
                maxLength={128}
                placeholder="e.g. Information Security"
              />
            </label>
          </Grid>

          {error && (
            <Callout.Root color="amber" size="1" mb="3">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          <Flex align="center" gap="3">
            <Button type="submit" loading={loading} disabled={!dirty}>
              Save changes
            </Button>
            <Text size="1" color="gray" aria-live="polite">
              {saved && !dirty
                ? 'Saved — the change was written to your account history.'
                : ''}
            </Text>
          </Flex>
        </form>
      </SectionCard>

      <SectionCard
        title="Identity"
        description="Managed by your administrator. These attributes decide who you are to the platform."
      >
        <DataList.Root
          size="2"
          orientation={{ initial: 'vertical', sm: 'horizontal' }}
        >
          <DataList.Item>
            <DataList.Label minWidth="140px">Email</DataList.Label>
            <DataList.Value>{user.email}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="140px">Username</DataList.Label>
            <DataList.Value>{user.username}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="140px">Sign-in method</DataList.Label>
            <DataList.Value>
              <Badge color={isFederated ? 'blue' : 'gray'} variant="soft">
                {AUTH_PROVIDER_LABEL[user.authProvider] ?? user.authProvider}
              </Badge>
            </DataList.Value>
          </DataList.Item>
          {user.entraObjectId && (
            <DataList.Item>
              <DataList.Label minWidth="140px">Directory object</DataList.Label>
              <DataList.Value>
                <Code variant="ghost">{user.entraObjectId}</Code>
              </DataList.Value>
            </DataList.Item>
          )}
          <DataList.Item>
            <DataList.Label minWidth="140px">Account ID</DataList.Label>
            <DataList.Value>
              <Code variant="ghost">{user.id}</Code>
            </DataList.Value>
          </DataList.Item>
        </DataList.Root>
      </SectionCard>
    </Flex>
  );
}
