'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, Select, SaveBtn, Divider } from '../shared/FieldGroup';

const SHAPE_OPTIONS = [
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'circle',  label: 'Circle' },
  { value: 'square',  label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'shield',  label: 'Shield' },
];

export default function SettingsEditor() {
  const config = useConfigStore((s) => s.config);
  const updateSettings = useConfigStore((s) => s.updateSettings);
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const { settings } = config;

  const save = async () => {
    setSaving(true);
    const updates: Record<string, string> = {
      nav_logo: settings.nav_logo,
      hero_eyebrow: settings.hero_eyebrow,
      footer_text: settings.footer_text,
      profile_shape: settings.profile_shape,
      theme_default: settings.theme_default,
    };
    await Promise.all(Object.entries(updates).map(([k, v]) => api.put(`/settings/${k}`, { value: v })));
    setSaving(false);
  };

  return (
    <div>
      <FieldGroup label="Nav Logo text">
        <TextInput value={settings.nav_logo || ''} onChange={(v) => updateSettings({ nav_logo: v })} placeholder="CE" />
      </FieldGroup>
      <FieldGroup label="Footer text">
        <TextInput value={settings.footer_text || ''} onChange={(v) => updateSettings({ footer_text: v })} placeholder="© 2025 All rights reserved." />
      </FieldGroup>
      <FieldGroup label="Default Theme">
        <Select value={settings.theme_default || 'dark'} onChange={(v) => updateSettings({ theme_default: v as 'dark' | 'light' })} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
      </FieldGroup>
      <FieldGroup label="Profile Shape">
        <Select value={settings.profile_shape || 'hexagon'} onChange={(v) => updateSettings({ profile_shape: v as typeof settings.profile_shape })} options={SHAPE_OPTIONS} />
      </FieldGroup>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}
