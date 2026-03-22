'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, Toggle, Divider } from '../shared/FieldGroup';
import type { SkillCard, SkillCategory, Skill } from '@/types/config';

function SkillRow({ skill }: { skill: Skill }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '0.375rem', padding: '0.5rem', background: 'var(--surface3)', borderRadius: 'var(--radius-sm)', marginBottom: '0.25rem' }}>
      <TextInput value={skill.name} onChange={() => {}} placeholder="Skill name" />
      <input
        type="number"
        min={0} max={100}
        value={skill.proficiency}
        onChange={() => {}}
        style={{ padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', textAlign: 'center' }}
      />
    </div>
  );
}

function CategoryBlock({ cat }: { cat: SkillCategory }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', cursor: 'pointer', background: 'var(--surface2)' }}>
        <span style={{ flex: 1, fontSize: '0.825rem', fontWeight: 600 }}>{cat.name}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{cat.skills.length} skills</span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--muted)', fontSize: '0.65rem' }} />
      </div>
      {open && (
        <div style={{ padding: '0.5rem 0.75rem' }}>
          {cat.skills.sort((a, b) => a.sort_order - b.sort_order).map((sk) => (
            <SkillRow key={sk.id} skill={sk} />
          ))}
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', height: '28px', fontSize: '0.75rem', marginTop: '0.375rem' }}>
            <i className="fa-solid fa-plus" /> Add Skill
          </button>
        </div>
      )}
    </div>
  );
}

function SkillCardBlock({ card }: { card: SkillCard }) {
  const updateSkillCard = useConfigStore((s) => s.updateSkillCard);
  const [open, setOpen] = useState(false);

  if (!card.visible && !open) return (
    <div onClick={() => setOpen(true)} style={{ padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', opacity: 0.5, marginBottom: '0.5rem' }}>
      <span style={{ fontSize: '0.85rem' }}>{card.title} (hidden)</span>
    </div>
  );

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 0.875rem', cursor: 'pointer', background: 'var(--surface2)' }}>
        <i className={`fa-solid fa-${card.icon}`} style={{ color: card.color || 'var(--accent2)', fontSize: '0.9rem', width: '16px' }} />
        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{card.title}</span>
        <Toggle checked={card.visible} onChange={(v) => updateSkillCard(card.id, { visible: v })} label="" />
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--muted)', fontSize: '0.7rem' }} />
      </div>
      {open && (
        <div style={{ padding: '0.875rem' }}>
          <FieldGroup label="Title"><TextInput value={card.title} onChange={(v) => updateSkillCard(card.id, { title: v })} /></FieldGroup>
          <FieldGroup label="Icon"><TextInput value={card.icon} onChange={(v) => updateSkillCard(card.id, { icon: v })} placeholder="code, server, etc." /></FieldGroup>
          <FieldGroup label="Color (hex)"><TextInput value={card.color} onChange={(v) => updateSkillCard(card.id, { color: v })} placeholder="#ff6b6b" /></FieldGroup>
          <Divider label="Categories" />
          {card.categories.sort((a, b) => a.sort_order - b.sort_order).map((cat) => (
            <CategoryBlock key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillsEditor() {
  const config = useConfigStore((s) => s.config);
  if (!config) return null;

  const sorted = [...config.skills].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
        Manage skill cards, categories, and individual skills. Click a card to expand.
      </p>
      {sorted.map((card) => (
        <SkillCardBlock key={card.id} card={card} />
      ))}
    </div>
  );
}
