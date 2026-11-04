'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type InstructorOption = {
  user_id: string;
  email: string | null;
  display_name: string;
};
type Props = {
  courseId: string;
  ownerId: string | null;
  initialInstructors: InstructorOption[];
  nextAfter: string | null;
};

function useInstructorOptions(
  initial: InstructorOption[],
  initialAfter: string | null,
) {
  const [instructors, setInstructors] = useState(initial);
  const [nextAfter, setNextAfter] = useState(initialAfter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!nextAfter || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/users?after=${encodeURIComponent(nextAfter)}`,
        { cache: 'no-store' },
      );
      const result = (await response.json()) as {
        users?: (InstructorOption & { role: string })[];
        nextAfter?: string | null;
      };
      if (!response.ok || !result.users)
        throw new Error('Instructor options could not be loaded.');
      const moreInstructors = result.users.filter(
        (user) => user.role === 'instructor',
      );
      setInstructors((current) => [...current, ...moreInstructors]);
      setNextAfter(result.nextAfter ?? null);
    } catch {
      setError('Instructor options could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }
  return { instructors, nextAfter, loading, error, loadMore };
}

function useOwnerAssignment(
  courseId: string,
  ownerId: string | null,
  selectedOwner: string,
) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOwner || busy) return;
    if (
      ownerId &&
      ownerId !== selectedOwner &&
      !window.confirm('Replace the assigned Legacy course owner?')
    )
      return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/courses/legacy-owner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: selectedOwner }),
      });
      if (!response.ok) throw new Error('Legacy owner could not be assigned.');
      setNotice('Legacy owner assigned.');
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Legacy owner could not be assigned.',
      );
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, notice, assign };
}

export function LegacyOwnerAssignment(props: Props) {
  const options = useInstructorOptions(
    props.initialInstructors,
    props.nextAfter,
  );
  const [selectedOwner, setSelectedOwner] = useState(props.ownerId ?? '');
  const assignment = useOwnerAssignment(
    props.courseId,
    props.ownerId,
    selectedOwner,
  );
  return (
    <LegacyOwnerPanel
      ownerId={props.ownerId}
      instructors={options.instructors}
      nextAfter={options.nextAfter}
      loading={options.loading}
      error={assignment.error ?? options.error}
      notice={assignment.notice}
      busy={assignment.busy}
      selectedOwner={selectedOwner}
      onOwnerChange={setSelectedOwner}
      onLoadMore={options.loadMore}
      onAssign={assignment.assign}
    />
  );
}

type PanelProps = {
  ownerId: string | null;
  instructors: InstructorOption[];
  nextAfter: string | null;
  loading: boolean;
  error: string | null;
  notice: string | null;
  busy: boolean;
  selectedOwner: string;
  onOwnerChange: (ownerId: string) => void;
  onLoadMore: () => void;
  onAssign: (event: FormEvent<HTMLFormElement>) => void;
};

function LegacyOwnerPanel({
  ownerId,
  nextAfter,
  instructors,
  loading,
  error,
  notice,
  busy,
  selectedOwner,
  onOwnerChange,
  onLoadMore,
  onAssign,
}: PanelProps) {
  return (
    <section className="space-y-4 rounded-xl border p-5">
      <div>
        <p className="text-sm text-muted-foreground">
          Archived historical workspace
        </p>
        <h2 className="text-xl font-semibold">Legacy course owner</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current owner:{' '}
          {ownerId
            ? (instructors.find((user) => user.user_id === ownerId)
                ?.display_name ?? 'Assigned instructor')
            : 'Unassigned'}
          . Assignment preserves the Legacy archive.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {instructors.length ? (
        <OwnerSelect
          instructors={instructors}
          selectedOwner={selectedOwner}
          busy={busy}
          onChange={onOwnerChange}
          onAssign={onAssign}
        />
      ) : (
        <p className="text-sm">
          No instructors are available. Add an instructor role in the user
          directory first.
        </p>
      )}
      {nextAfter && (
        <button
          type="button"
          disabled={loading}
          onClick={onLoadMore}
          className="text-sm underline"
        >
          Load more instructors
        </button>
      )}
    </section>
  );
}

function OwnerSelect({
  instructors,
  selectedOwner,
  busy,
  onChange,
  onAssign,
}: {
  instructors: InstructorOption[];
  selectedOwner: string;
  busy: boolean;
  onChange: (ownerId: string) => void;
  onAssign: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onAssign} className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="legacy-course-owner">
        Legacy course owner
      </label>
      <select
        id="legacy-course-owner"
        required
        value={selectedOwner}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2"
      >
        <option value="">Choose an instructor</option>
        {instructors.map((instructor) => (
          <option key={instructor.user_id} value={instructor.user_id}>
            {instructor.display_name}
            {instructor.email ? ` · ${instructor.email}` : ''}
          </option>
        ))}
      </select>
      <button
        disabled={busy || !selectedOwner}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Assign owner
      </button>
    </form>
  );
}
