'use client';

import { useConfigStore } from '@/lib/store/configStore';
import { useEditorStore } from '@/lib/store/editorStore';
import { api } from '@/lib/api/client';
import type { Section } from '@/types/config';

const SECTION_ICONS: Record<string, string> = {
  hero:       'house',
  about:      'user',
  skills:     'code',
  experience: 'briefcase',
  education:  'graduation-cap',
  projects:   'folder-open',
  socials:    'share-nodes',
  contact:    'envelope',
  settings:   'gear',
  media:      'photo-film',
  password:   'key',
};

const SECTIONS_WITH_EDITORS = [
  'hero', 'about', 'skills', 'experience', 'education', 'projects', 'socials', 'contact'
];
const EXTRA_PAGES = [
  { id: 'sections', label: 'Sections', icon: 'list-check' },
  { id: 'media', label: 'Media Library', icon: 'photo-film' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
  { id: 'password', label: 'Password', icon: 'key' },
];

export default function AdminSidebar() {
  const config = useConfigStore((s) => s.config);
  const updateSection = useConfigStore((s) => s.updateSection);
  const { activeSection, setActiveSection } = useEditorStore();

  const sections = config?.sections
    ? [...config.sections].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const toggleVisibility = async (section: Section) => {
    const newVisible = !section.visible;
    updateSection(section.id, { visible: newVisible });
    try {
      await api.put(`/sections/${section.id}`, { visible: newVisible });
    } catch { /* revert handled by undo */ }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Page Sections
        </p>
      </div>

      {/* Sections list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
        {sections.map((section) => (
          <div
            key={section.id}
            onClick={() => setActiveSection(section.type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: activeSection === section.type ? 'rgba(78,205,196,0.1)' : 'transparent',
              border: `1px solid ${activeSection === section.type ? 'rgba(78,205,196,0.3)' : 'transparent'}`,
              marginBottom: '2px',
              transition: 'all 0.15s',
            }}
          >
            <i
              className="fa-solid fa-grip-vertical"
              style={{ color: 'var(--border)', fontSize: '0.7rem', cursor: 'grab' }}
            />
            <i
              className={`fa-solid fa-${SECTION_ICONS[section.type] || 'circle'}`}
              style={{ color: activeSection === section.type ? 'var(--accent2)' : 'var(--muted)', fontSize: '0.8rem', width: '14px' }}
            />
            <span style={{
              flex: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: activeSection === section.type ? 'var(--text)' : 'var(--muted)',
            }}>
              {section.nav_label || section.type}
            </span>
            {/* Visibility toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleVisibility(section); }}
              title={section.visible ? 'Hide section' : 'Show section'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: section.visible ? 'var(--accent2)' : 'var(--border)',
                fontSize: '0.75rem',
                padding: '2px',
                lineHeight: 1,
              }}
            >
              <i className={`fa-solid fa-eye${section.visible ? '' : '-slash'}`} />
            </button>
          </div>
        ))}

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0.25rem' }} />

        {/* Extra pages */}
        {EXTRA_PAGES.map((page) => (
          <div
            key={page.id}
            onClick={() => setActiveSection(page.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: activeSection === page.id ? 'rgba(255,107,107,0.08)' : 'transparent',
              border: `1px solid ${activeSection === page.id ? 'rgba(255,107,107,0.2)' : 'transparent'}`,
              marginBottom: '2px',
              transition: 'all 0.15s',
            }}
          >
            <i
              className={`fa-solid fa-${page.icon}`}
              style={{ color: activeSection === page.id ? 'var(--accent1)' : 'var(--muted)', fontSize: '0.8rem', width: '14px', marginLeft: '14px' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: activeSection === page.id ? 'var(--text)' : 'var(--muted)' }}>
              {page.label}
            </span>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
          <i className="fa-solid fa-info-circle" style={{ marginRight: '0.375rem' }} />
          Click a section to edit it
        </p>
      </div>
    </div>
  );
}
