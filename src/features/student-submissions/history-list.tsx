import Link from 'next/link';
import { FileCode2 } from 'lucide-react';
import { languageLabels } from '@/features/student-assignments/types';
import type { HistoryItem, HistoryPage } from './history';

const listPath = '/student/submissions';
const linkStyle =
  'inline-flex rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring';

export function SubmissionHistoryList({
  history,
  page,
}: {
  history: HistoryPage;
  page: number;
}) {
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
      {history.rows.length ? (
        <HistoryTable rows={history.rows} />
      ) : (
        <HistoryEmpty page={page} />
      )}
      <HistoryPagination page={page} hasNext={history.hasNext} />
    </section>
  );
}

function HistoryEmpty({ page }: { page: number }) {
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
        href={page === 1 ? '/student/assignments' : listPath}
        className={linkStyle}
      >
        {page === 1 ? 'Browse assignments' : 'Latest submissions'}
      </Link>
    </div>
  );
}

function HistoryTable({ rows }: { rows: readonly HistoryItem[] }) {
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
            <HistoryRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryRow({ row }: { row: HistoryItem }) {
  return (
    <tr>
      <td className="min-w-44 max-w-sm px-4 py-4 break-words">
        <Link
          prefetch={false}
          href={`${listPath}/${row.id}`}
          className="font-medium text-cyan-800 underline-offset-4 hover:underline dark:text-cyan-300"
          aria-label={`View ${row.title}, revision ${row.revision}`}
        >
          {row.title}
        </Link>
      </td>
      <td className="px-3 py-4">{languageLabels[row.language]}</td>
      <td className="px-3 py-4">{row.revision}</td>
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

function HistoryPagination({
  page,
  hasNext,
}: {
  page: number;
  hasNext: boolean;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav
      aria-label="Submission history pages"
      className="flex flex-wrap items-center gap-3"
    >
      {page > 1 && (
        <Link href={`${listPath}?page=${page - 1}`} className={linkStyle}>
          Previous
        </Link>
      )}
      <span className="text-sm text-muted-foreground">Page {page}</span>
      {hasNext && (
        <Link href={`${listPath}?page=${page + 1}`} className={linkStyle}>
          Next
        </Link>
      )}
    </nav>
  );
}
