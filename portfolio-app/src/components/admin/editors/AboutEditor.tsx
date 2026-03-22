'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, TextArea, Toggle, SaveBtn, Divider } from '../shared/FieldGroup';
import type { AboutCard, Stat } from '@/types/config';

function CardEditor({ card, onUpdate, onDelete }: { card: AboutCard; onUpdate: (updates: Partial<AboutCard>) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', cursor: 'pointer', background: 'var(--surface2)' }}
      >
        <i className="fa-solid fa-grip-vertical" style={{ color: 'var(--border)', fontSize: '0.7rem' }} />
        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{card.title || 'Untitled Card'}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
          <i className="fa-solid fa-trash" />
        </button>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--muted)', fontSize: '0.7rem' }} />
      </div>
      {open && (
        <div style={{ padding: '0.875rem' }}>
          <FieldGroup label="Title"><TextInput value={card.title} onChange={(v) => onUpdate({ title: v })} /></FieldGroup>
          <FieldGroup label="Icon (FA name)"><TextInput value={card.icon} onChange={(v) => onUpdate({ icon: v })} placeholder="user, briefcase, etc." /></FieldGroup>
          <FieldGroup label="Content"><TextArea value={card.content} onChange={(v) => onUpdate({ content: v })} rows={4} /></FieldGroup>
          <Toggle checked={card.visible} onChange={(v) => onUpdate({ visible: v })} label="Visible" />
        </div>
      )}
    </div>
  );
}

export default function AboutEditor() {
  const config = useConfigStore((s) => s.config);
  const updateAboutCard = useConfigStore((s) => s.updateAboutCard);
  const removeAboutCard = useConfigStore((s) => s.removeAboutCard);
  const addAboutCard = useConfigStore((s) => s.addAboutCard);
  const updateStat = useConfigStore((s) => s.updateStat);
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const { cards, stats } = config.about;

  const handleAddCard = async () => {
    const res = await api.post('/about-cards', { title: 'New Card', content: '', icon: 'star', card_type: 'text', sort_order: cards.length });
    if (res.ok) {
      const data = await res.json();
      addAboutCard({ id: data.id, title: 'New Card', content: '', icon: 'star', card_type: 'text', sort_order: cards.length, visible: true });
    }
  };

  const handleDeleteCard = async (id: number) => {
    removeAboutCard(id);
    await api.delete(`/about-cards/${id}`);
  };

  const handleUpdateCard = async (id: number, updates: Partial<AboutCard>) => {
    updateAboutCard(id, updates);
    await api.put(`/about-cards/${id}`, updates);
  };

  const saveStats = async () => {
    setSaving(true);
    await Promise.all(stats.map((s) => api.put(`/stats/${s.id}`, { value: s.value, label: s.label, icon: s.icon })));
    setSaving(false);
  };

  const sorted = [...cards].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>About Cards</span>
        <button onClick={handleAddCard} className="btn btn-outline" style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.75rem' }}>
          <i className="fa-solid fa-plus" /> Add Card
        </button>
      </div>

      {sorted.map((card) => (
        <CardEditor
          key={card.id}
          card={card}
          onUpdate={(u) => handleUpdateCard(card.id, u)}
          onDelete={() => handleDeleteCard(card.id)}
        />
      ))}

      <Divider label="Stats" />

      {stats.map((stat) => (
        <div key={stat.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '0.5rem', marginBottom: '0.625rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Value</label>
            <TextInput value={stat.value} onChange={(v) => updateStat(stat.id, { value: v })} placeholder="1.21" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Label</label>
            <TextInput value={stat.label} onChange={(v) => updateStat(stat.id, { label: v })} placeholder="GWA" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Icon</label>
            <TextInput value={stat.icon} onChange={(v) => updateStat(stat.id, { icon: v })} placeholder="star" />
          </div>
        </div>
      ))}

      <SaveBtn onClick={saveStats} saving={saving} />
    </div>
  );
}
