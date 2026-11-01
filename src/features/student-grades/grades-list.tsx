import Link from 'next/link';
import { languageLabels } from '@/features/student-assignments/types';
import {
  ListFilterControls,
  FilteredListEmpty,
} from '@/features/student-lists/filter-controls';
import { ListPagination } from '@/features/student-lists/pagination';
import {
  hasListFilters,
  type ListFilters,
} from '@/features/student-lists/filters';
import type { GradeItem, GradesPage } from './grades';

const listPath = '/student/grades';

export function StudentGradesList({
  grades,
  page,
  filters,
}: {
  grades: GradesPage;
  page: number;
  filters: ListFilters;
}) {
  return (
    <section className="space-y-6" aria-labelledby="my-grades-heading">
      <header className="space-y-2">
        <h1
          id="my-grades-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          My grades
        </h1>
        <p className="text-sm text-muted-foreground">
          Your published grades and instructor feedback.
        </p>
      </header>
      <ListFilterControls path={listPath} filters={filters} />
      {grades.rows.length ? (
        <ol aria-label="Published grades" className="space-y-4">
          {grades.rows.map((row) => (
            <li key={row.id}>
              <GradeCard row={row} />
            </li>
          ))}
        </ol>
      ) : hasListFilters(filters) ? (
        <FilteredListEmpty kind="grades" page={page} />
      ) : (
        <GradesEmpty page={page} />
      )}
      <ListPagination
        path={listPath}
        label="Grade pages"
        page={page}
        hasNext={grades.hasNext}
        filters={filters}
      />
    </section>
  );
}

function GradeCard({ row }: { row: GradeItem }) {
  return (
    <article
      aria-labelledby={`grade-${row.id}`}
      className="min-w-0 space-y-4 rounded-xl border bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id={`grade-${row.id}`} className="break-words font-semibold">
            {row.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {languageLabels[row.language]} · Revision {row.revision}
          </p>
        </div>
        <p className="text-lg font-semibold">
          {row.score === null ? 'Score unavailable' : `Score: ${row.score}`}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Published{' '}
        <time dateTime={row.publishedAt}>
          {new Date(row.publishedAt).toLocaleString('en-SG', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Singapore',
          })}
        </time>{' '}
        (SGT)
      </p>
      <details className="rounded-lg border bg-background p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Instructor feedback
        </summary>
        <p className="mt-3 text-sm whitespace-pre-wrap break-words">
          {row.feedback || 'No written feedback.'}
        </p>
      </details>
      <Link
        prefetch={false}
        href={`/student/submissions/${row.submissionId}`}
        className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
        aria-label={`View ${row.title}, revision ${row.revision}`}
      >
        View revision
      </Link>
    </article>
  );
}

function GradesEmpty({ page }: { page: number }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-8">
      <h2 className="text-lg font-semibold">
        {page === 1 ? 'No published grades yet' : 'No grades on this page'}
      </h2>
      <p className="text-sm text-muted-foreground">
        {page === 1
          ? 'Your grades will appear here when your instructor publishes them.'
          : 'Return to your latest grades to continue browsing.'}
      </p>
      <Link
        href={page === 1 ? '/student/assignments' : listPath}
        className="inline-flex text-sm font-medium underline underline-offset-4"
      >
        {page === 1 ? 'Browse assignments' : 'Latest grades'}
      </Link>
    </div>
  );
}
