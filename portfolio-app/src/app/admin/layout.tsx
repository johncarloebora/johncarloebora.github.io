export const runtime = 'edge';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth is handled by middleware — no redirect loop here
  return <>{children}</>;
}
