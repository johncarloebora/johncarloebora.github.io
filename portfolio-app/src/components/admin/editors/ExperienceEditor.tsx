'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, TextArea, SaveBtn, Divider } from '../shared/FieldGroup';
import type { Experience } from '@/types/config';

function ExpCard({ exp, onUpdate, onDelete }: { exp: Experience; onUpdate: (u: Partial<Experience>) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [bulletInput, setBulletInput] = useState('');

  const addBullet = () => {
    const t = bulletInput.trim();
    if (!t) return;
    onUpdate({ bullets: [...(exp.bullets || []), t] });
    setBulletInput('');
  };

  const removeBullet = (i: number) => {
    onUpdate({ bullets: exp.bullets.filter((_, idx) => idx !== i) });
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 0.875rem', cursor: 'pointer', background: 'var(--surface2)' }}>
        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600 }}>{exp.title || 'Untitled'}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{exp.company}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
          <i className="fa-solid fa-trash" />
        </button>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--muted)', fontSize: '0.7rem' }} />
      </div>
      {open && (
        <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <FieldGroup label="Job Title"><TextInput value={exp.title} onChange={(v) => onUpdate({ title: v })} /></FieldGroup>
          <FieldGroup label="Company"><TextInput value={exp.company} onChange={(v) => onUpdate({ company: v })} /></FieldGroup>
          <FieldGroup label="Date Range"><TextInput value={exp.date_range} onChange={(v) => onUpdate({ date_range: v })} placeholder="June 2025 – March 2026" /></FieldGroup>
          <FieldGroup label="Badge"><TextInput value={exp.badge || ''} onChange={(v) => onUpdate({ badge: v })} placeholder="Current" /></FieldGroup>

          <Divider label="Bullet Points" />
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={bulletInput}
              onChange={(e) => setBulletInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBullet()}
              placeholder="Add bullet & press Enter"
              style={{ flex: 1, padding: '0.55rem 0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none' }}
            />
            <button onClick={addBullet} className="btn btn-outline" style={{ padding: '0 0.75rem', height: '34px' }}>Add</button>
          </div>
          {(exp.bullets || []).map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: '0.25rem' }}>
              <span style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.5 }}>{b}</span>
              <button onClick={() => removeBullet(i)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', flexShrink: 0 }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: '0.75rem' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExperienceEditor() {
  const config = useConfigStore((s) => s.config);
  const updateExperience = useConfigStore((s) => s.updateExperience);
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const sorted = [...config.experiences].sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = async () => {
    await api.post('/experiences', { title: 'New Role', company: '', date_range: '', bullets: [], sort_order: sorted.length, expanded: 1 });
    // Refresh would be needed in production; for now, user refreshes
  };

  const handleUpdate = async (id: number, updates: Partial<Experience>) => {
    updateExperience(id, updates);
    await api.put(`/experiences/${id}`, updates);
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/experiences/${id}`);
    // trigger config refresh
  };

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(sorted.map((e) => api.put(`/experiences/${e.id}`, e)));
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {sorted.length} Entries
        </span>
        <button onClick={handleAdd} className="btn btn-outline" style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.75rem' }}>
          <i className="fa-solid fa-plus" /> Add
        </button>
      </div>

      {sorted.map((exp) => (
        <ExpCard
          key={exp.id}
          exp={exp}
          onUpdate={(u) => handleUpdate(exp.id, u)}
          onDelete={() => handleDelete(exp.id)}
        />
      ))}

      <SaveBtn onClick={saveAll} saving={saving} />
    </div>
  );
}
