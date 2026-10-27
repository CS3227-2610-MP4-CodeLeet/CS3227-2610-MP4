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
    <section aria-labelledby="assignments-heading" className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Student workspace
        </p>
        <h1
          id="assignments-heading"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Your assignments
        </h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          Choose an assignment to read its instructions and requirements.
        </p>
      </header>
      {assignments.length === 0 ? (
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
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="flex flex-col rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Code2 aria-hidden="true" className="size-4" />
                <span>{languageLabels[assignment.language]}</span>
              </div>
              <h2 className="mb-6 text-xl font-semibold">{assignment.title}</h2>
              <Link
                href={`/student/assignments/${assignment.id}`}
                className={`${linkStyle} mt-auto self-start`}
                aria-label={`View assignment: ${assignment.title}`}
              >
                View assignment{' '}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AssignmentInstructions({
  assignment,
}: {
  assignment: AssignmentDetail;
}) {
  return (
    <article className="space-y-8">
      <Link href="/student/assignments" className={linkStyle}>
        <ArrowLeft aria-hidden="true" className="size-4" /> All assignments
      </Link>
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          {languageLabels[assignment.language]} assignment
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {assignment.title}
        </h1>
      </header>
      <section
        aria-labelledby="instructions-heading"
        className="rounded-xl border bg-card p-6 sm:p-8"
      >
        <h2 id="instructions-heading" className="mb-5 text-xl font-semibold">
          Instructions
        </h2>
        <div className="whitespace-pre-wrap break-words leading-8">
          {assignment.instructions}
        </div>
      </section>
      <p className="text-sm text-muted-foreground">
        Submission is not connected in this preview. Browser practice is
        available when the local runner preview is enabled.
      </p>
    </article>
  );
}
