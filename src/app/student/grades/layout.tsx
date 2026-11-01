import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/verified-user';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';

export const dynamic = 'force-dynamic';

export default async function GradesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole('student');
  return (
    <WorkspaceShell assignments={[]} authenticated>
      {children}
    </WorkspaceShell>
  );
}
