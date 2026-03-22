'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api/client';
import type { MediaItem } from '@/types/config';

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/media${folder ? `?folder=${folder}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || data || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { loadMedia(); }, [folder]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder || 'uploads');
    const res = await api.post('/media/upload', form);
    if (res.ok) await loadMedia();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(`Delete ${item.filename}?`)) return;
    await api.delete(`/media/${item.id}`);
    setMedia((m) => m.filter((x) => x.id !== item.id));
  };

  // Group by folder
  const folders = [...new Set(media.map((m) => m.folder))];

  return (
    <div>
      {/* Upload */}
      <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem', cursor: 'pointer' }}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <><i className="fa-solid fa-spinner animate-spin" style={{ marginRight: '0.5rem' }} />Uploading…</>
        ) : (
          <>
            <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.5rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Click to upload file</p>
          </>
        )}
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload} accept="image/*,video/*,.gif" />
      </div>

      {/* Folder filter */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button onClick={() => setFolder('')} className={`btn btn-outline`} style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.75rem', background: folder === '' ? 'var(--surface2)' : 'transparent' }}>All</button>
        {folders.map((f) => (
          <button key={f} onClick={() => setFolder(f)} className="btn btn-outline" style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.75rem', background: folder === f ? 'var(--surface2)' : 'transparent' }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
          <i className="fa-solid fa-spinner animate-spin" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
          {media.map((item) => (
            <div key={item.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {item.mime_type?.startsWith('image') ? (
                <Image src={item.url} alt={item.alt_text || item.filename} fill style={{ objectFit: 'cover' }} sizes="120px" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <i className="fa-solid fa-file-video" style={{ fontSize: '1.5rem', color: 'var(--muted)' }} />
                </div>
              )}
              {/* Hover actions */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <button
                  onClick={() => copyUrl(item)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  {copied === item.id ? '✓ Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={() => deleteMedia(item)}
                  style={{ background: 'rgba(255,100,100,0.3)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
