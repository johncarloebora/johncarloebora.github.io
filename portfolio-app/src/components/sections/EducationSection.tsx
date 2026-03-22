import type { Education } from '@/types/config';

interface Props {
  education: Education[];
  preview?: boolean;
}

export default function EducationSection({ education, preview = false }: Props) {
  const sorted = [...education].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id="education" className="section">
      <div className="container container-sm">
        <div className="section-header reveal">
          <span className="section-label">Education</span>
          <h2 className="section-title">Academic Background</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sorted.map((edu) => (
            <div key={edu.id} className="card reveal">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                <span style={{
                  width: '48px', height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,107,107,0.1)',
                  color: 'var(--accent1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', flexShrink: 0,
                }}>
                  <i className={edu.card_icon || 'fa-solid fa-graduation-cap'} />
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>{edu.card_title}</h3>
                  {edu.entries?.map((entry, i) => (
                    <div key={i} style={{ marginBottom: i < edu.entries.length - 1 ? '1.25rem' : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.375rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{entry.title}</span>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '999px',
                          background: 'rgba(255,107,107,0.1)', color: 'var(--accent1)',
                          fontSize: '0.75rem', fontWeight: 600, height: 'fit-content',
                        }}>{entry.date}</span>
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {entry.lines.map((line, j) => (
                          <li key={j} style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
