import { formatDeadline, type SubmissionStatus } from './deadlines';

export function AssignmentDueDate({ dueAt }: { dueAt?: string | null }) {
  return dueAt ? (
    <time dateTime={dueAt}>Due {formatDeadline(dueAt)} SGT</time>
  ) : (
    <span>No deadline</span>
  );
}

type TimingLabel = SubmissionStatus | 'Late' | 'On time';
export function SubmissionStatusBadge({ status }: { status: TimingLabel }) {
  const late =
    status === 'Overdue' || status === 'Late' || status === 'Submitted late';
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${late ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200' : 'border-border bg-muted/40 text-foreground'}`}
    >
      {status}
    </span>
  );
}

export function SubmissionTiming({
  isLate,
  dueAt,
}: {
  isLate?: boolean;
  dueAt?: string | null;
}) {
  return (
    <SubmissionStatusBadge
      status={isLate ? 'Late' : dueAt ? 'On time' : 'Submitted'}
    />
  );
}

export function CapturedDeadline({ dueAt }: { dueAt?: string | null }) {
  return dueAt ? (
    <p className="text-xs text-muted-foreground">
      Due when submitted:{' '}
      <time dateTime={dueAt}>{formatDeadline(dueAt)} SGT</time>
    </p>
  ) : null;
}
