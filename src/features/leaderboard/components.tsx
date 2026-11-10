import Link from 'next/link';
import { formatXp } from '@/features/assignment-xp/contracts';
import type { Leaderboard } from './contracts';
import { IllustratedEmptyState } from '@/components/ui/illustrated-empty-state';
export function LeaderboardView({
  data,
  courseId,
}: {
  data: Leaderboard;
  courseId: string;
}) {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      {data.own && (
        <div className="flex flex-wrap gap-8 rounded-xl border bg-card p-5">
          <div>
            <p className="text-sm text-muted-foreground">Your rank</p>
            <p className="mt-2 text-2xl font-semibold">
              {data.own.rank ? formatXp(data.own.rank) : 'Unranked'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your XP</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatXp(data.own.total_xp)}
            </p>
          </div>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Students with equal XP share the same rank.
      </p>
      {!data.rows.length ? (
        <IllustratedEmptyState
          title={data.page === 1 ? 'No rankings yet' : 'No students on this page.'}
          description={
            data.page === 1
              ? 'Students with positive course XP will appear here.'
              : 'Return to the first page to view the current rankings.'
          }
          illustration="progress"
        />
      ) : (
        <LeaderboardTable rows={data.rows} />
      )}
      <nav
        aria-label="Leaderboard pages"
        className="flex justify-between text-sm"
      >
        {data.page > 1 ? (
          <Link
            className="underline"
            href={`/courses/${courseId}/leaderboard?page=${data.page - 1}`}
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        {data.has_more && (
          <Link
            className="underline"
            href={`/courses/${courseId}/leaderboard?page=${data.page + 1}`}
          >
            Next
          </Link>
        )}
      </nav>
    </section>
  );
}

function LeaderboardTable({ rows }: { rows: Leaderboard['rows'] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Student XP rankings</caption>
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="px-4 py-3">
              Rank
            </th>
            <th scope="col" className="px-4 py-3">
              Username
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              XP
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.position}
              className={`border-t ${row.is_current_user ? 'bg-cyan-50 dark:bg-cyan-950/50' : ''}`}
            >
              <td className="px-4 py-3 tabular-nums">{formatXp(row.rank)}</td>
              <td className="max-w-64 break-words px-4 py-3">
                <span>{row.username}</span>
                {row.is_current_user && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    You
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {formatXp(row.total_xp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
