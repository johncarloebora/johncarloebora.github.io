import type { Social } from '@/types/config';

interface Props {
  socials: Social[];
  preview?: boolean;
}

export default function SocialsSection({ socials, preview = false }: Props) {
  const visible = socials.filter((s) => s.visible).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id="socials" className="section">
      <div className="container container-sm">
        <div className="section-header reveal">
          <span className="section-label">Socials</span>
          <h2 className="section-title">Connect With Me</h2>
          <p className="section-subtitle">Find me on these platforms.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {visible.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card reveal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                textDecoration: 'none',
                color: 'var(--text)',
              }}
            >
              <span style={{
                width: '44px', height: '44px',
                borderRadius: 'var(--radius-sm)',
                background: s.color ? `${s.color}20` : 'rgba(255,107,107,0.1)',
                color: s.color || 'var(--accent1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0,
              }}>
                <i className={`fa-brands fa-${s.icon}`} />
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.platform}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{s.label}</div>
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '0.75rem' }} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
