'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Callout,
  Flex,
  Grid,
  Switch,
  Text
} from '@radix-ui/themes';
import { IsoClauseBadges } from '@/components/common/IsoClauseBadge';
import PageHeader from '@/components/common/PageHeader';
import { PageTitle } from '@/components/common/PageTitle';
import { SectionCard } from '@/components/common/SectionCard';
import { useToast } from '@/components/common/Toast';
import { Button, Skeleton, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useSystemSettingsQuery,
  useUpdateSystemSettingsMutation
} from '@/features/system-settings/__generated__/queries.generated';
import type { SystemSettingsQuery } from '@/features/system-settings/__generated__/queries.generated';
import type { SystemSettingInput } from '@/gql/graphql-types';

type Settings = SystemSettingsQuery['systemSettings'];

/**
 * The editable shape of the settings row. Numbers are held as strings while
 * the form is open so a half-typed value ("1" on the way to "16") stays
 * exactly what the administrator typed instead of being coerced mid-keystroke.
 */
interface Draft {
  organisationName: string;
  primaryContactEmail: string;
  allowedLoginDomain: string;
  requireMfaForAllUsers: boolean;
  sessionExpiryMinutes: string;
  passwordMinLength: string;
  accessReviewIntervalDays: string;
  auditLogRetentionDays: string;
}

