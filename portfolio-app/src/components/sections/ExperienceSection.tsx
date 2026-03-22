import type { Experience } from '@/types/config';

interface Props {
  experiences: Experience[];
  preview?: boolean;
}

export default function ExperienceSection({ experiences, preview = false }: Props) {
  const sorted = [...experiences].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id="experience" className="section">
      <div className="container container-sm">
        <div className="section-header reveal">
          <span className="section-label">Experience</span>
          <h2 className="section-title">Work History</h2>
        </div>

        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute',
            left: '5px',
            top: 0, bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, var(--accent1), var(--accent2))',
          }} />

          {sorted.map((exp, i) => (
            <div key={exp.id} className="reveal" style={{
              position: 'relative',
              marginBottom: i < sorted.length - 1 ? '3rem' : 0,
            }}>
              {/* Dot */}
              <div className="timeline-dot" style={{ top: '0.375rem' }} />

              <div className="card" style={{ marginLeft: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{exp.title}</h3>
                    <p style={{ color: 'var(--accent2)', fontWeight: 600, fontSize: '0.9rem' }}>{exp.company}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      background: 'rgba(78,205,196,0.1)',
                      color: 'var(--accent2)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>{exp.date_range}</span>
                    {exp.badge && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--accent1)', marginTop: '0.25rem', fontWeight: 600 }}>
                        {exp.badge}
                      </p>
                    )}
                  </div>
                </div>

                {exp.bullets?.length > 0 && (
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.75rem' }}>
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
