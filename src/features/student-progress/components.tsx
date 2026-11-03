import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatXp } from '@/features/assignment-xp/contracts';
import { formatDeadline } from '@/features/assignment-deadlines/deadlines';
import { languageLabels } from '@/features/student-assignments/types';
import type { HistoryItem } from '@/features/student-submissions/history';
import type {
  AssignmentProgress,
  RecentGrade,
  UpcomingAssignment,
} from './contracts';
import { ProgressRetryButton } from './retry-button';

export type ProgressData = {
  assignments: AssignmentProgress | null;
  upcoming: UpcomingAssignment[] | null;
  xp: string | null;
  submissions: HistoryItem[] | null;
  grades: RecentGrade[] | null;
};
const mutedText = 'text-sm text-muted-foreground';
const cardStyle = 'min-w-0 rounded-xl border bg-card p-5';
const linkStyle =
  'text-sm font-medium text-cyan-800 underline underline-offset-4 dark:text-cyan-300';
const listStyle = 'divide-y';
const itemStyle = 'space-y-1 py-3 first:pt-0 last:pb-0';
const assignmentsPath = '/student/assignments';
const submissionsPath = '/student/submissions';
const gradesPath = '/student/grades';

function courseHref(path: string, courseId: string) {
  return `${path}?courseId=${encodeURIComponent(courseId)}`;
}

export function ProgressOverview({
  data,
  courseId,
  assessmentsEnabled,
  xpEnabled,
}: {
  data: ProgressData;
  courseId: string;
  assessmentsEnabled: boolean;
  xpEnabled: boolean;
}) {
  return (
    <section aria-labelledby="progress-heading" className="space-y-6">
      <header className="space-y-2">
        <h1
          id="progress-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          My progress
        </h1>
        <p className={mutedText}>
          Your assignments, deadlines and recent work in one place.
        </p>
      </header>
      <ProgressSummaryCards
        data={data}
        courseId={courseId}
        assessmentsEnabled={assessmentsEnabled}
        xpEnabled={xpEnabled}
      />
      <ProgressDetails
        data={data}
        courseId={courseId}
        assessmentsEnabled={assessmentsEnabled}
        xpEnabled={xpEnabled}
      />
    </section>
  );
}

function ProgressSummaryCards({
  data,
  courseId,
  assessmentsEnabled,
  xpEnabled,
}: {
  data: ProgressData;
  courseId: string;
  assessmentsEnabled: boolean;
  xpEnabled: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {assessmentsEnabled && (
        <>
          <SummaryCard
            label="Submitted assignments"
            value={data.assignments?.submitted}
            href={courseHref(assignmentsPath, courseId)}
          />
          <SummaryCard
            label="Outstanding assignments"
            value={data.assignments?.outstanding}
            href={courseHref(assignmentsPath, courseId)}
          />
          <SummaryCard
            label="Overdue assignments"
            value={data.assignments?.overdue}
            href={courseHref(assignmentsPath, courseId)}
          />
        </>
      )}
      {xpEnabled && (
        <SummaryCard
          label="Total XP"
          value={data.xp === null ? undefined : formatXp(data.xp)}
          href={courseHref('/student/xp', courseId)}
        />
      )}
    </div>
  );
}

function ProgressDetails({
  data,
  courseId,
  assessmentsEnabled,
  xpEnabled,
}: {
  data: ProgressData;
  courseId: string;
  assessmentsEnabled: boolean;
  xpEnabled: boolean;
}) {
  return (
    <>
      {assessmentsEnabled &&
        (data.assignments ? (
          <AssignmentCompletion value={data.assignments} />
        ) : (
          <Unavailable text="Assignment progress unavailable" />
        ))}
      {xpEnabled && data.xp === null && <Unavailable text="XP unavailable" />}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {assessmentsEnabled && (
          <>
            <UpcomingDeadlines rows={data.upcoming} courseId={courseId} />
            <RecentSubmissions rows={data.submissions} courseId={courseId} />
            <RecentGrades rows={data.grades} courseId={courseId} />
          </>
        )}
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string | undefined;
  href: string;
}) {
  return (
    <article aria-label={label} className={cardStyle}>
      <Link href={href} className={`${mutedText} hover:underline`}>
        {label}
      </Link>
      <p className="mt-2 break-words text-3xl font-semibold tabular-nums">
        {value === undefined
          ? 'Unavailable'
          : typeof value === 'number'
            ? value.toLocaleString('en-SG')
            : value}
      </p>
    </article>
  );
}

