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
      navLogo: settings.navLogo,
      heroEyebrow: settings.heroEyebrow,
      footerText: settings.footerText,
      profileShape: settings.profileShape,
      themeDefault: settings.themeDefault ?? 'dark',
    };
    await Promise.all(Object.entries(updates).map(([k, v]) => api.put(`/settings/${k}`, { value: v })));
    setSaving(false);
  };

  return (
    <div>
      <FieldGroup label="Nav Logo text">
        <TextInput value={settings.navLogo || ''} onChange={(v) => updateSettings({ navLogo: v })} placeholder="CE" />
      </FieldGroup>
      <FieldGroup label="Footer text">
        <TextInput value={settings.footerText || ''} onChange={(v) => updateSettings({ footerText: v })} placeholder="© 2025 All rights reserved." />
      </FieldGroup>
      <FieldGroup label="Default Theme">
        <Select value={settings.themeDefault || 'dark'} onChange={(v) => updateSettings({ themeDefault: v as 'dark' | 'light' })} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
      </FieldGroup>
      <FieldGroup label="Profile Shape">
        <Select value={settings.profileShape || 'hexagon'} onChange={(v) => updateSettings({ profileShape: v as typeof settings.profileShape })} options={SHAPE_OPTIONS} />
      </FieldGroup>
      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}
