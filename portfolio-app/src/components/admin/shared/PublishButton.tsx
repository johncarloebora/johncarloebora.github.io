'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/store/editorStore';
import { useConfigStore } from '@/lib/store/configStore';
import { api } from '@/lib/api/client';

export default function PublishButton() {
  const { isPublishing, setIsPublishing } = useEditorStore();
  const markClean = useConfigStore((s) => s.markClean);
  const [status, setStatus] = useState<'idle' | 'published'>('idle');

  const handlePublish = async () => {
    setIsPublishing(true);
    setStatus('idle');
    try {
      const res = await api.post('/publish');
      if (res.ok) {
        // Trigger ISR revalidation
        await fetch(`/api/revalidate?secret=${process.env.NEXT_PUBLIC_REVALIDATE_SECRET ?? ''}`, {
          credentials: 'same-origin',
        }).catch(() => {});
        markClean();
        setStatus('published');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch { /* silent */ }
    setIsPublishing(false);
  };

  return (
    <button
      onClick={handlePublish}
      disabled={isPublishing}
      className="btn btn-primary"
      style={{ height: '32px', padding: '0 1rem', fontSize: '0.8rem', gap: '0.375rem' }}
    >
      {isPublishing ? (
        <><i className="fa-solid fa-spinner animate-spin" /> Publishing…</>
      ) : status === 'published' ? (
        <><i className="fa-solid fa-check" /> Published!</>
      ) : (
        <><i className="fa-solid fa-rocket" /> Publish</>
      )}
    </button>
  );
}
