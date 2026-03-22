'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Project } from '@/types/config';

const WORKER = 'https://carlo-portfolio-api.johncarloebora.workers.dev';
const IMAGE_EXTS = new Set(['jpg','jpeg','png','webp','avif','gif','bmp','svg','tiff','tif','heic','heif']);
const VIDEO_EXTS = new Set(['mp4','webm','mov','avi','mkv','ogv']);

interface GalleryImage { src: string; alt: string; }

interface Props {
  projects: Project[];
  preview?: boolean;
}

async function scanFolder(folder: string, allowed: Set<string>): Promise<GalleryImage[] | null> {
  try {
    const res = await fetch(`${WORKER}/api/gallery/${encodeURIComponent(folder)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const items: Array<{ name: string; url: string; alt?: string }> = await res.json();
    return items
      .filter(m => allowed.has((m.name || '').split('.').pop()?.toLowerCase() ?? ''))
      .map(m => ({ src: m.url, alt: m.alt || m.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') }));
  } catch {
    return null;
  }
}

function GalleryModal({ images, onClose, onPreview }: {
  images: GalleryImage[];
  onClose: () => void;
  onPreview: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 10000, overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ position: 'relative', padding: '5rem 2rem 2rem' }}>
        <button
          onClick={onClose}
          style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem',
            width: 44, height: 44,
            background: 'rgba(30,30,30,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 10002,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            fontSize: '1.2rem',
          }}
        >
          <i className="fas fa-times" />
        </button>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '0.75rem',
          maxWidth: '1100px',
          margin: '0 auto',
        }}>
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => onPreview(i)}
              style={{
                aspectRatio: '1',
                overflow: 'hidden',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '2px solid transparent',
                transition: 'border-color 0.3s, transform 0.3s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent2)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ images, index, onClose, onNav }: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNav: (dir: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNav(-1);
      if (e.key === 'ArrowRight') onNav(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onNav]);

  const img = images[index];
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button onClick={onClose} style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', width: 44, height: 44, background: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', cursor: 'pointer', zIndex: 10002, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fas fa-times" />
      </button>
      <button onClick={() => onNav(-1)} style={{ position: 'fixed', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8592;</button>
      <button onClick={() => onNav(1)} style={{ position: 'fixed', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8594;</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.src} alt={img.alt} style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 80px rgba(0,0,0,0.8)' }} />
      <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', letterSpacing: '1px' }}>
        {index + 1} / {images.length}
      </div>
    </div>
  );
}

function VideoEmptyModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button onClick={onClose} style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', width: 44, height: 44, background: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', cursor: 'pointer', zIndex: 10002, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fas fa-times" />
      </button>
      <div style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ fontSize: '4.5rem', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <i className="fas fa-film" />
        </div>
        <h3 style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--text)' }}>Video Compositions</h3>
        <p style={{ color: 'var(--muted)', maxWidth: '380px', lineHeight: 1.75, fontSize: '0.95rem' }}>
          No videos available yet — projects are currently in production. Drop back soon to see what&apos;s cooking!
        </p>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent1)', padding: '0.35rem 1.1rem', border: '1px solid rgba(255,107,107,0.4)', borderRadius: '20px' }}>
          Coming Soon
        </span>
      </div>
    </div>
  );
}

function ProjectCard({ project, onOpenGallery }: { project: Project; onOpenGallery: (p: Project) => void }) {
  const isVideo = project.gallery_type === 'video';
  const hasGallery = !!project.gallery_folder;

  return (
    <div
      className="card reveal"
      style={{ padding: 0, overflow: 'hidden' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.4), var(--glow2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      {/* Thumbnail */}
      <div
        style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', cursor: hasGallery ? 'pointer' : 'default' }}
        onClick={() => hasGallery && onOpenGallery(project)}
        onMouseEnter={e => {
          const overlay = (e.currentTarget as HTMLElement).querySelector('.project-overlay') as HTMLElement;
          const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLElement;
          if (overlay) overlay.style.opacity = '1';
          if (img) img.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={e => {
          const overlay = (e.currentTarget as HTMLElement).querySelector('.project-overlay') as HTMLElement;
          const img = (e.currentTarget as HTMLElement).querySelector('img') as HTMLElement;
          if (overlay) overlay.style.opacity = '0';
          if (img) img.style.transform = '';
        }}
      >
        {project.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail_url}
            alt={project.title}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
            <i className="fas fa-image" style={{ fontSize: '2rem', color: 'var(--text)' }} />
          </div>
        )}
        {hasGallery && (
          <div
            className="project-overlay"
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              opacity: 0,
              transition: 'opacity 0.3s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{
              color: '#fff', fontWeight: 700, fontSize: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.4rem',
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: '50px',
              backdropFilter: 'blur(4px)',
            }}>
              <i className={isVideo ? 'fas fa-play-circle' : 'fas fa-images'} />
              {isVideo ? 'View Videos' : 'View Gallery'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {project.tags?.length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            {project.tags.map((tag, i) => (
              <span key={i} style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(78,205,196,0.12)', color: 'var(--accent2)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500, marginRight: '0.4rem', marginBottom: '0.4rem' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <h3 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{project.title}</h3>
        {project.description && (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>{project.description}</p>
        )}
        {project.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {project.skills.map((sk, i) => (
              <span key={i} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255,107,107,0.1)', color: 'var(--accent1)', borderRadius: '10px' }}>{sk}</span>
            ))}
          </div>
        )}
        {project.link_url && (
          <a href={project.link_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--accent2)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.75rem', textDecoration: 'none' }}>
            <i className="fas fa-external-link-alt" style={{ fontSize: '0.7rem' }} />
            {project.link_label || 'View Project'}
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProjectsSection({ projects, preview = false }: Props) {
  const visible = [...projects].sort((a, b) => a.sort_order - b.sort_order);

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVideoEmpty, setShowVideoEmpty] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const openGallery = useCallback(async (project: Project) => {
    if (preview) return;
    setLoading(true);
    const isVideo = project.gallery_type === 'video';
    const allowed = isVideo ? VIDEO_EXTS : IMAGE_EXTS;
    const imgs = await scanFolder(project.gallery_folder, allowed);
    setLoading(false);
    if (imgs && imgs.length > 0) {
      setGalleryImages(imgs);
      setShowGallery(true);
    } else if (isVideo) {
      setShowVideoEmpty(true);
    }
  }, [preview]);

  const openPreview = useCallback((index: number) => {
    const safe = ((index % galleryImages.length) + galleryImages.length) % galleryImages.length;
    setPreviewIndex(safe);
    setShowGallery(false);
    setShowPreview(true);
  }, [galleryImages.length]);

  const navPreview = useCallback((dir: number) => {
    setPreviewIndex(i => ((i + dir + galleryImages.length) % galleryImages.length));
  }, [galleryImages.length]);

  return (
    <section id="projects" className="section">
      <div className="container">
        <div className="section-header reveal">
          <span className="section-label">Projects</span>
          <h2 className="section-title">My Work</h2>
          <p className="section-subtitle">A showcase of projects spanning design, development, and automation.</p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--accent2)', padding: '2rem' }}>
            <i className="fas fa-spinner animate-spin" style={{ fontSize: '1.5rem' }} />
          </div>
        )}

        {visible.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>No projects to display yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {visible.map((p) => (
              <ProjectCard key={p.id} project={p} onOpenGallery={openGallery} />
            ))}
          </div>
        )}
      </div>

      {showGallery && (
        <GalleryModal
          images={galleryImages}
          onClose={() => setShowGallery(false)}
          onPreview={openPreview}
        />
      )}
      {showPreview && (
        <PreviewModal
          images={galleryImages}
          index={previewIndex}
          onClose={() => { setShowPreview(false); setShowGallery(true); }}
          onNav={navPreview}
        />
      )}
      {showVideoEmpty && (
        <VideoEmptyModal onClose={() => setShowVideoEmpty(false)} />
      )}
    </section>
  );
}
