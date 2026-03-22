'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, SaveBtn } from '../shared/FieldGroup';

export default function ContactEditor() {
  const config = useConfigStore((s) => s.config);
  const updateSettings = useConfigStore((s) => s.updateSettings);
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const { settings } = config;

  const save = async () => {
    setSaving(true);
    await api.put('/settings', {
      contactEmail: settings.contactEmail,
      emailjsServiceId: settings.emailjsServiceId,
      emailjsTemplateId: settings.emailjsTemplateId,
      emailjsPublicKey: settings.emailjsPublicKey,
    });
    setSaving(false);
  };

  return (
    <div>
      <FieldGroup label="Contact Email" hint="For display purposes">
        <TextInput value={settings.contactEmail || ''} onChange={(v) => updateSettings({ contactEmail: v })} type="email" />
      </FieldGroup>
      <FieldGroup label="EmailJS Service ID">
        <TextInput value={settings.emailjsServiceId || ''} onChange={(v) => updateSettings({ emailjsServiceId: v })} />
      </FieldGroup>
      <FieldGroup label="EmailJS Template ID">
        <TextInput value={settings.emailjsTemplateId || ''} onChange={(v) => updateSettings({ emailjsTemplateId: v })} />
      </FieldGroup>
      <FieldGroup label="EmailJS Public Key">
        <TextInput value={settings.emailjsPublicKey || ''} onChange={(v) => updateSettings({ emailjsPublicKey: v })} />
      </FieldGroup>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}
