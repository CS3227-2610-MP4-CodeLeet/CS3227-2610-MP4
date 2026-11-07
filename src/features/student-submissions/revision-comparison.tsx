import { FormSubmitButton } from '@/components/ui/pending-button';
import Form from 'next/form';
import Link from 'next/link';
import { assignmentTitle } from './history';
import { languageLabels } from '@/features/student-assignments/types';
import { comparisonPath } from './comparison-selection';
import { compareLines, type DiffLine } from './revision-diff';
import type { RevisionComparison } from './revision-comparison.server';

export function RevisionComparisonView({
  comparison,
  courseId,
}: {
  comparison: RevisionComparison;
  courseId: string;
}) {
  const { anchor, latestRevision, before, after } = comparison;
  return (
    <section className="min-w-0 space-y-6">
      <nav
        aria-label="Comparison navigation"
        className="flex flex-wrap gap-4 text-sm"
      >
        <Link
          href={`/courses/${courseId}/submissions/${anchor.id}`}
          className="underline"
        >
          Back to revision {anchor.revision}
        </Link>
        <Link href={`/courses/${courseId}/submissions`} className="underline">
          All submissions
        </Link>
      </nav>
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {assignmentTitle(anchor.assignments)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Compare revisions
        </h1>
        <p className="text-sm text-muted-foreground">
          {languageLabels[anchor.language]}
        </p>
      </header>
      {before && after ? (
        <>
          <ComparisonControls
            key={`${before.revision}:${after.revision}`}
            path={comparisonPath(anchor.id, courseId)}
            latest={latestRevision}
            before={before.revision}
            after={after.revision}
          />
          <Changes before={before.source} after={after.source} />
        </>
      ) : (
        <p className="rounded-xl border bg-card p-6">
          Save another revision to compare changes.
        </p>
      )}
    </section>
  );
}

function ComparisonControls({
  path,
  latest,
  before,
  after,
}: {
  path: string;
  latest: number;
  before: number;
  after: number;
}) {
  return (
    <Form
      action={path}
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
    >
      {(
        [
          { name: 'before', label: 'From revision', value: before },
          { name: 'after', label: 'To revision', value: after },
        ] as const
      ).map((field) => (
        <label key={field.name} className="flex min-w-0 flex-col gap-2 text-sm">
          {field.label}
          <input
            type="number"
            name={field.name}
            min={1}
            max={latest}
            step={1}
            required
            defaultValue={field.value}
            className="w-36 max-w-full rounded-md border bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          />
        </label>
      ))}
      <FormSubmitButton
        pendingLabel="Comparing…"
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        Compare
      </FormSubmitButton>
    </Form>
  );
}

function Changes({ before, after }: { before: string; after: string }) {
  const lines = compareLines(before, after);
  const added = lines.filter((line) => line.kind === 'added').length;
  const removed = lines.filter((line) => line.kind === 'removed').length;
  if (!added && !removed)
    return (
      <p className="rounded-xl border bg-card p-6">
        No changes between these revisions.
      </p>
    );
  return (
    <section className="min-w-0 space-y-3" aria-label="Comparison results">
      <p className="text-sm text-muted-foreground">
        {added} {added === 1 ? 'line' : 'lines'} added · {removed}{' '}
        {removed === 1 ? 'line' : 'lines'} removed
      </p>
      <div
        role="region"
        aria-label="Code changes"
        tabIndex={0}
        className="max-h-[65vh] overflow-auto rounded-xl border bg-card focus-visible:outline-2 focus-visible:outline-ring"
      >
        <table
          className="w-full text-left text-sm"
          aria-label="Revision changes"
        >
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-3 whitespace-nowrap">
                From line
              </th>
              <th scope="col" className="px-3 py-3 whitespace-nowrap">
                To line
              </th>
              <th scope="col" className="px-2 py-3">
                Change
              </th>
              <th scope="col" className="px-3 py-3">
                Code
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <ChangeRow key={index} line={line} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const changePresentation = {
  added: {
    label: 'Added',
    marker: '+',
    style:
      'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100',
  },
  removed: {
    label: 'Removed',
    marker: '−',
    style: 'bg-rose-50 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100',
  },
  unchanged: { label: 'Unchanged', marker: ' ', style: '' },
};

function ChangeRow({ line }: { line: DiffLine }) {
  const presentation = changePresentation[line.kind];
  return (
    <tr className={presentation.style}>
      <td className="px-3 py-1 text-right font-mono tabular-nums">
        {line.before}
      </td>
      <td className="px-3 py-1 text-right font-mono tabular-nums">
        {line.after}
      </td>
      <td className="px-2 py-1 text-center font-mono">
        <span className="sr-only">{presentation.label}</span>
        <span aria-hidden="true">{presentation.marker}</span>
      </td>
      <td className="w-full px-3 py-1">
        <code className="whitespace-pre">{line.text || ' '}</code>
      </td>
    </tr>
  );
}
