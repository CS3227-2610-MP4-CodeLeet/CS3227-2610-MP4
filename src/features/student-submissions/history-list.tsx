import Link from 'next/link';
import { FileCode2 } from 'lucide-react';
import { languageLabels } from '@/features/student-assignments/types';
import type { HistoryItem, HistoryPage } from './history';
import {
  emptyListFilters,
  hasListFilters,
  type ListFilters,
} from '@/features/student-lists/filters';
import {
  FilteredListEmpty,
  ListFilterControls,
} from '@/features/student-lists/filter-controls';
import { ListPagination } from '@/features/student-lists/pagination';
import { SubmissionTiming } from '@/features/assignment-deadlines/components';

const linkStyle =
  'inline-flex rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring';

export function SubmissionHistoryList({
  history,
  page,
  filters = emptyListFilters,
  courseId,
}: {
  history: HistoryPage;
  page: number;
  filters?: ListFilters;
  courseId: string;
}) {
  const listPath = `/student/submissions?courseId=${encodeURIComponent(courseId)}`;
  return (
    <section className="space-y-6" aria-labelledby="my-submissions-heading">
      <header className="space-y-2">
        <h1
          id="my-submissions-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          My submissions
        </h1>
        <p className="text-sm text-muted-foreground">
          Your saved revisions, newest first. Open a revision to view your code,
          feedback and published grade.
        </p>
      </header>
      <ListFilterControls
        path="/student/submissions"
        filters={filters}
        courseId={courseId}
      />
      {history.rows.length ? (
        <HistoryTable rows={history.rows} courseId={courseId} />
      ) : hasListFilters(filters) ? (
        <FilteredListEmpty kind="submissions" page={page} />
      ) : (
        <HistoryEmpty page={page} courseId={courseId} />
      )}
      <ListPagination
        path={listPath}
        label="Submission history pages"
        page={page}
        hasNext={history.hasNext}
        filters={filters}
      />
    </section>
  );
}

function HistoryEmpty({ page, courseId }: { page: number; courseId: string }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-8">
      <FileCode2 aria-hidden="true" className="size-7 text-muted-foreground" />
      <h2 className="text-lg font-semibold">
        {page === 1 ? 'No submissions yet' : 'No submissions on this page'}
      </h2>
      <p className="text-sm text-muted-foreground">
        {page === 1
          ? 'Submit code from an assignment to find your saved revisions here.'
          : 'Return to your latest submissions to continue browsing.'}
      </p>
      <Link
        href={
          page === 1
            ? `/student/assignments?courseId=${encodeURIComponent(courseId)}`
            : `/student/submissions?courseId=${encodeURIComponent(courseId)}`
        }
        className={linkStyle}
      >
        {page === 1 ? 'Browse assignments' : 'Latest submissions'}
      </Link>
    </div>
  );
}

function HistoryTable({
  rows,
  courseId,
}: {
  rows: readonly HistoryItem[];
  courseId: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table
        className="w-full text-left text-sm"
        aria-label="My submitted revisions"
      >
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">
              Assignment
            </th>
            <th scope="col" className="px-3 py-3">
              Language
            </th>
            <th scope="col" className="px-3 py-3">
              Revision
            </th>
            <th scope="col" className="px-4 py-3">
              Submitted (SGT)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <HistoryRow key={row.id} row={row} courseId={courseId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryRow({ row, courseId }: { row: HistoryItem; courseId: string }) {
  return (
    <tr>
      <td className="min-w-44 max-w-sm px-4 py-4 break-words">
        <Link
          prefetch={false}
          href={`/student/submissions/${row.id}?courseId=${encodeURIComponent(courseId)}`}
          className="font-medium text-cyan-800 underline-offset-4 hover:underline dark:text-cyan-300"
          aria-label={`View ${row.title}, revision ${row.revision}`}
        >
          {row.title}
        </Link>
      </td>
      <td className="px-3 py-4">{languageLabels[row.language]}</td>
      <td className="px-3 py-4">
        <div className="space-y-2">
          <p>{row.revision}</p>
          <SubmissionTiming isLate={row.isLate} dueAt={row.dueAtSubmission} />
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <time dateTime={row.submittedAt}>
          {new Date(row.submittedAt).toLocaleString('en-SG', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Singapore',
          })}
        </time>
      </td>
    </tr>
  );
}
