'use client';

import Link from 'next/link';
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
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <Link href="/courses" className="text-sm underline">
        ← All courses
      </Link>
      <CourseHeading
        course={course}
        role={role}
        assessmentsEnabled={features.some(
          (feature) => feature.feature === 'assessments' && feature.enabled,
        )}
        aiEnabled={features.some(
          (feature) => feature.feature === 'ai' && feature.enabled,
        )}
      />
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
    </main>
  );
}

function CourseHeading({
  course,
  role,
  assessmentsEnabled,
  aiEnabled,
}: {
  course: CourseWorkspaceRecord;
  role: CourseMemberRole;
  assessmentsEnabled: boolean;
  aiEnabled: boolean;
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
      <CourseFeatureLinks
        course={course}
        role={role}
        assessmentsEnabled={assessmentsEnabled}
        aiEnabled={aiEnabled}
      />
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

function CourseFeatureLinks({
  course,
  role,
  assessmentsEnabled,
  aiEnabled,
}: {
  course: CourseWorkspaceRecord;
  role: CourseMemberRole;
  assessmentsEnabled: boolean;
  aiEnabled: boolean;
}) {
  const assignmentsHref =
    role === 'student'
      ? `/student/assignments?courseId=${course.id}`
      : `/instructor?courseId=${course.id}`;
  return (
    <nav aria-label="Course activities" className="flex flex-wrap gap-3">
      {(course.lifecycle === 'archived' || assessmentsEnabled) && (
        <Link
          href={assignmentsHref}
          className="rounded-md border px-3 py-2 text-sm underline"
        >
          Assignments
        </Link>
      )}
      {(course.lifecycle === 'archived' || aiEnabled) && (
        <Link
          href={`/ai/usage?courseId=${course.id}`}
          className="rounded-md border px-3 py-2 text-sm underline"
        >
          AI usage
        </Link>
      )}
      {role === 'instructor' &&
        course.lifecycle === 'active' &&
        assessmentsEnabled && (
          <Link
            href={`/instructor/assignments/new?courseId=${course.id}`}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
          >
            New assignment
          </Link>
        )}
    </nav>
  );
}
