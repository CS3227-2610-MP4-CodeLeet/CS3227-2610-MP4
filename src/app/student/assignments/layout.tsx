import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import type { ReactNode } from 'react';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';
import { isAssignmentPreviewEnabled } from '@/features/student-assignments/selectors';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';
import { requireRole } from '@/lib/auth/verified-user';

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
  const { supabase } = await requireRole('student');
  const { data, error } = await supabase
    .from('assignments')
    .select('id,title,language,publication_status')
    .eq('publication_status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Assignments could not be loaded.');
  const assignments = (data ?? []).map((assignment) => ({
    ...assignment,
    language: assignmentLanguageSchema.parse(assignment.language),
    publication_status: 'published' as const,
  }));
  return (
    <WorkspaceShell assignments={assignments} authenticated>
      {children}
    </WorkspaceShell>
  );
}
