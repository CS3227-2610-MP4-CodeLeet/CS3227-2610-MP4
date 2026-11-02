import type { ReactNode } from 'react';
import { requireMember } from '@/lib/auth/verified-user';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';
import InstructorLayout from '@/app/instructor/layout';
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
    <InstructorLayout>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-8">
        {children}
      </main>
    </InstructorLayout>
  );
}
