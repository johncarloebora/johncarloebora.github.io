'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, TextArea, Select, SaveBtn, Divider } from '../shared/FieldGroup';

const SHAPE_OPTIONS = [
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'circle',  label: 'Circle' },
  { value: 'square',  label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'shield',  label: 'Shield' },
];

export default function HeroEditor() {
  const config = useConfigStore((s) => s.config);
  const updateHero = useConfigStore((s) => s.updateHero);
  const updateSettings = useConfigStore((s) => s.updateSettings);
  const [saving, setSaving] = useState(false);
  const [subtitleInput, setSubtitleInput] = useState('');

  if (!config) return null;

  const hero = config.hero;
  const settings = config.settings;

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.put('/settings', {
          hero_eyebrow: settings.hero_eyebrow,
          profile_shape: settings.profile_shape,
        }),
        ...Object.entries(hero).map(([k, v]) =>
          api.put('/settings', { [k]: typeof v === 'object' ? JSON.stringify(v) : String(v) })
        ),
      ]);
    } catch { /* handled in store */ }
    setSaving(false);
  };

  const addSubtitle = () => {
    const trimmed = subtitleInput.trim();
    if (!trimmed) return;
    updateHero({ subtitle: [...(hero.subtitle || []), trimmed] });
    setSubtitleInput('');
  };

  const removeSubtitle = (i: number) => {
    updateHero({ subtitle: hero.subtitle.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <FieldGroup label="Eyebrow text" hint="Small label above the name">
        <TextInput value={settings.hero_eyebrow || ''} onChange={(v) => updateSettings({ hero_eyebrow: v })} placeholder="e.g. Welcome to my portfolio" />
      </FieldGroup>

      <FieldGroup label="Name">
        <TextInput value={hero.name || ''} onChange={(v) => updateHero({ name: v })} placeholder="Carlo" />
      </FieldGroup>

      <FieldGroup label="Role / Glitch text">
        <TextInput value={hero.glitch_text || ''} onChange={(v) => updateHero({ glitch_text: v })} placeholder="Computer Engineer" />
      </FieldGroup>

      <FieldGroup label="Description">
        <TextArea value={hero.description || ''} onChange={(v) => updateHero({ description: v })} rows={3} placeholder="Multidisciplinary Creative…" />
      </FieldGroup>

      <Divider label="Typewriter phrases" />
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <input
          type="text"
          value={subtitleInput}
          onChange={(e) => setSubtitleInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSubtitle()}
          placeholder="Add phrase & press Enter"
          style={{ flex: 1, padding: '0.55rem 0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.875rem', outline: 'none' }}
        />
        <button onClick={addSubtitle} className="btn btn-outline" style={{ padding: '0 0.75rem', height: '36px' }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.25rem' }}>
        {(hero.subtitle || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <span style={{ flex: 1, fontSize: '0.85rem' }}>{p}</span>
            <button onClick={() => removeSubtitle(i)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
      </div>

      <Divider label="CTA Buttons" />
      <FieldGroup label="Primary button text">
        <TextInput value={hero.cta_primary_text || ''} onChange={(v) => updateHero({ cta_primary_text: v })} placeholder="View My Work" />
      </FieldGroup>
      <FieldGroup label="Primary button link">
        <TextInput value={hero.cta_primary_href || ''} onChange={(v) => updateHero({ cta_primary_href: v })} placeholder="#projects" />
      </FieldGroup>
      <FieldGroup label="Secondary button text">
        <TextInput value={hero.cta_secondary_text || ''} onChange={(v) => updateHero({ cta_secondary_text: v })} placeholder="Contact Me" />
      </FieldGroup>
      <FieldGroup label="Secondary button link">
        <TextInput value={hero.cta_secondary_href || ''} onChange={(v) => updateHero({ cta_secondary_href: v })} placeholder="#contact" />
      </FieldGroup>

      <Divider label="Profile" />
      <FieldGroup label="Profile image URL" hint="Use Media Library to upload, then paste URL here">
        <TextInput value={hero.profile_image || ''} onChange={(v) => updateHero({ profile_image: v })} placeholder="https://..." />
      </FieldGroup>
      <FieldGroup label="Profile shape">
        <Select value={settings.profile_shape || 'hexagon'} onChange={(v) => updateSettings({ profile_shape: v as typeof settings.profile_shape })} options={SHAPE_OPTIONS} />
      </FieldGroup>

      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}
