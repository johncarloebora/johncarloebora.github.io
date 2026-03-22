'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api/client';

interface MediaItem {
  key: string;
  url: string;
  size: number;
  uploaded: string;
}

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/media');
      if (res.ok) {
        const data = await res.json() as MediaItem[] | { media: MediaItem[] };
        setMedia(Array.isArray(data) ? data : data.media ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { loadMedia(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'uploads');
    const res = await api.post('/media/upload', form);
    if (res.ok) await loadMedia();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopied(item.key);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteMedia = async (item: MediaItem) => {
    const name = item.key.split('/').pop();
    if (!confirm(`Delete ${name}?`)) return;
    await api.delete(`/media/${encodeURIComponent(item.key)}`);
    setMedia((m) => m.filter((x) => x.key !== item.key));
  };

  const isImage = (item: MediaItem) => /\.(jpe?g|png|gif|webp|svg)$/i.test(item.key);

  return (
    <div>
      {/* Upload */}
      <div
        style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem', cursor: 'pointer' }}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <><i className="fa-solid fa-spinner" style={{ marginRight: '0.5rem' }} />Uploading…</>
        ) : (
          <>
            <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.5rem', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Click to upload file</p>
          </>
        )}
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload} accept="image/*,video/*,.gif" />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
          <i className="fa-solid fa-spinner" />
        </div>
      ) : media.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>No media uploaded yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
          {media.map((item) => (
            <div key={item.key} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {isImage(item) ? (
                <Image src={item.url} alt={item.key} fill style={{ objectFit: 'cover' }} sizes="120px" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <i className="fa-solid fa-file-video" style={{ fontSize: '1.5rem', color: 'var(--muted)' }} />
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <button onClick={() => copyUrl(item)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.7rem' }}>
                  {copied === item.key ? '✓ Copied!' : 'Copy URL'}
                </button>
                <button onClick={() => deleteMedia(item)} style={{ background: 'rgba(255,100,100,0.3)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.7rem' }}>
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
