'use client';

import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, Toggle } from '../shared/FieldGroup';
import type { Section } from '@/types/config';

export default function SectionsEditor() {
  const config = useConfigStore((s) => s.config);
  const updateSection = useConfigStore((s) => s.updateSection);

  if (!config) return null;

  const sorted = [...config.sections].sort((a, b) => a.sort_order - b.sort_order);

  const handleUpdate = async (id: string, updates: Partial<Section>) => {
    updateSection(id, updates);
    await api.put(`/sections/${id}`, updates);
  };

  return (
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
        Configure navigation labels, icons, and visibility for each section.
      </p>
      {sorted.map((sec) => (
        <div key={sec.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>{sec.type}</span>
            <Toggle checked={!!sec.visible} onChange={(v) => handleUpdate(sec.id, { visible: v })} label="Visible" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <FieldGroup label="Nav Label">
              <TextInput value={sec.nav_label || ''} onChange={(v) => handleUpdate(sec.id, { nav_label: v })} placeholder={sec.type} />
            </FieldGroup>
            <FieldGroup label="Nav Icon (FA)">
              <TextInput value={sec.nav_icon || ''} onChange={(v) => handleUpdate(sec.id, { nav_icon: v })} placeholder="house" />
            </FieldGroup>
          </div>
        </div>
      ))}
    </div>
  );
}
