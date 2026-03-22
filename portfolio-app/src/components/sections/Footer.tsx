import type { SiteSettings, Social } from '@/types/config';

interface Props {
  settings: SiteSettings;
  socials: Social[];
  preview?: boolean;
}

export default function Footer({ settings, socials, preview = false }: Props) {
  const year = new Date().getFullYear();
  const visible = socials.filter((s) => s.visible).slice(0, 6);

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '2.5rem 0',
      background: 'var(--surface)',
    }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Logo + text */}
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: '1.25rem',
              background: 'var(--grad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.25rem',
            }}>
              {settings.nav_logo || 'Carlo Ebora'}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {settings.footer_text || `© ${year} All rights reserved.`}
            </p>
          </div>

          {/* Social icons */}
          {visible.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {visible.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  style={{
                    width: '38px', height: '38px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--muted)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = s.color || 'var(--accent2)';
                    el.style.color = s.color || 'var(--accent2)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = 'var(--border)';
                    el.style.color = 'var(--muted)';
                  }}
                >
                  <i className={`fa-brands fa-${s.icon}`} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
