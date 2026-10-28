import type { ReactNode } from 'react';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';
import { isAssignmentPreviewEnabled } from '@/features/student-assignments/selectors';
import { WorkspaceShell } from '@/features/student-assignments/workspace-shell';
import { requireRole } from '@/lib/auth/verified-user';
import Link from 'next/link';
import { SignOutButton } from '@/features/auth/auth-form';

export const dynamic = 'force-dynamic';

export default async function AssignmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (
    isAssignmentPreviewEnabled(
      process.env.NODE_ENV,
      process.env.STUDENT_PREVIEW_ENABLED,
    )
  ) {
    requireAssignmentPreview();
    return (
      <WorkspaceShell assignments={listPreviewAssignments()}>
        {children}
      </WorkspaceShell>
    );
  }
  await requireRole('student');
  return (
    <div>
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-5">
          <Link href="/student/assignments" className="font-semibold">
            CodeMentor · Student
          </Link>
          <Link className="text-sm underline" href="/ai/usage">
            AI usage
          </Link>
        </div>
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
