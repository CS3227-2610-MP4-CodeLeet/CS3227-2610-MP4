import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAssignmentPreview } from '@/features/student-assignments/preview.server';

export const dynamic = 'force-dynamic';

export default function AssignmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  requireAssignmentPreview();

  return (
    <>
      <a
        href="#student-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b bg-card">
        <nav
          aria-label="Student navigation"
          className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-5"
        >
          <Link href="/" className="font-semibold tracking-tight">
            CodeLeet
          </Link>
          <Link
            href="/student/assignments"
            className="text-sm font-medium underline underline-offset-4"
          >
            Assignments
          </Link>
        </nav>
      </header>
      <main
        id="student-content"
        className="mx-auto max-w-5xl space-y-8 px-6 py-8 sm:py-12"
      >
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Preview with sample assignments. No account data is shown and changes
          are not saved.
        </p>
        {children}
      </main>
    </>
  );
}
