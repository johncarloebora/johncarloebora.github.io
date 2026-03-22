import type { SiteConfig } from '@/types/config';
import PortfolioPage from '@/components/portfolio/PortfolioPage';

// ISR: revalidate every 60 seconds (publish triggers on-demand revalidation too)
export const revalidate = 60;

const WORKER = 'https://carlo-portfolio-api.johncarloebora.workers.dev';

async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const res = await fetch(`${WORKER}/api/config`, {
      next: { revalidate: 60, tags: ['site-config'] },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const config = await getSiteConfig();

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <p style={{ color: 'var(--muted)' }}>Loading portfolio…</p>
      </div>
    );
  }

  return <PortfolioPage config={config} />;
}
