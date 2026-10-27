'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronRight,
  Code2,
  House,
  Menu,
  Terminal,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { AssignmentSummary } from './types';
import { languageLabels } from './types';
import { ThemeButton, useWorkspaceTheme } from './workspace-theme';

export function WorkspaceShell({
  children,
  assignments,
}: {
  children: ReactNode;
  assignments: readonly AssignmentSummary[];
}) {
  const pathname = usePathname();
  const theme = useWorkspaceTheme();
  const current = assignments.find(
    (item) => pathname === `/student/assignments/${item.id}`,
  );
  function navigation() {
    return (
      <nav aria-label="Student navigation" className="space-y-5">
        <Link
          href="/student/assignments"
          aria-current={!current ? 'page' : undefined}
          className="flex items-center gap-3 rounded-md bg-cyan-50 dark:bg-cyan-950/60 px-3 py-2.5 text-sm font-semibold text-cyan-800 dark:text-cyan-300"
        >
          <BookOpen aria-hidden="true" className="size-4" /> Assignments
        </Link>
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            Published practice
          </p>
          {assignments.map((item) => (
            <Link
              key={item.id}
              href={`/student/assignments/${item.id}`}
              aria-current={current?.id === item.id ? 'page' : undefined}
              className={`mb-1 flex gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${current?.id === item.id ? 'bg-white dark:bg-slate-900 font-medium text-cyan-800 dark:text-cyan-300 ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-600 dark:text-slate-300'}`}
            >
              <Code2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">
                <span className="block leading-5">{item.title}</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  {languageLabels[item.language]}
                </span>
              </span>
            </Link>
          ))}
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <House aria-hidden="true" className="size-4" /> Home
        </Link>
      </nav>
    );
  }
  return (
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
      <aside
        aria-label="Workspace sidebar"
        className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 dark:border-slate-700 bg-[#f6f8fa] dark:bg-[#111b2b] lg:flex"
      >
        <Link
          href="/"
          className="flex h-16 items-center gap-2.5 border-b border-slate-200 dark:border-slate-700 px-5 text-lg font-semibold tracking-tight"
        >
          <span className="rounded-lg bg-cyan-700 p-1.5 text-white">
            <Terminal aria-hidden="true" className="size-5" />
          </span>{' '}
          CodeLeet
        </Link>
        <div className="px-4 py-5">{navigation()}</div>
        <p className="mt-auto border-t px-7 py-4 text-xs text-muted-foreground">
          Local preview · sample data
        </p>
      </aside>
      <div className="min-w-0 lg:ml-60">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-4 border-b bg-background px-4 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <Link
              href="/student/assignments"
              className="shrink-0 text-cyan-800 dark:text-cyan-300 hover:underline"
            >
              Assignments
            </Link>
            {current && (
              <>
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />
                <span className="truncate">{current.title}</span>
              </>
            )}
          </div>
          <div
            role="group"
            className="ml-auto flex shrink-0 items-center gap-2"
            aria-label="Workspace controls"
          >
            <details key={pathname} className="relative shrink-0">
              <summary
                aria-label="Workspace menu"
                className="flex cursor-pointer list-none items-center gap-2 rounded-md border bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
              >
                <Menu aria-hidden="true" className="size-4" /> Menu
              </summary>
              <div className="absolute top-full right-0 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border bg-white dark:bg-slate-900 p-3 shadow-lg">
                {navigation()}
              </div>
            </details>
            <ThemeButton theme={theme} />
          </div>
        </header>
        <main
          id="student-content"
          tabIndex={-1}
          className="mx-auto max-w-[1200px] space-y-5 px-4 py-5 outline-none sm:px-8 sm:py-6"
        >
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-amber-200/80 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/50 px-4 py-2.5 text-xs leading-5 text-amber-950 dark:text-amber-200">
            <span className="font-semibold">
              Preview with sample assignments.
            </span>
            <span>Code stays on this page.</span>
          </p>
          {children}
        </main>
      </div>
    </div>
  );
}
