'use client';

import { useState } from 'react';
import type { AboutCard, Stat, InfoListItem } from '@/types/config';

interface Props {
  cards: AboutCard[];
  stats: Stat[];
  preview?: boolean;
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
      {stat.icon && <i className={stat.icon} style={{ fontSize: '1.5rem', color: 'var(--accent2)', marginBottom: '0.5rem', display: 'block' }} />}
      <div style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800 }} className="gradient-text">{stat.value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{stat.label}</div>
    </div>
  );
}

function AboutCardItem({ card }: { card: AboutCard }) {
  const [expanded, setExpanded] = useState(true);


  return (
    <div className="card reveal">
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
          padding: 0,
          marginBottom: expanded ? '1rem' : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {card.icon && (
            <span style={{
              width: '36px', height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(78,205,196,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent2)',
            }}>
              <i className={card.icon} />
            </span>
          )}
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{card.title}</h3>
        </div>
        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} style={{ color: 'var(--muted)', fontSize: '0.75rem' }} />
      </button>
      {expanded && (
        <div style={{ color: 'var(--muted)', fontSize: '0.925rem', lineHeight: 1.65 }}>
          {Array.isArray(card.content) ? (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(card.content as InfoListItem[]).map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <i className={item.icon} style={{ color: 'var(--accent2)', width: '16px', textAlign: 'center', flexShrink: 0 }} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ whiteSpace: 'pre-line' }}>{card.content as string}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AboutSection({ cards, stats, preview = false }: Props) {
  const visibleCards = [...cards].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id="about" className="section">
      <div className="container">
        <div className="section-header reveal">
          <span className="section-label">About Me</span>
          <h2 className="section-title">Who I Am</h2>
          <p className="section-subtitle">A multidisciplinary creative bridging design, data, and automation.</p>
        </div>

        {/* Cards */}
        <div className="grid-auto-md" style={{ marginBottom: '3rem' }}>
          {visibleCards.map((card) => (
            <AboutCardItem key={card.id} card={card} />
          ))}
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
            gap: '1rem',
          }} className="reveal">
            {stats.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
