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
  const updateSettings = useConfigStore((s) => s.updateSettings);
  const [saving, setSaving] = useState(false);
  const [phraseInput, setPhraseInput] = useState('');

  if (!config) return null;

  const settings = config.settings;

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings', {
        heroEyebrow: settings.heroEyebrow,
        heroName: settings.heroName,
        heroSubtitle: settings.heroSubtitle,
        heroDesc: settings.heroDesc,
        profileShape: settings.profileShape,
        profileImageUrl: settings.profileImageUrl,
        ctaPrimaryText: settings.ctaPrimaryText,
        ctaPrimaryLink: settings.ctaPrimaryLink,
        ctaSecondaryText: settings.ctaSecondaryText,
        ctaSecondaryLink: settings.ctaSecondaryLink,
        typewriterPhrases: settings.typewriterPhrases,
      });
    } catch { /* handled in store */ }
    setSaving(false);
  };

  const addPhrase = () => {
    const trimmed = phraseInput.trim();
    if (!trimmed) return;
    updateSettings({ typewriterPhrases: [...(settings.typewriterPhrases || []), trimmed] });
    setPhraseInput('');
  };

  const removePhrase = (i: number) => {
    updateSettings({ typewriterPhrases: settings.typewriterPhrases.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <FieldGroup label="Eyebrow text" hint="Small label above the name">
        <TextInput value={settings.heroEyebrow || ''} onChange={(v) => updateSettings({ heroEyebrow: v })} placeholder="Hello, I'm" />
      </FieldGroup>

      <FieldGroup label="Name">
        <TextInput value={settings.heroName || ''} onChange={(v) => updateSettings({ heroName: v })} placeholder="Carlo" />
      </FieldGroup>

      <FieldGroup label="Subtitle / Role">
        <TextInput value={settings.heroSubtitle || ''} onChange={(v) => updateSettings({ heroSubtitle: v })} placeholder="Computer Engineer" />
      </FieldGroup>

      <FieldGroup label="Description">
        <TextArea value={settings.heroDesc || ''} onChange={(v) => updateSettings({ heroDesc: v })} rows={3} placeholder="Multidisciplinary Creative…" />
      </FieldGroup>

      <Divider label="Typewriter phrases" />
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <input
          type="text"
          value={phraseInput}
          onChange={(e) => setPhraseInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPhrase()}
          placeholder="Add phrase & press Enter"
          style={{ flex: 1, padding: '0.55rem 0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.875rem', outline: 'none' }}
        />
        <button onClick={addPhrase} className="btn btn-outline" style={{ padding: '0 0.75rem', height: '36px' }}>Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.25rem' }}>
        {(settings.typewriterPhrases || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <span style={{ flex: 1, fontSize: '0.85rem' }}>{p}</span>
            <button onClick={() => removePhrase(i)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
      </div>

      <Divider label="CTA Buttons" />
      <FieldGroup label="Primary button text">
        <TextInput value={settings.ctaPrimaryText || ''} onChange={(v) => updateSettings({ ctaPrimaryText: v })} placeholder="View My Work" />
      </FieldGroup>
      <FieldGroup label="Primary button link">
        <TextInput value={settings.ctaPrimaryLink || ''} onChange={(v) => updateSettings({ ctaPrimaryLink: v })} placeholder="#projects" />
      </FieldGroup>
      <FieldGroup label="Secondary button text">
        <TextInput value={settings.ctaSecondaryText || ''} onChange={(v) => updateSettings({ ctaSecondaryText: v })} placeholder="About Me" />
      </FieldGroup>
      <FieldGroup label="Secondary button link">
        <TextInput value={settings.ctaSecondaryLink || ''} onChange={(v) => updateSettings({ ctaSecondaryLink: v })} placeholder="#about" />
      </FieldGroup>

      <Divider label="Profile" />
      <FieldGroup label="Profile image URL" hint="Upload via Media Library, then paste URL here">
        <TextInput value={settings.profileImageUrl || ''} onChange={(v) => updateSettings({ profileImageUrl: v })} placeholder="https://..." />
      </FieldGroup>
      <FieldGroup label="Profile shape">
        <Select value={settings.profileShape || 'hexagon'} onChange={(v) => updateSettings({ profileShape: v })} options={SHAPE_OPTIONS} />
      </FieldGroup>

      <SaveBtn onClick={save} saving={saving} />
    </div>
  );
}
