'use client';

import Image from 'next/image';
import type { Project } from '@/types/config';

interface Props {
  projects: Project[];
  preview?: boolean;
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="card reveal" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: '180px', background: 'var(--surface2)' }}>
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 380px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.3,
          }}>
            <i className="fa-solid fa-image" style={{ fontSize: '2rem', color: 'var(--text)' }} />
          </div>
        )}
        {/* Gallery badge */}
        {project.gallery_folder && (
          <span style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            fontSize: '0.7rem',
            backdropFilter: 'blur(8px)',
          }}>
            <i className={`fa-solid fa-${project.gallery_type === 'videos' ? 'play' : 'images'}`} style={{ marginRight: '0.25rem' }} />
            Gallery
          </span>
        )}
      </div>

      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{project.title}</h3>
        {project.description && (
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.875rem' }}>
            {project.description}
          </p>
        )}

        {/* Tags */}
        {project.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
            {project.tags.map((tag, i) => (
              <span key={i} style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: 'rgba(78,205,196,0.1)',
                color: 'var(--accent2)',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}>{tag}</span>
            ))}
          </div>
        )}

        {project.link_url && (
          <a
            href={project.link_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              color: 'var(--accent1)', fontSize: '0.85rem', fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {project.link_label || 'View Project'}
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.7rem' }} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProjectsSection({ projects, preview = false }: Props) {
  const visible = projects.filter((p) => p.visible).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id="projects" className="section">
      <div className="container">
        <div className="section-header reveal">
          <span className="section-label">Projects</span>
          <h2 className="section-title">My Work</h2>
          <p className="section-subtitle">A showcase of projects spanning design, development, and automation.</p>
        </div>

        {visible.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>No projects to display yet.</p>
        ) : (
          <div className="grid-auto-md">
            {visible.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
