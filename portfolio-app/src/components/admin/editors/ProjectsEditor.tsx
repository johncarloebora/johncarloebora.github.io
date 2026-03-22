'use client';

import { useState } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';
import { FieldGroup, TextInput, TextArea, Toggle, Select, SaveBtn, Divider } from '../shared/FieldGroup';
import type { Project } from '@/types/config';

function ProjectCard({ project, onUpdate, onDelete }: { project: Project; onUpdate: (u: Partial<Project>) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    onUpdate({ tags: [...(project.tags || []), t] });
    setTagInput('');
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 0.875rem', cursor: 'pointer', background: 'var(--surface2)' }}>
        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600 }}>{project.title || 'Untitled Project'}</span>
        <Toggle checked={project.visible ?? true} onChange={(v) => onUpdate({ visible: v })} label="" />
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
          <i className="fa-solid fa-trash" style={{ fontSize: '0.8rem' }} />
        </button>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--muted)', fontSize: '0.7rem' }} />
      </div>
      {open && (
        <div style={{ padding: '0.875rem' }}>
          <FieldGroup label="Title"><TextInput value={project.title} onChange={(v) => onUpdate({ title: v })} /></FieldGroup>
          <FieldGroup label="Description"><TextArea value={project.description} onChange={(v) => onUpdate({ description: v })} /></FieldGroup>
          <FieldGroup label="Thumbnail URL" hint="Paste URL from Media Library">
            <TextInput value={project.thumbnail_url} onChange={(v) => onUpdate({ thumbnail_url: v })} placeholder="https://..." />
          </FieldGroup>
          <FieldGroup label="Gallery Folder"><TextInput value={project.gallery_folder} onChange={(v) => onUpdate({ gallery_folder: v })} placeholder="layout" /></FieldGroup>
          <FieldGroup label="Gallery Type">
            <Select value={project.gallery_type} onChange={(v) => onUpdate({ gallery_type: v as 'images' | 'videos' })} options={[{ value: 'images', label: 'Images' }, { value: 'videos', label: 'Videos' }]} />
          </FieldGroup>
          <FieldGroup label="Link URL"><TextInput value={project.link_url ?? ""} onChange={(v) => onUpdate({ link_url: v })} /></FieldGroup>
          <FieldGroup label="Link Label"><TextInput value={project.link_label ?? ""} onChange={(v) => onUpdate({ link_label: v })} placeholder="View Project" /></FieldGroup>

          <Divider label="Tags" />
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} placeholder="Add tag…" style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.85rem', outline: 'none' }} />
            <button onClick={addTag} className="btn btn-outline" style={{ height: '32px', padding: '0 0.625rem' }}>+</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {(project.tags || []).map((tag, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: '999px', background: 'rgba(78,205,196,0.1)', color: 'var(--accent2)', fontSize: '0.75rem' }}>
                {tag}
                <button onClick={() => onUpdate({ tags: project.tags.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsEditor() {
  const config = useConfigStore((s) => s.config);
  const updateProject = useConfigStore((s) => s.updateProject);
  const removeProject = useConfigStore((s) => s.removeProject);
  const addProject = useConfigStore((s) => s.addProject);
  const [saving, setSaving] = useState(false);

  if (!config) return null;

  const sorted = [...config.projects].sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = async () => {
    const res = await api.post('/projects', { title: 'New Project', description: '', thumbnail_url: '', gallery_folder: '', gallery_type: 'images', tags: [], skills: [], link_url: '', link_label: '', sort_order: sorted.length });
    if (res.ok) {
      const data = await res.json();
      addProject({ ...data, tags: [], skills: [] });
    }
  };

  const handleUpdate = async (id: number, updates: Partial<Project>) => {
    updateProject(id, updates);
  };

  const handleDelete = async (id: number) => {
    removeProject(id);
    await api.delete(`/projects/${id}`);
  };

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(sorted.map((p) => api.put(`/projects/${p.id}`, p)));
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {sorted.length} Projects
        </span>
        <button onClick={handleAdd} className="btn btn-outline" style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.75rem' }}>
          <i className="fa-solid fa-plus" /> Add
        </button>
      </div>
      {sorted.map((p) => (
        <ProjectCard key={p.id} project={p} onUpdate={(u) => handleUpdate(p.id, u)} onDelete={() => handleDelete(p.id)} />
      ))}
      <SaveBtn onClick={saveAll} saving={saving} />
    </div>
  );
}
