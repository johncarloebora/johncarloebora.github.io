import { redirect } from 'next/navigation';
import { getToken } from '@/lib/utils/auth';
import { workerGet } from '@/lib/api/server';
import AdminDashboardClient from '@/components/admin/layout/AdminDashboardClient';
import type { SiteConfig } from '@/types/config';

export default async function DashboardPage() {
  const token = await getToken();
  if (!token) redirect('/admin/login');

  let config: SiteConfig | null = null;
  try {
    config = await workerGet<SiteConfig>('/api/config');
  } catch {
    // Config might not exist yet — start with empty shell
  }

  return <AdminDashboardClient initialConfig={config} />;
}
