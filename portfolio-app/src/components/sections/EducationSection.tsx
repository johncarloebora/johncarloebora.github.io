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
                  background: edu.color ? `${edu.color}20` : 'rgba(255,107,107,0.1)',
                  color: edu.color || 'var(--accent1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', flexShrink: 0,
                }}>
                  <i className={`fa-solid fa-${edu.icon || 'graduation-cap'}`} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{edu.institution}</h3>
                      <p style={{ color: 'var(--accent2)', fontWeight: 600, fontSize: '0.9rem' }}>{edu.degree}</p>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      background: 'rgba(255,107,107,0.1)',
                      color: 'var(--accent1)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      height: 'fit-content',
                    }}>{edu.date_range}</span>
                  </div>
                  {edu.entries?.length > 0 && (
                    <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {edu.entries.map((e) => (
                        <li key={e.id} style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{e.line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
