import type { ReactNode } from 'react';
import { requireForumMember } from '@/features/forums/access.server';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';
import { AppHeader } from '@/components/layout/app-header';

export const dynamic = 'force-dynamic';

export default async function ForumsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { role } = await requireForumMember();
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
