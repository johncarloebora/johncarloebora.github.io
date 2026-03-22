'use client';

import { useEditorStore } from '@/lib/store/editorStore';
import HeroEditor from '../editors/HeroEditor';
import AboutEditor from '../editors/AboutEditor';
import SkillsEditor from '../editors/SkillsEditor';
import ExperienceEditor from '../editors/ExperienceEditor';
import EducationEditor from '../editors/EducationEditor';
import ProjectsEditor from '../editors/ProjectsEditor';
import SocialsEditor from '../editors/SocialsEditor';
import ContactEditor from '../editors/ContactEditor';
import SettingsEditor from '../editors/SettingsEditor';
import MediaLibrary from '../editors/MediaLibrary';
import PasswordEditor from '../editors/PasswordEditor';
import SectionsEditor from '../editors/SectionsEditor';

const EDITOR_MAP: Record<string, React.ComponentType> = {
  hero:       HeroEditor,
  about:      AboutEditor,
  skills:     SkillsEditor,
  experience: ExperienceEditor,
  education:  EducationEditor,
  projects:   ProjectsEditor,
  socials:    SocialsEditor,
  contact:    ContactEditor,
  settings:   SettingsEditor,
  media:      MediaLibrary,
  password:   PasswordEditor,
  sections:   SectionsEditor,
};

export default function ControlPanel() {
  const activeSection = useEditorStore((s) => s.activeSection);

  if (!activeSection) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
        <i className="fa-solid fa-hand-pointer" style={{ fontSize: '2.5rem', color: 'var(--muted)', marginBottom: '1rem' }} />
        <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Select a Section</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          Click any section in the left panel to start editing.
        </p>
      </div>
    );
  }

  const Editor = EDITOR_MAP[activeSection];

  if (!Editor) {
    return (
      <div style={{ padding: '1.5rem', color: 'var(--muted)' }}>
        <p>Editor for &ldquo;{activeSection}&rdquo; not found.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Panel header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Editing
        </p>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize' }}>
          {activeSection}
        </h3>
      </div>

      {/* Scrollable editor content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        <Editor />
      </div>
    </div>
  );
}
