'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, SaveBtn } from '../shared/FieldGroup';

export default function EducationEditor() {
  const config = useConfigStore((s) => s.config);
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const sorted = [...config.education].sort((a, b) => a.sort_order - b.sort_order);

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(sorted.map((e) => api.put(`/education/${e.id}`, e)));
    setSaving(false);
  };

  return (
    <div>
      {sorted.map((edu) => (
        <div key={edu.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', padding: '0.875rem' }}>
          <FieldGroup label="Card Title"><TextInput value={edu.card_title} onChange={() => {}} /></FieldGroup>
          <FieldGroup label="Card Icon"><TextInput value={edu.card_icon} onChange={() => {}} placeholder="fas fa-graduation-cap" /></FieldGroup>
          {edu.entries?.map((entry, i) => (
            <div key={i} style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
              <FieldGroup label={`Entry ${i + 1} Title`}><TextInput value={entry.title} onChange={() => {}} /></FieldGroup>
              <FieldGroup label="Date"><TextInput value={entry.date} onChange={() => {}} /></FieldGroup>
            </div>
          ))}
        </div>
      ))}
      <SaveBtn onClick={saveAll} saving={saving} />
    </div>
  );
}
