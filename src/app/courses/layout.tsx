import type { ReactNode } from 'react';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';

export const dynamic = 'force-dynamic';

export default async function CoursesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, role } = await getVerifiedUserRole();
  if (!user) redirect('/sign-in');
  return (
    <div className="min-h-screen">
      <AppHeader role={role} />
      {children}
    </div>
  );
}
