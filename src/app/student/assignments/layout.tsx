import type { ReactNode } from 'react';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';

export const dynamic = 'force-dynamic';

export default function AssignmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  requireAssignmentPreview();

  return (
    <WorkspaceShell assignments={listPreviewAssignments()}>
      {children}
    </WorkspaceShell>
  );
}
