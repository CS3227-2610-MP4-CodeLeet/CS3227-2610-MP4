import Link from 'next/link';
import { formatXp, type XpSummary } from './contracts';
export function MaximumXpField({ value }: { value?: number }) {
  return (
    <div className="space-y-2 text-sm">
      <label htmlFor="assignment-max-xp" className="block">
        Maximum XP
      </label>
      <input
        id="assignment-max-xp"
        name="maxXp"
        type="number"
        required
        min={0}
        max={100000}
        step={1}
        defaultValue={value ?? ''}
        aria-describedby="assignment-xp-help"
        className="w-full rounded-md border bg-background px-3 py-2"
      />
      <p id="assignment-xp-help" className="text-xs text-muted-foreground">
        0 means no XP. Changing this updates existing awards.
      </p>
    </div>
  );
}
export function AssignmentXp({ value }: { value?: number }) {
  if (value === undefined) return null;
  return <span>Maximum XP: {formatXp(value)}</span>;
}
export function XpOverview({
  data,
  courseId,
}: {
  data: XpSummary;
  courseId: string;
}) {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">My XP</h1>
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Total XP</p>
        <p className="mt-2 text-3xl font-semibold">{formatXp(data.total_xp)}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Your best published result for each assignment counts.
        </p>
      </div>
      {!data.awards.length ? (
        <p className="rounded-lg border p-5">No XP awards yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.awards.map((award) => (
            <li
              key={award.assignment_id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4"
            >
              {award.assignment_title ? (
                <Link
                  className="min-w-0 break-words underline"
                  href={`/student/assignments/${award.assignment_id}?courseId=${courseId}`}
                >
                  {award.assignment_title}
                </Link>
              ) : (
                <span>Assignment unavailable</span>
              )}
              <p>
                {formatXp(award.awarded_xp)} XP
                {award.max_xp !== null && (
                  <span className="text-sm text-muted-foreground">
                    {' '}
                    / {formatXp(award.max_xp)}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="XP pages" className="flex justify-between text-sm">
        {data.page > 1 ? (
          <Link
            className="underline"
            href={`/student/xp?courseId=${courseId}&page=${data.page - 1}`}
          >
            Previous
          </Link>
        ) : (
          <span />
        )}
        {data.has_more && (
          <Link
            className="underline"
            href={`/student/xp?courseId=${courseId}&page=${data.page + 1}`}
          >
            Next
          </Link>
        )}
      </nav>
    </section>
  );
}
