import type { ReactNode } from 'react';
import { requireMember } from '@/lib/auth/verified-user';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';

export const dynamic = 'force-dynamic';

export default async function GradesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireMember();
  return (
    <WorkspaceShell assignments={[]} authenticated>
      {children}
    </WorkspaceShell>
  );
}
