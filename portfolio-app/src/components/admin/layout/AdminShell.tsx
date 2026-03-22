'use client';

import { useEditorStore } from '@/lib/store/editorStore';
import { useConfigStore } from '@/lib/store/configStore';
// zundo temporal store accessed via useStore

import AdminSidebar from './AdminSidebar';
import ControlPanel from './ControlPanel';
import PreviewPanel from './PreviewPanel';
import PublishButton from '../shared/PublishButton';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';

export default function AdminShell() {
  const { previewViewport, setPreviewViewport, leftPanelOpen, setLeftPanelOpen, rightPanelOpen, setRightPanelOpen } = useEditorStore();
  const isDirty = useConfigStore((s) => s.isDirty);
  const temporal = useConfigStore.temporal.getState();
  const { undo, redo, pastStates, futureStates } = temporal;
  const router = useRouter();

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    router.push('/admin/login');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <header style={{
        height: '52px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '0.75rem',
        background: 'var(--surface)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ fontWeight: 800, fontSize: '1rem', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginRight: '0.5rem' }}>
          CE Admin
        </div>

        {/* Panel toggles */}
        <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} title="Toggle sidebar" style={iconBtn}>
          <i className="fa-solid fa-sidebar" />
        </button>

        {/* Viewport */}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          {(['mobile', 'tablet', 'desktop'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPreviewViewport(v)}
              title={v}
              style={{
                ...iconBtn,
                background: previewViewport === v ? 'var(--surface2)' : 'transparent',
                color: previewViewport === v ? 'var(--accent2)' : 'var(--muted)',
              }}
            >
              <i className={`fa-solid fa-${v === 'mobile' ? 'mobile-screen-button' : v === 'tablet' ? 'tablet-screen-button' : 'desktop'}`} />
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          <button onClick={() => undo()} disabled={pastStates.length === 0} title="Undo" style={{ ...iconBtn, opacity: pastStates.length === 0 ? 0.3 : 1 }}>
            <i className="fa-solid fa-rotate-left" />
          </button>
          <button onClick={() => redo()} disabled={futureStates.length === 0} title="Redo" style={{ ...iconBtn, opacity: futureStates.length === 0 ? 0.3 : 1 }}>
            <i className="fa-solid fa-rotate-right" />
          </button>
        </div>

        {isDirty && (
          <span style={{ fontSize: '0.75rem', color: 'var(--accent1)', marginLeft: '0.25rem' }}>
            <i className="fa-solid fa-circle" style={{ fontSize: '0.5rem', marginRight: '0.375rem' }} />
            Unsaved
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ ...iconBtn, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-arrow-up-right-from-square" />
          </a>

          <PublishButton />

          <button onClick={handleLogout} title="Sign out" style={{ ...iconBtn, color: 'var(--muted)' }}>
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </header>

      {/* 3-panel body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        {leftPanelOpen && (
          <aside style={{
            width: '260px',
            borderRight: '1px solid var(--border)',
            background: 'var(--surface)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}>
            <AdminSidebar />
          </aside>
        )}

        {/* Center preview */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface2)', position: 'relative' }}>
          <PreviewPanel />
        </main>

        {/* Right panel */}
        {rightPanelOpen && (
          <aside style={{
            width: '360px',
            borderLeft: '1px solid var(--border)',
            background: 'var(--surface)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}>
            <ControlPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: '32px', height: '32px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.85rem',
  transition: 'all 0.15s',
};
