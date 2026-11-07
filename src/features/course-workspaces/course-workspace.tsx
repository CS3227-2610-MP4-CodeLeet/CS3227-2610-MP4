'use client';

import type {
  CourseFeatureSetting,
  CourseInvitation,
  CourseMember,
  CourseMemberRole,
  CourseWorkspaceRecord,
} from './contracts';
import { CourseAccess } from './course-access';
import { CourseDetails } from './course-details';
import { CourseFeatures } from './course-features';
import { CoursePeople } from './course-people';

type Props = {
  course: CourseWorkspaceRecord;
  role: CourseMemberRole;
  currentUserId: string;
  features: CourseFeatureSetting[];
  initialMembers: CourseMember[];
  initialInvitations: CourseInvitation[];
  platformAdmin: boolean;
};

export function CourseWorkspace({
  course,
  role,
  currentUserId,
  features,
  initialMembers,
  initialInvitations,
  platformAdmin,
}: Props) {
  const isOwner = course.owner_id === currentUserId;
  const canManage = role === 'instructor' && course.lifecycle === 'active';
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <CourseHeading course={course} role={role} />
      {canManage && (
        <ManagementPanels
          course={course}
          currentUserId={currentUserId}
          isOwner={isOwner}
          features={features}
          members={initialMembers}
          invitations={initialInvitations}
        />
      )}
      {platformAdmin && course.is_legacy && course.owner_id === null && (
        <p className="rounded-md border p-4 text-sm">
          This Legacy course has no owner. Assign an instructor from the
          platform administration page.
        </p>
      )}
    </div>
  );
}

function CourseHeading({
  course,
  role,
}: {
  course: CourseWorkspaceRecord;
  role: CourseMemberRole;
}) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-muted-foreground">
            Course workspace · {role}
          </p>
          <h1 className="text-3xl font-semibold">{course.title}</h1>
        </div>
        <span className="rounded-full border px-3 py-1 text-sm capitalize">
          {course.lifecycle}
        </span>
      </div>
      {course.description && (
        <p className="max-w-3xl text-muted-foreground">{course.description}</p>
      )}
      {course.lifecycle === 'archived' && (
        <p className="rounded-md border p-3 text-sm">
          This course is read-only. Members can still review its history.
        </p>
      )}
    </header>
  );
}

function ManagementPanels({
  course,
  currentUserId,
  isOwner,
  features,
  members,
  invitations,
}: {
  course: CourseWorkspaceRecord;
  currentUserId: string;
  isOwner: boolean;
  features: CourseFeatureSetting[];
  members: CourseMember[];
  invitations: CourseInvitation[];
}) {
  return (
    <>
      <section className="grid gap-6 lg:grid-cols-2">
        <CourseDetails course={course} />
        <CourseFeatures course={course} initialFeatures={features} />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <CoursePeople
          course={course}
          currentUserId={currentUserId}
          isOwner={isOwner}
          members={members}
          invitations={invitations}
        />
        <CourseAccess
          course={course}
          currentUserId={currentUserId}
          members={members}
        />
      </section>
    </>
  );
}


