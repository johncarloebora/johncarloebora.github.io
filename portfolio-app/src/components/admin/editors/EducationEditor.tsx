'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, SaveBtn } from '../shared/FieldGroup';
import type { Education } from '@/types/config';

export default function EducationEditor() {
  const config = useConfigStore((s) => s.config);
  const updateEducation = useConfigStore((s) => s.updateEducation);
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const sorted = [...config.education].sort((a, b) => a.sort_order - b.sort_order);

  const handleUpdate = (id: number, updates: Partial<Education>) => {
    updateEducation(id, updates);
  };

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(sorted.map((e) => api.put(`/education/${e.id}`, e)));
    setSaving(false);
  };

  return (
    <div>
      {sorted.map((edu) => (
        <div key={edu.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', padding: '0.875rem' }}>
          <FieldGroup label="Institution"><TextInput value={edu.institution} onChange={(v) => handleUpdate(edu.id, { institution: v })} /></FieldGroup>
          <FieldGroup label="Degree"><TextInput value={edu.degree} onChange={(v) => handleUpdate(edu.id, { degree: v })} /></FieldGroup>
          <FieldGroup label="Date Range"><TextInput value={edu.date_range} onChange={(v) => handleUpdate(edu.id, { date_range: v })} /></FieldGroup>
          <FieldGroup label="Icon"><TextInput value={edu.icon} onChange={(v) => handleUpdate(edu.id, { icon: v })} placeholder="graduation-cap" /></FieldGroup>
          <FieldGroup label="Color"><TextInput value={edu.color} onChange={(v) => handleUpdate(edu.id, { color: v })} placeholder="#ff6b6b" /></FieldGroup>
        </div>
      ))}
      <SaveBtn onClick={saveAll} saving={saving} />
    </div>
  );
}
