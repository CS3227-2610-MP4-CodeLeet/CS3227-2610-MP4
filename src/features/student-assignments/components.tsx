import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Code2 } from 'lucide-react';
import type { AssignmentDetail, AssignmentSummary } from './types';
import { languageLabels } from './types';

const linkStyle =
  'inline-flex items-center gap-2 rounded-md text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';

export function AssignmentList({
  assignments,
}: {
  assignments: readonly AssignmentSummary[];
}) {
  return (
    <section aria-labelledby="assignments-heading" className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
          Practice library
        </p>
        <h1
          id="assignments-heading"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Your assignments
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Choose a problem, read the instructions, then work on your solution.
        </p>
      </header>
      {assignments.length === 0 ? (
        <EmptyAssignments />
      ) : (
        <AssignmentTable assignments={assignments} />
      )}
    </section>
  );
}

function EmptyAssignments() {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <BookOpen
        aria-hidden="true"
        className="mx-auto mb-4 size-8 text-muted-foreground"
      />
      <h2 className="text-lg font-semibold">No assignments yet</h2>
      <p className="mt-2 text-muted-foreground">
        Published assignments will appear here when they are available.
      </p>
    </div>
  );
}

function AssignmentTable({
  assignments,
}: {
  assignments: readonly AssignmentSummary[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/30 dark:shadow-none">
      <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
        <h2 className="text-sm font-semibold">Published assignments</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {assignments.length} available
        </span>
      </div>
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">Published programming assignments</caption>
        <thead className="border-b bg-slate-50 dark:bg-slate-950/60 text-xs font-medium text-slate-500 dark:text-slate-400">
          <tr>
            <th scope="col" className="w-auto px-4 py-3 font-medium sm:px-6">
              Problem
            </th>
            <th scope="col" className="w-20 px-2 py-3 font-medium sm:w-28">
              Language
            </th>
            <th
              scope="col"
              className="hidden w-28 px-2 py-3 font-medium md:table-cell"
            >
              Visibility
            </th>
            <th
              scope="col"
              className="w-20 px-3 py-3 text-right font-medium sm:w-28 sm:px-6"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {assignments.map((assignment, index) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              index={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignmentRow({
  assignment,
  index,
}: {
  assignment: AssignmentSummary;
  index: number;
}) {
  const href = `/student/assignments/${assignment.id}`;
  return (
    <tr className="group hover:bg-cyan-50/40 dark:hover:bg-cyan-950/40">
      <td className="px-4 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="hidden pt-0.5 font-mono text-xs text-slate-400 dark:text-slate-400 sm:block">
            {String(index + 1).padStart(2, '0')}
          </span>
          <Link
            href={href}
            className="break-words font-medium leading-6 text-cyan-800 dark:text-cyan-300 hover:underline"
          >
            {assignment.title}
          </Link>
        </div>
      </td>
      <td className="px-2 py-5 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <Code2 aria-hidden="true" className="hidden size-3.5 sm:block" />
          {languageLabels[assignment.language]}
        </span>
      </td>
      <td className="hidden px-2 py-5 text-xs text-slate-500 dark:text-slate-400 md:table-cell">
        Published
      </td>
      <td className="px-3 py-5 text-right sm:px-6">
        <Link
          href={href}
          aria-label={`View assignment: ${assignment.title}`}
          className="inline-flex items-center gap-1 rounded-md border border-cyan-200 dark:border-cyan-800 px-2.5 py-1.5 text-xs font-medium text-cyan-800 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          View
          <ArrowRight aria-hidden="true" className="hidden size-3.5 sm:block" />
        </Link>
      </td>
    </tr>
  );
}

export function AssignmentInstructions({
  assignment,
}: {
  assignment: AssignmentDetail;
}) {
  return (
    <article className="space-y-5">
      <Link
        href="/student/assignments"
        className={`${linkStyle} text-slate-500 dark:text-slate-400`}
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> All assignments
      </Link>
      <section
        aria-labelledby="instructions-heading"
        className="overflow-hidden rounded-lg border bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/30 dark:shadow-none"
      >
        <header className="space-y-2 border-b px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold tracking-wide text-cyan-800 dark:text-cyan-300">
              {languageLabels[assignment.language]} assignment
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Published problem
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {assignment.title}
          </h1>
        </header>
        <div className="px-5 py-4 sm:px-6">
          <h2
            id="instructions-heading"
            className="mb-4 text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase"
          >
            Instructions
          </h2>
          <div className="max-w-4xl whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">
            {assignment.instructions}
          </div>
        </div>
      </section>
    </article>
  );
}
