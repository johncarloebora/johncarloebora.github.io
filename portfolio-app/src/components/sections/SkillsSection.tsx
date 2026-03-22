'use client';

import { useState } from 'react';
import type { SkillCard, SkillCategory, Skill } from '@/types/config';

interface Props {
  skills: SkillCard[];
  preview?: boolean;
}

function SkillItem({ skill }: { skill: Skill }) {
  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      borderRadius: 'var(--radius-sm)',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {skill.icon && <i className={`fa-solid fa-${skill.icon}`} style={{ color: 'var(--accent2)', fontSize: '0.75rem' }} />}
          <span style={{ fontSize: '0.85rem' }}>{skill.name}</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{skill.proficiency}%</span>
      </div>
      <div className="proficiency-bar">
        <div className="proficiency-fill" style={{ width: `${skill.proficiency}%` }} />
      </div>
    </div>
  );
}

function CategoryBlock({ cat }: { cat: SkillCategory }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent1)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {cat.name}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {cat.skills.sort((a, b) => a.sort_order - b.sort_order).map((sk) => (
          <SkillItem key={sk.id} skill={sk} />
        ))}
      </div>
    </div>
  );
}

function SkillCardComp({ card }: { card: SkillCard }) {
  const [open, setOpen] = useState(false);

  if (!card.visible) return null;

  return (
    <div className="card reveal" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          width: '100%',
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
          padding: 0,
          marginBottom: open ? '1.25rem' : 0,
        }}
      >
        <span style={{
          width: '44px', height: '44px',
          borderRadius: 'var(--radius-sm)',
          background: card.color ? `${card.color}20` : 'rgba(78,205,196,0.1)',
          color: card.color || 'var(--accent2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
        }}>
          <i className={`fa-solid fa-${card.icon}`} />
        </span>
        <span style={{ fontSize: '1rem', fontWeight: 600, flex: 1, textAlign: 'left' }}>{card.title}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          {card.categories.reduce((acc, c) => acc + c.skills.length, 0)} skills
        </span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--muted)', fontSize: '0.75rem' }} />
      </button>

      {open && (
        <div>
          {card.categories.sort((a, b) => a.sort_order - b.sort_order).map((cat) => (
            <CategoryBlock key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillsSection({ skills, preview = false }: Props) {
  const visible = skills.filter((s) => s.visible).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id="skills" className="section">
      <div className="container">
        <div className="section-header reveal">
          <span className="section-label">Skills</span>
          <h2 className="section-title">My Expertise</h2>
          <p className="section-subtitle">A broad skill set spanning software, systems, programming, and personal competencies.</p>
        </div>
        <div className="grid-auto-md">
          {visible.map((card) => (
            <SkillCardComp key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
