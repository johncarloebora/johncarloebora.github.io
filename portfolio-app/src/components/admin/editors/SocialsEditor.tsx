'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, Toggle, SaveBtn } from '../shared/FieldGroup';
import type { Social } from '@/types/config';

export default function SocialsEditor() {
  const config = useConfigStore((s) => s.config);
  const updateSocial = useConfigStore((s) => s.updateSocial);
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const sorted = [...config.socials].sort((a, b) => a.sort_order - b.sort_order);

  const handleUpdate = (id: number, updates: Partial<Social>) => updateSocial(id, updates);

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(sorted.map((s) => api.put(`/socials/${s.id}`, s)));
    setSaving(false);
  };

  return (
    <div>
      {sorted.map((s) => (
        <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.platform}</span>
            <Toggle checked={s.visible ?? true} onChange={(v) => handleUpdate(s.id, { visible: v })} label="Visible" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <FieldGroup label="Platform"><TextInput value={s.platform} onChange={(v) => handleUpdate(s.id, { platform: v })} /></FieldGroup>
            <FieldGroup label="Icon (FA brands)"><TextInput value={s.icon} onChange={(v) => handleUpdate(s.id, { icon: v })} placeholder="linkedin, github" /></FieldGroup>
          </div>
          <FieldGroup label="URL"><TextInput value={s.url} onChange={(v) => handleUpdate(s.id, { url: v })} type="url" /></FieldGroup>
          <FieldGroup label="Label"><TextInput value={s.label} onChange={(v) => handleUpdate(s.id, { label: v })} placeholder="@username" /></FieldGroup>
          <FieldGroup label="Color"><TextInput value={s.color ?? ""} onChange={(v) => handleUpdate(s.id, { color: v })} placeholder="#0077b5" /></FieldGroup>
        </div>
      ))}
      <SaveBtn onClick={saveAll} saving={saving} />
    </div>
  );
}