function AssignmentCompletion({ value }: { value: AssignmentProgress }) {
  return (
    <div className={`${cardStyle} space-y-3`}>
      {value.total ? (
        <>
          <p className="text-sm font-medium">
            {value.submitted.toLocaleString('en-SG')} of{' '}
            {value.total.toLocaleString('en-SG')} assignments submitted
          </p>
          <progress
            aria-label="Assignment submission progress"
            value={value.submitted}
            max={value.total}
            className="h-3 w-full accent-cyan-700 dark:accent-cyan-400"
          />
          <p className={mutedText}>
            Saved revisions count as submitted. Check My grades for your
            results.
          </p>
        </>
      ) : (
        <p className={mutedText}>
          No assignments yet. Published assignments will appear here.
        </p>
      )}
    </div>
  );
}

function OverviewSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className={`${cardStyle} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link
          className={linkStyle}
          href={href}
          aria-label={`View all ${title.toLowerCase()}`}
        >
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}

function ProgressTime({ value }: { value: string }) {
  return <time dateTime={value}>{formatDeadline(value)} (SGT)</time>;
}

function Unavailable({ text }: { text: string }) {
  return (
    <div role="status" className="space-y-3 text-sm">
      <p>{text}. Please try again.</p>
      <ProgressRetryButton />
    </div>
  );
}

function UpcomingDeadlines({
  rows,
  courseId,
}: {
  rows: UpcomingAssignment[] | null;
  courseId: string;
}) {
  return (
    <OverviewSection
      title="Coming up"
      href={courseHref(assignmentsPath, courseId)}
    >
      {rows === null ? (
        <Unavailable text="Deadlines could not be loaded" />
      ) : rows.length ? (
        <ul className={listStyle} aria-label="Upcoming deadlines">
          {rows.map((row) => (
            <li className={itemStyle} key={row.id}>
              <Link
                className={`${linkStyle} break-words`}
                href={courseHref(`${assignmentsPath}/${row.id}`, courseId)}
                prefetch={false}
              >
                {row.title}
              </Link>
              <p className={mutedText}>
                {languageLabels[row.language]} · Due{' '}
                <ProgressTime value={row.due_at} />
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={mutedText}>
          No upcoming deadlines. Browse assignments for other work.
        </p>
      )}
    </OverviewSection>
  );
}

function RecentSubmissions({
  rows,
  courseId,
}: {
  rows: HistoryItem[] | null;
  courseId: string;
}) {
  return (
    <OverviewSection
      title="Recent submissions"
      href={courseHref(submissionsPath, courseId)}
    >
      {rows === null ? (
        <Unavailable text="Submissions could not be loaded" />
      ) : rows.length ? (
        <ol className={listStyle} aria-label="Recent saved revisions">
          {rows.map((row) => (
            <li className={itemStyle} key={row.id}>
              <Link
                className={`${linkStyle} break-words`}
                href={courseHref(`${submissionsPath}/${row.id}`, courseId)}
                prefetch={false}
              >
                {row.title}
              </Link>
              <p className={mutedText}>
                {languageLabels[row.language]} · Revision {row.revision}
                {row.isLate ? ' · Late' : ''}
              </p>
              <p className={mutedText}>
                <ProgressTime value={row.submittedAt} />
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className={mutedText}>
          No submissions yet. Save your first revision from an assignment.
        </p>
      )}
    </OverviewSection>
  );
}

function RecentGrades({
  rows,
  courseId,
}: {
  rows: RecentGrade[] | null;
  courseId: string;
}) {
  return (
    <OverviewSection
      title="Recent grades"
      href={courseHref(gradesPath, courseId)}
    >
      {rows === null ? (
        <Unavailable text="Grades could not be loaded" />
      ) : rows.length ? (
        <ol className={listStyle} aria-label="Recent published grades">
          {rows.map((row) => (
            <li className={itemStyle} key={row.id}>
              <Link
                className={`${linkStyle} break-words`}
                href={courseHref(gradesPath, courseId)}
              >
                {row.title}
              </Link>
              <p className={mutedText}>
                {languageLabels[row.language]} · Revision {row.revision} ·{' '}
                {row.score === null
                  ? 'Score unavailable'
                  : `Score: ${row.score}`}
              </p>
              <p className={mutedText}>
                Published <ProgressTime value={row.publishedAt} />
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className={mutedText}>
          No published grades yet. Your grades will appear when your instructor
          publishes them.
        </p>
      )}
    </OverviewSection>
  );
}
