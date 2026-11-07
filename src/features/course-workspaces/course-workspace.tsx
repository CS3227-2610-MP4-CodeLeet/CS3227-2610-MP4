'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
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
        discussionsEnabled={features.some(
          (feature) => feature.feature === 'discussions' && feature.enabled,
        )}
        xpEnabled={features.some(
          (feature) => feature.feature === 'xp' && feature.enabled,
        )}
        leaderboardEnabled={features.some(
          (feature) => feature.feature === 'leaderboard' && feature.enabled,
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
  discussionsEnabled,
  xpEnabled,
  leaderboardEnabled,
}: {
  course: CourseWorkspaceRecord;
  role: CourseMemberRole;
  assessmentsEnabled: boolean;
  aiEnabled: boolean;
  discussionsEnabled: boolean;
  xpEnabled: boolean;
  leaderboardEnabled: boolean;
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
        discussionsEnabled={discussionsEnabled}
        xpEnabled={xpEnabled}
        leaderboardEnabled={leaderboardEnabled}
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
  discussionsEnabled,
  xpEnabled,
  leaderboardEnabled,
}: {
  course: CourseWorkspaceRecord;
  role: CourseMemberRole;
  assessmentsEnabled: boolean;
  aiEnabled: boolean;
  discussionsEnabled: boolean;
  xpEnabled: boolean;
  leaderboardEnabled: boolean;
}) {
  const assignmentsHref =
    role === 'student'
      ? `/student/assignments?courseId=${course.id}`
      : `/courses/${course.id}/instructor`;
  const archived = course.lifecycle === 'archived';
  return (
    <nav aria-label="Course activities" className="flex flex-wrap gap-3">
      <CourseActivityLink
        enabled={archived || assessmentsEnabled}
        href={assignmentsHref}
      >
        Assignments
      </CourseActivityLink>
      <CourseAiLinks
        course={course}
        role={role}
        archived={archived}
        aiEnabled={aiEnabled}
      />
      <CourseActivityLink
        enabled={archived || discussionsEnabled}
        href={`/forums?courseId=${course.id}`}
      >
        Discussions
      </CourseActivityLink>
      <CourseActivityLink
        enabled={role === 'student' && (archived || xpEnabled)}
        href={`/student/xp?courseId=${course.id}`}
      >
        My XP
      </CourseActivityLink>
      <CourseProgressLink
        course={course}
        role={role}
        archived={archived}
        assessmentsEnabled={assessmentsEnabled}
        xpEnabled={xpEnabled}
      />
      <CourseActivityLink
        enabled={archived || leaderboardEnabled}
        href={`/leaderboard?courseId=${course.id}`}
      >
        Leaderboard
      </CourseActivityLink>
      <CourseActivityLink
        enabled={role === 'instructor' && !archived && assessmentsEnabled}
        href={`/courses/${course.id}/instructor/assignments/new`}
        primary
      >
        New assignment
      </CourseActivityLink>
    </nav>
  );
}

function CourseAiLinks({
  course,
  role,
  archived,
  aiEnabled,
}: {
  course: CourseWorkspaceRecord;
  role: CourseMemberRole;
  archived: boolean;
  aiEnabled: boolean;
}) {
  return (
    <>
      <CourseActivityLink
        enabled={archived || aiEnabled}
        href={`/ai/usage?courseId=${course.id}`}
      >
        AI usage
      </CourseActivityLink>
      <CourseActivityLink
        enabled={role === 'instructor' && !archived && aiEnabled}
        href={`/courses/${course.id}/instructor/ai-context`}
      >
        Context comparison
      </CourseActivityLink>
    </>
  );
}

function CourseProgressLink({
  course,
  role,
  archived,
  assessmentsEnabled,
  xpEnabled,
}: {
  course: CourseWorkspaceRecord;
  role: CourseMemberRole;
  archived: boolean;
  assessmentsEnabled: boolean;
  xpEnabled: boolean;
}) {
  const enabled =
    role === 'student' && (archived || assessmentsEnabled || xpEnabled);
  return (
    <CourseActivityLink
      enabled={enabled}
      href={`/student/progress?courseId=${course.id}`}
    >
      My progress
    </CourseActivityLink>
  );
}

function CourseActivityLink({
  enabled,
  href,
  primary = false,
  children,
}: {
  enabled: boolean;
  href: string;
  primary?: boolean;
  children: ReactNode;
}) {
  if (!enabled) return null;
  return (
    <Link
      href={href}
      className={
        primary
          ? 'rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground'
          : 'rounded-md border px-3 py-2 text-sm underline'
      }
    >
      {children}
    </Link>
  );
}
