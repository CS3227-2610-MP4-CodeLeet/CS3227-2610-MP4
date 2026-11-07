import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/verified-user';
import { AppHeader } from '@/components/layout/app-header';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole('admin');
  return (
    <div>
      <AppHeader role="admin" />
      {children}
    </div>
  );
}
