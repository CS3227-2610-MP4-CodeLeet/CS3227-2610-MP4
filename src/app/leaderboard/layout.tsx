import type { ReactNode } from 'react';
import { requireMember } from '@/lib/auth/verified-user';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';
import { AppHeader } from '@/components/layout/app-header';

export const dynamic = 'force-dynamic';

export default async function LeaderboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { role } = await requireMember();
  if (role === 'student')
    return (
      <WorkspaceShell assignments={[]} authenticated>
        {children}
      </WorkspaceShell>
    );
  return (
    <div>
      <AppHeader role={role} />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-8">
        {children}
      </main>
    </div>
  );
}