const NUMERIC_FIELDS = [
  'sessionExpiryMinutes',
  'passwordMinLength',
  'accessReviewIntervalDays',
  'auditLogRetentionDays'
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

/** Every card lays its fields out on this one grid, so the inputs in each
 *  section line up with those in the section above and below it. */
const FIELD_COLUMNS = { initial: '1', sm: '2', xl: '3' } as const;

function toDraft(settings: Settings): Draft {
  return {
    organisationName: settings.organisationName,
    primaryContactEmail: settings.primaryContactEmail,
    allowedLoginDomain: settings.allowedLoginDomain,
    requireMfaForAllUsers: settings.requireMfaForAllUsers,
    sessionExpiryMinutes: String(settings.sessionExpiryMinutes),
    passwordMinLength: String(settings.passwordMinLength),
    accessReviewIntervalDays: String(settings.accessReviewIntervalDays),
    auditLogRetentionDays: String(settings.auditLogRetentionDays)
  };
}

/**
 * Only what the administrator actually changed, so an untouched field can
 * never be overwritten by a stale copy of the row.
 */
function changedFields(draft: Draft, settings: Settings): SystemSettingInput {
  const changes: SystemSettingInput = {};
  const stored = toDraft(settings);

  for (const key of Object.keys(draft) as (keyof Draft)[]) {
    if (draft[key] === stored[key]) continue;
    const value = draft[key];
    // Draft keys are exactly the input's keys — the cast only re-opens the
    // object for the dynamic write.
    (changes as Record<string, string | number | boolean>)[key] =
      typeof value === 'string' && NUMERIC_FIELDS.includes(key as NumericField)
        ? Number(value)
        : value;
  }
  return changes;
}

function hoursAndMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} minutes`;
  return rest ? `${hours}h ${rest}m` : `${hours} hours`;
}

/**
 * A switch dressed as a field: same label, control row and help text as the
 * `TextField`s beside it, so it sits on the grid instead of floating out at
 * the card's edge.
 */
function SwitchField({
  id,
  label,
  checked,
  onCheckedChange,
  onLabel,
  offLabel,
  helpText
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onLabel: string;
  offLabel: string;
  helpText: string;
}) {
  return (
    <Box>
      <Text
        as="label"
        htmlFor={id}
        size="2"
        weight="medium"
        mb="1"
        style={{ display: 'block' }}
      >
        {label}
      </Text>
      {/* Matches the height of a size-2 TextField so the control lines up
          with the inputs sharing its grid row. */}
      <Flex align="center" gap="2" style={{ minHeight: 'var(--space-6)' }}>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
        <Text size="2" color={checked ? undefined : 'gray'}>
          {checked ? onLabel : offLabel}
        </Text>
      </Flex>
      <Text as="p" size="1" color="gray" mt="1" mb="0">
        {helpText}
      </Text>
    </Box>
  );
}

export default function SystemSettingsPage() {
  const { isAdmin } = useAuth();
  const showToast = useToast();
  const { data, loading } = useSystemSettingsQuery({
    skip: !isAdmin,
    fetchPolicy: 'cache-and-network'
  });
  const [updateSettings, { loading: saving }] =
    useUpdateSystemSettingsMutation();

  const settings = data?.systemSettings ?? null;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [seededFrom, setSeededFrom] = useState<Settings | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Seed the form from the row as it arrives, and re-seed whenever the saved
  // values change underneath it — a save of our own, or another admin's edit
  // picked up by a refetch. Apollo hands back the same object while the data
  // is unchanged, so a background refetch never discards work in progress.
  if (settings && settings !== seededFrom) {
    setSeededFrom(settings);
    setDraft(toDraft(settings));
  }

  const changes = useMemo(
    () => (draft && settings ? changedFields(draft, settings) : {}),
    [draft, settings]
  );
  const dirty = Object.keys(changes).length > 0;

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(current => (current ? { ...current, [key]: value } : current));
    setFieldErrors(current => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty) return;
    setFieldErrors({});
    setFormError(null);

    const { data: result } = await updateSettings({
      variables: { data: changes }
    });
    const payload = result?.updateSystemSettings;

    if (payload?.__typename === 'OperationInfo') {
      const errors: Record<string, string> = {};
      const general: string[] = [];
      for (const { field, message } of payload.messages) {
        // strawberry-django reports the field under its GraphQL (camelCase)
        // name, which is exactly a Draft key.
        if (field && field in (draft ?? {})) errors[field] = message;
        else general.push(message);
      }
      setFieldErrors(errors);
      setFormError(general.join(' ') || null);
      showToast('Settings could not be saved.', 'error');
      return;
    }

    showToast('System settings saved.', 'success');
  }

  if (!isAdmin) {
    return (
      <Box px={{ initial: '4', lg: '6' }}>
        <PageTitle title="System Settings" />
        <PageHeader
          title="System settings"
          description="Platform-wide configuration."
        />
        <Callout.Root color="amber" mt="4">
          <Callout.Text>
            System settings are restricted to the Admin role. Ask an
            administrator if you need something here changed.
          </Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="System Settings" />
      <PageHeader
        title="System settings"
        description="Platform-wide configuration, mapped to the ISO/IEC 27001:2022 Annex A controls it implements. Changes take effect immediately and are recorded in the IAM audit log."
      />

      {loading && !draft ? (
        <Flex direction="column" gap="4" mt="4">
          <Skeleton height="12rem" />
          <Skeleton height="16rem" />
        </Flex>
      ) : !draft || !settings ? (
        <Callout.Root color="red" mt="4">
          <Callout.Text>
            System settings could not be loaded. Refresh the page to try again.
          </Callout.Text>
        </Callout.Root>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Flex direction="column" gap="4" mt="4">
            {formError && (
              <Callout.Root color="red">
                <Callout.Text>{formError}</Callout.Text>
              </Callout.Root>
            )}

            <SectionCard
              title="Organisation"
              description="How the platform refers to your organisation in the messages it sends."
              action={<IsoClauseBadges clauses={['A.5.1']} />}
            >
              <Grid columns={FIELD_COLUMNS} gap="4">
                <TextField
                  id="organisation-name"
                  label="Organisation name"
                  value={draft.organisationName}
                  onChange={e => set('organisationName', e.target.value)}
                  error={fieldErrors.organisationName}
                  maxLength={128}
                  helpText="Named as the sender in notifications and access emails."
                />
                <TextField
                  id="primary-contact-email"
                  type="email"
                  label="Primary contact email"
                  placeholder="grc@example.com"
                  value={draft.primaryContactEmail}
                  onChange={e => set('primaryContactEmail', e.target.value)}
                  error={fieldErrors.primaryContactEmail}
                  helpText="Where users are told to turn for access problems."
                />
              </Grid>
            </SectionCard>

            <SectionCard
              title="Access control"
              description="Who may sign in, and the authentication the platform insists on."
              action={
                <IsoClauseBadges clauses={['A.5.15', 'A.5.17', 'A.8.5']} />
              }
            >
              <Grid columns={FIELD_COLUMNS} gap="4">
                <TextField
                  id="allowed-login-domain"
                  label="Allowed sign-in domain"
                  placeholder={settings.effectiveLoginDomain}
                  value={draft.allowedLoginDomain}
                  onChange={e => set('allowedLoginDomain', e.target.value)}
                  error={fieldErrors.allowedLoginDomain}
                  helpText={
                    <>
                      Accounts outside this domain are refused at sign-in
                      (A.5.15). Leave blank to follow the deployment&apos;s own
                      value — currently{' '}
                      <strong>@{settings.effectiveLoginDomain}</strong>.
                    </>
                  }
                />
                <SwitchField
                  id="require-mfa"
                  label="Require MFA for every account"
                  checked={draft.requireMfaForAllUsers}
                  onCheckedChange={checked =>
                    set('requireMfaForAllUsers', checked)
                  }
                  onLabel="Required for every account"
                  offLabel="Set per account"
                  helpText="Accounts without MFA are held on the enrollment screen at their next sign-in until they finish setting it up (A.8.5)."
                />
                <TextField
                  id="session-expiry-minutes"
                  type="number"
                  min={5}
                  max={10080}
                  label="Session expiry (minutes)"
                  value={draft.sessionExpiryMinutes}
                  onChange={e => set('sessionExpiryMinutes', e.target.value)}
                  error={fieldErrors.sessionExpiryMinutes}
                  helpText={`Users re-authenticate after ${hoursAndMinutes(Number(draft.sessionExpiryMinutes)) || 'this long'} (A.8.5). Applies from the next sign-in.`}
                />
                <TextField
                  id="password-min-length"
                  type="number"
                  min={8}
                  max={128}
                  label="Minimum password length"
                  value={draft.passwordMinLength}
                  onChange={e => set('passwordMinLength', e.target.value)}
                  error={fieldErrors.passwordMinLength}
                  helpText="Enforced on every new and changed password (A.5.17)."
                />
              </Grid>
            </SectionCard>

            <SectionCard
              title="Governance"
              description="The cadences the platform holds accounts and records to."
              action={<IsoClauseBadges clauses={['A.5.18', 'A.8.15']} />}
            >
              <Grid columns={FIELD_COLUMNS} gap="4">
                <TextField
                  id="access-review-interval-days"
                  type="number"
                  min={1}
                  max={3650}
                  label="Access review interval (days)"
                  value={draft.accessReviewIntervalDays}
                  onChange={e =>
                    set('accessReviewIntervalDays', e.target.value)
                  }
                  error={fieldErrors.accessReviewIntervalDays}
                  helpText="How far ahead a new account's first recertification is scheduled (A.5.18)."
                />
                <TextField
                  id="audit-log-retention-days"
                  type="number"
                  min={30}
                  max={3650}
                  label="Audit log retention (days)"
                  value={draft.auditLogRetentionDays}
                  onChange={e => set('auditLogRetentionDays', e.target.value)}
                  error={fieldErrors.auditLogRetentionDays}
                  helpText="Audit events and sign-in attempts older than this are removed by the purge_audit_log job (A.8.15)."
                />
              </Grid>
            </SectionCard>

            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Text size="1" color="gray">
                {settings.updatedByEmail
                  ? `Last changed by ${settings.updatedByEmail} on ${new Date(String(settings.updatedAt)).toLocaleString()}.`
                  : 'Unchanged since this platform was deployed.'}
              </Text>
              <Flex align="center" gap="3">
                {dirty && (
                  <Badge color="amber" variant="soft">
                    Unsaved changes
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  disabled={!dirty || saving}
                  onClick={() => {
                    setDraft(toDraft(settings));
                    setFieldErrors({});
                    setFormError(null);
                  }}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  color="gray"
                  highContrast
                  disabled={!dirty}
                  loading={saving}
                >
                  Save changes
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </form>
      )}
    </Box>
  );
}
