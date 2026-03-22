'use client';

import { useEffect } from 'react';
import { useConfigStore } from '@/lib/store/configStore';
import { useEditorStore } from '@/lib/store/editorStore';
import type { SiteConfig } from '@/types/config';
import AdminShell from './AdminShell';

interface Props {
  initialConfig: SiteConfig | null;
}

export default function AdminDashboardClient({ initialConfig }: Props) {
  const setConfig = useConfigStore((s) => s.setConfig);

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig, setConfig]);

  return <AdminShell />;
}
