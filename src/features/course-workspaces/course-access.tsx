'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { IllustratedEmptyState } from '@/components/ui/illustrated-empty-state';
import type { CourseMember, CourseWorkspaceRecord } from './contracts';
import { courseRequest, messageFor } from './course-request';

export function CourseAccess({
  course,
  currentUserId,
  members,
  showJoinCode = true,
}: {
  course: CourseWorkspaceRecord;
  currentUserId: string;
  members: CourseMember[];
  showJoinCode?: boolean;
}) {
  const isOwner = course.owner_id === currentUserId;
  if (!isOwner && !showJoinCode) return null;
  return (
    <section className="space-y-5 rounded-xl border p-5">
      {showJoinCode && <JoinCodeManagement courseId={course.id} />}
      {isOwner && (
        <OwnershipTransfer
          courseId={course.id}
          currentUserId={currentUserId}
          members={members}
        />
      )}
      {isOwner && (
        <CourseLifecycle course={course} memberCount={members.length} />
      )}
    </section>
  );
}

export function JoinCodeManagement({ courseId }: { courseId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function change(method: 'PUT' | 'DELETE') {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await courseRequest(
        `/api/courses/${courseId}/join-code`,
        method,
      );
      setCode(typeof result.code === 'string' ? result.code : null);
      setNotice(
        method === 'PUT'
          ? 'Join code ready. Copy it to share with students.'
          : 'The student join code was revoked.',
      );
    } catch (requestError) {
      setError(messageFor(requestError, 'Join code could not be updated.'));
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(code);
      setNotice('Join code copied.');
    } catch {
      setError('Code could not be copied. Select and copy it manually.');
    }
  }

  return (
    <JoinCodePanel
      code={code}
      notice={notice}
      error={error}
      busy={busy}
      onChange={change}
      onCopy={copyCode}
    />
  );
}

function JoinCodePanel({
  code,
  notice,
  error,
  busy,
  onChange,
  onCopy,
}: {
  code: string | null;
  notice: string | null;
  error: string | null;
  busy: boolean;
  onChange: (method: 'PUT' | 'DELETE') => void;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Student join code</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only course instructors can view or manage this code. Anyone with it
          and a verified account can join as a student.
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
      <JoinCodeControls busy={busy} onChange={onChange} />
      {code && <JoinCodeDisplay code={code} busy={busy} onCopy={onCopy} />}
    </div>
  );
}

function JoinCodeControls({
  busy,
  onChange,
}: {
  busy: boolean;
  onChange: (method: 'PUT' | 'DELETE') => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => onChange('PUT')}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Create or rotate code
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onChange('DELETE')}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Revoke code
      </button>
    </div>
  );
}

function JoinCodeDisplay({
  code,
  busy,
  onCopy,
}: {
  code: string;
  busy: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p
        className="min-w-0 flex-1 break-all rounded-md bg-muted p-3 font-mono text-sm"
        aria-label="New join code"
      >
        {code}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onCopy}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Copy code
      </button>
    </div>
  );
}

function OwnershipTransfer({
  courseId,
  currentUserId,
  members,
}: {
  courseId: string;
  currentUserId: string;
  members: CourseMember[];
}) {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const candidates = members.filter(
    (member) =>
      member.user_id !== currentUserId && member.role === 'instructor',
  );

  async function transfer() {
    if (!ownerId || busy) return;
    if (
      !window.confirm(
        'Transfer course ownership? You will remain an instructor.',
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await courseRequest(`/api/courses/${courseId}/transfer`, 'POST', {
        newOwnerId: ownerId,
      });
      router.refresh();
    } catch (requestError) {
      setError(
        messageFor(requestError, 'Course ownership could not be transferred.'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-t pt-5">
      <h3 className="font-semibold">Transfer ownership</h3>
      {candidates.length === 0 ? (
        <TransferEmptyState />
      ) : (
        <OwnershipTransferControls
          candidates={candidates}
          ownerId={ownerId}
          onOwnerChange={setOwnerId}
          error={error}
          busy={busy}
          onTransfer={transfer}
        />
      )}
    </div>
  );
}

function TransferEmptyState() {
  return (
    <IllustratedEmptyState
      title="No other instructors are available yet."
      description="Invite another instructor to this course before transferring ownership."
      illustration="collection"
      size="compact"
      headingLevel={4}
    />
  );
}

function OwnershipTransferControls({
  candidates,
  ownerId,
  onOwnerChange,
  error,
  busy,
  onTransfer,
}: {
  candidates: CourseMember[];
  ownerId: string;
  onOwnerChange: (value: string) => void;
  error: string | null;
  busy: boolean;
  onTransfer: () => Promise<void>;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <label className="block space-y-1 text-sm">
        <span>New course owner</span>
        <select
          value={ownerId}
          onChange={(event) => onOwnerChange(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2"
        >
          <option value="">Choose an instructor</option>
          {candidates.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.display_name} · {member.email}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy || !ownerId}
        onClick={() => void onTransfer()}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Transfer ownership
      </button>
    </>
  );
}

function CourseLifecycle({
  course,
  memberCount,
}: {
  course: CourseWorkspaceRecord;
  memberCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: 'archive' | 'delete-empty') {
    if (busy) return;
    const message =
      action === 'archive'
        ? 'Archive this course? Members keep read-only access to its history.'
        : 'Permanently delete this empty course? This cannot be undone.';
    if (!window.confirm(message)) return;
    setBusy(true);
    setError(null);
    try {
      await courseRequest(`/api/courses/${course.id}`, 'DELETE', {
        action,
        confirm: true,
      });
      if (action === 'archive') router.refresh();
      else router.push('/courses');
    } catch (requestError) {
      setError(
        messageFor(
          requestError,
          'Course action could not be completed. If it contains work, archive it instead.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-t pt-5">
      <h3 className="font-semibold">Course lifecycle</h3>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run('archive')}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Archive course
        </button>
        {memberCount === 1 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run('delete-empty')}
            className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive"
          >
            Delete empty course
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Archiving keeps course history. Permanent deletion is available only
        when the course is empty and has no activity.
      </p>
    </div>
  );
}
