'use client';

import { useConfigStore } from '@/lib/store/configStore';
import { useEditorStore } from '@/lib/store/editorStore';
import PortfolioPage from '@/components/portfolio/PortfolioPage';

const VIEWPORT_WIDTHS = {
  mobile:  390,
  tablet:  768,
  desktop: '100%',
};

export default function PreviewPanel() {
  const config = useConfigStore((s) => s.config);
  const { previewViewport } = useEditorStore();

  if (!config) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-spinner animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }} />
          <p>Loading preview…</p>
        </div>
      </div>
    );
  }

  const width = VIEWPORT_WIDTHS[previewViewport];
  const isNarrow = previewViewport !== 'desktop';

  return (
    <div style={{ height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', padding: isNarrow ? '1rem' : 0 }}>
      <div style={{
        width: typeof width === 'number' ? `${width}px` : width,
        maxWidth: '100%',
        background: 'var(--bg)',
        boxShadow: isNarrow ? '0 0 0 1px var(--border), 0 8px 32px rgba(0,0,0,0.4)' : 'none',
        borderRadius: isNarrow ? 'var(--radius)' : 0,
        overflow: 'hidden',
        minHeight: '100%',
        position: 'relative',
      }}>
        <PortfolioPage config={config} preview />
      </div>
    </div>
  );
}
