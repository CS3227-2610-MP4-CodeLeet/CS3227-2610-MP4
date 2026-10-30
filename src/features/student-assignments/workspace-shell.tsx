'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronRight,
  FileCode2,
  Menu,
  Terminal,
} from 'lucide-react';
import { createContext, useContext, type ReactNode } from 'react';
import { SignOutButton } from '@/features/auth/sign-out-button';
import type { AssignmentSummary } from './types';
import { ThemeButton, useWorkspaceTheme } from './workspace-theme';

const submissionsPath = '/student/submissions';
const AuthenticatedWorkspace = createContext(false);

function WorkspaceNavigation() {
  const authenticated = useContext(AuthenticatedWorkspace);
  const submissions = usePathname().startsWith(submissionsPath);
  return (
    <nav aria-label="Student navigation" className="space-y-2">
      <Link
        href="/student/assignments"
        aria-current={!submissions ? 'page' : undefined}
        className={navigationLinkStyle(!submissions)}
      >
        <BookOpen aria-hidden="true" className="size-4" />
        <span>Assignments</span>
      </Link>
      {authenticated && (
        <Link
          href="/student/submissions"
          aria-current={submissions ? 'page' : undefined}
          className={navigationLinkStyle(submissions)}
        >
          <FileCode2 aria-hidden="true" className="size-4" />
          <span>My submissions</span>
        </Link>
      )}
    </nav>
  );
}

function navigationLinkStyle(active: boolean) {
  return `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${active ? 'bg-cyan-50 dark:bg-cyan-950/60 font-semibold text-cyan-800 dark:text-cyan-300' : 'text-muted-foreground hover:bg-muted'}`;
}

function WorkspaceSidebar() {
  return (
    <aside
      aria-label="Workspace sidebar"
      className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 dark:border-slate-700 bg-[#f6f8fa] dark:bg-[#111b2b] lg:flex"
    >
      <Link
        href="/student/assignments"
        className="flex min-h-24 shrink-0 items-center gap-2.5 border-b border-slate-200 dark:border-slate-700 px-6 py-7 text-lg font-semibold tracking-tight"
      >
        <span className="rounded-lg bg-cyan-700 p-1.5 text-white">
          <Terminal aria-hidden="true" className="size-5" />
        </span>{' '}
        CodeLeet
      </Link>
      <div className="px-4 py-5">
        <WorkspaceNavigation />
      </div>
      {!useContext(AuthenticatedWorkspace) && (
        <p className="mt-auto border-t px-7 py-4 text-xs text-muted-foreground">
          Local preview · sample data
        </p>
      )}
    </aside>
  );
}

function WorkspaceMenu({ pathname }: { pathname: string }) {
  return (
    <details key={pathname} className="relative shrink-0">
      <summary
        aria-label="Workspace menu"
        className="flex cursor-pointer list-none items-center gap-2 rounded-md border bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
      >
        <Menu aria-hidden="true" className="size-4" /> Menu
      </summary>
      <div className="absolute top-full right-0 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border bg-white dark:bg-slate-900 p-3 shadow-lg">
        <WorkspaceNavigation />
      </div>
    </details>
  );
}

function WorkspaceHeader({
  pathname,
  current,
  theme,
}: {
  pathname: string;
  current?: AssignmentSummary;
  theme: 'light' | 'dark';
}) {
  const submissions = pathname.startsWith(submissionsPath);
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-4 border-b bg-background px-4 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground sm:text-sm">
        <Link
          href={submissions ? submissionsPath : '/student/assignments'}
          className="shrink-0 text-cyan-800 dark:text-cyan-300 hover:underline"
        >
          {submissions ? 'My submissions' : 'Assignments'}
        </Link>
        {current && (
          <>
            <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{current.title}</span>
          </>
        )}
      </div>
      <div
        role="group"
        className="ml-auto flex shrink-0 items-center gap-2"
        aria-label="Workspace controls"
      >
        {useContext(AuthenticatedWorkspace) && <SignOutButton />}
        <WorkspaceMenu pathname={pathname} />
        <ThemeButton theme={theme} />
      </div>
    </header>
  );
}

function PreviewNotice() {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-amber-200/80 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/50 px-4 py-2.5 text-xs leading-5 text-amber-950 dark:text-amber-200">
      <span className="font-semibold">Preview with sample assignments.</span>
      <span>Code stays on this page.</span>
    </p>
  );
}

export function WorkspaceShell({
  children,
  assignments,
  authenticated = false,
}: {
  children: ReactNode;
  assignments: readonly AssignmentSummary[];
  authenticated?: boolean;
}) {
  const pathname = usePathname();
  const theme = useWorkspaceTheme();
  const current = assignments.find(
    (item) => pathname === `/student/assignments/${item.id}`,
  );
  return (
    <AuthenticatedWorkspace.Provider value={authenticated}>
      <div
        data-theme={theme}
        className={`student-workspace min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 ${theme === 'dark' ? 'dark' : ''}`}
      >
        <a
          href="#student-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-white dark:focus:bg-slate-900 focus:p-3"
        >
          Skip to content
        </a>
        <WorkspaceSidebar />
        <div className="min-w-0 lg:ml-60">
          <WorkspaceHeader
            pathname={pathname}
            current={current}
            theme={theme}
          />
          <main
            id="student-content"
            tabIndex={-1}
            className="mx-auto max-w-[1200px] space-y-5 px-4 py-5 outline-none sm:px-8 sm:py-6"
          >
            {!authenticated && <PreviewNotice />}
            {children}
          </main>
        </div>
      </div>
    </AuthenticatedWorkspace.Provider>
  );
}
