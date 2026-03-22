import { redirect } from 'next/navigation';
import { getToken } from '@/lib/utils/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = await getToken();

  // Token check — Worker verifies full validity on each API call
  if (!token) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
