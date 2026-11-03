import type { ReactNode } from 'react';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';
import { isAssignmentPreviewEnabled } from '@/features/student-assignments/selectors';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';
import { requireMember } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

export default async function AssignmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (
    isAssignmentPreviewEnabled(
      process.env.NODE_ENV,
      process.env.PLAYWRIGHT_ASSIGNMENT_FIXTURES,
    )
  ) {
    requireAssignmentPreview();
    return (
      <WorkspaceShell assignments={listPreviewAssignments()}>
        {children}
      </WorkspaceShell>
    );
  }
  await requireMember();
  return (
    <WorkspaceShell assignments={[]} authenticated>
      {children}
    </WorkspaceShell>
  );
}
