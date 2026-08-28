'use client';

import { FormEvent, useState } from 'react';
import { Box } from '@radix-ui/themes';
import PageHeader from '@/components/common/PageHeader';
import { PageTitle } from '@/components/common/PageTitle';
import { Button, TextField } from '@/components/ui';

export default function SsoSettingsPage() {
  const [clientId, setClientId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [saving, setSaving] = useState(false);

  // The Django backend owns SSO configuration and the OAuth flow itself;
  // this form only collects the values — wire this up once that endpoint
  // exists.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaving(false);
  }

  return (
    <Box px={{ initial: '4', lg: '6' }}>
      <PageTitle title="SSO Settings" />
      <PageHeader
        title="Microsoft Entra ID SSO"
        description="Connect your organisation's Entra ID (Azure AD) app registration to enable single sign-on."
      />

      <div
        className="card shadow-none border border-300 mt-4"
        style={{ maxWidth: 480 }}
      >
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <TextField
                id="client-id"
                name="client_id"
                label="Client ID"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                helpText="The application (client) ID from your Entra ID app registration."
                required
              />
            </div>

            <div className="mb-4">
              <TextField
                id="tenant-id"
                name="tenant_id"
                label="Tenant ID"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
                helpText="Your Microsoft Entra ID directory (tenant) ID."
                required
              />
            </div>

            <Button
              type="submit"
              size="3"
              color="gray"
              highContrast
              loading={saving}
            >
              Save
            </Button>
          </form>
        </div>
      </div>
    </Box>
  );
}
