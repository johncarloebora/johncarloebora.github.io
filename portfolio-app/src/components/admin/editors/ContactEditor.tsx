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
      contact_email: settings.contact_email,
      emailjs_service_id: settings.emailjs_service_id,
      emailjs_template_id: settings.emailjs_template_id,
      emailjs_public_key: settings.emailjs_public_key,
    });
    setSaving(false);
  };

  return (
    <div>
      <FieldGroup label="Contact Email" hint="For display purposes">
        <TextInput value={settings.contact_email || ''} onChange={(v) => updateSettings({ contact_email: v })} type="email" />
      </FieldGroup>
      <FieldGroup label="EmailJS Service ID">
        <TextInput value={settings.emailjs_service_id || ''} onChange={(v) => updateSettings({ emailjs_service_id: v })} />
      </FieldGroup>
      <FieldGroup label="EmailJS Template ID">
        <TextInput value={settings.emailjs_template_id || ''} onChange={(v) => updateSettings({ emailjs_template_id: v })} />
      </FieldGroup>
      <FieldGroup label="EmailJS Public Key">
        <TextInput value={settings.emailjs_public_key || ''} onChange={(v) => updateSettings({ emailjs_public_key: v })} />
      </FieldGroup>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}
