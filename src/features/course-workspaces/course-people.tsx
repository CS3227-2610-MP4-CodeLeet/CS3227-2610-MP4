'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type {
  CourseInvitation,
  CourseMember,
  CourseMemberRole,
  CourseWorkspaceRecord,
} from './contracts';
import { courseRequest, messageFor } from './course-request';

type Props = {
  course: CourseWorkspaceRecord;
  currentUserId: string;
  isOwner: boolean;
  members: CourseMember[];
  invitations: CourseInvitation[];
};

export function CoursePeople(props: Props) {
  return (
    <section className="space-y-4 rounded-xl border p-5">
      <div>
        <h2 className="text-xl font-semibold">People</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite by email. The invited person must sign in and verify the
          invited address.
        </p>
      </div>
      <InvitationForm courseId={props.course.id} />
      <MemberList {...props} />
      <PendingInvitations
        courseId={props.course.id}
        invitations={props.invitations}
      />
    </section>
  );
}

function InvitationForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CourseMemberRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await courseRequest(`/api/courses/${courseId}/members`, 'POST', {
        email,
        role,
      });
      setEmail('');
      router.refresh();
    } catch (requestError) {
      setError(messageFor(requestError, 'Invitation could not be sent.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={invite} className="space-y-2">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="invite-email">
          Email address
        </label>
        <input
          id="invite-email"
          required
          type="email"
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.edu"
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2"
        />
        <RoleSelect value={role} onChange={setRole} />
        <button
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Invite by email
        </button>
      </div>
    </form>
  );
}

function RoleSelect({
  value,
  onChange,
}: {
  value: CourseMemberRole;
  onChange: (role: CourseMemberRole) => void;
}) {
  return (
    <>
      <label className="sr-only" htmlFor="invite-role">
        Invite role
      </label>
      <select
        id="invite-role"
        value={value}
        onChange={(event) => onChange(event.target.value as CourseMemberRole)}
        className="rounded-md border bg-background px-3 py-2"
      >
        <option value="student">Student</option>
        <option value="instructor">Instructor</option>
      </select>
    </>
  );
}

function MemberList({ course, currentUserId, isOwner, members }: Props) {
  return (
    <ul className="divide-y">
      {members.map((member) => (
        <MemberRow
          key={member.user_id}
          courseId={course.id}
          ownerId={course.owner_id}
          currentUserId={currentUserId}
          isOwner={isOwner}
          member={member}
        />
      ))}
    </ul>
  );
}

function MemberRow({
  courseId,
  ownerId,
  currentUserId,
  isOwner,
  member,
}: {
  courseId: string;
  ownerId: string | null;
  currentUserId: string;
  isOwner: boolean;
  member: CourseMember;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCourseOwner = member.user_id === ownerId;
  const canChange =
    !isCourseOwner &&
    member.user_id !== currentUserId &&
    (isOwner || member.role === 'student');

  async function update(role: CourseMemberRole | null) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const path = `/api/courses/${courseId}/members/${member.user_id}`;
      await courseRequest(
        path,
        role ? 'PATCH' : 'DELETE',
        role ? { role } : undefined,
      );
      router.refresh();
    } catch (requestError) {
      setError(messageFor(requestError, 'Member could not be updated.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="font-medium">{member.display_name}</p>
        <p className="text-sm text-muted-foreground">{member.email}</p>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full border px-2 py-1 text-xs capitalize">
          {isCourseOwner ? 'Owner' : member.role}
        </span>
        {canChange && (
          <MemberControls
            member={member}
            isOwner={isOwner}
            busy={busy}
            onUpdate={update}
          />
        )}
      </div>
    </li>
  );
}

function MemberControls({
  member,
  isOwner,
  busy,
  onUpdate,
}: {
  member: CourseMember;
  isOwner: boolean;
  busy: boolean;
  onUpdate: (role: CourseMemberRole | null) => void;
}) {
  return (
    <>
      {isOwner && (
        <select
          aria-label={`Role for ${member.email}`}
          value={member.role}
          disabled={busy}
          onChange={(event) => onUpdate(event.target.value as CourseMemberRole)}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (window.confirm(`Remove ${member.email} from this course?`))
            onUpdate(null);
        }}
        className="rounded-md border px-2 py-1 text-sm"
      >
        Remove
      </button>
    </>
  );
}

function PendingInvitations({
  courseId,
  invitations,
}: {
  courseId: string;
  invitations: CourseInvitation[];
}) {
  const router = useRouter();
  const active = invitations.filter(
    (item) => item.accepted_at === null && item.revoked_at === null,
  );
  if (!active.length) return null;
  return (
    <div className="space-y-2 border-t pt-4">
      <h3 className="font-medium">Pending invitations</h3>
      {active.map((invitation) => (
        <InvitationRow
          key={invitation.id}
          courseId={courseId}
          invitation={invitation}
          onRevoked={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function InvitationRow({
  courseId,
  invitation,
  onRevoked,
}: {
  courseId: string;
  invitation: CourseInvitation;
  onRevoked: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function revoke() {
    setBusy(true);
    setError(null);
    try {
      await courseRequest(
        `/api/courses/${courseId}/invitations/${invitation.id}`,
        'DELETE',
      );
      onRevoked();
    } catch (requestError) {
      setError(messageFor(requestError, 'Invitation could not be revoked.'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>
        {invitation.email} · {invitation.role} · expires{' '}
        {new Date(invitation.expires_at).toLocaleDateString()}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => void revoke()}
        className="rounded-md border px-2 py-1"
      >
        Revoke
      </button>
      {error && (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
