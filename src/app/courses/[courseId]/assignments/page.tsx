import { loadPublishedAssignments } from '@/features/assignment-deadlines/assignments.server';
import { AssignmentList } from '@/features/student-assignments/components';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { notFound } from 'next/navigation';
import {
  parseListFilters,
  type ListSearchParams,
} from '@/features/student-lists/filters';

export default async function CourseAssignmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<ListSearchParams>;
}) {
  const { courseId } = await params;
  const urlParams = await searchParams;
  const filters = parseListFilters(urlParams);
  if (!filters) notFound();

  const { supabase, user } = await requireMember();
  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId,
    'assessments',
  );

  if (
    !access ||
    access.role !== 'student' ||
    (access.lifecycle === 'active' && !access.featureEnabled)
  ) {
    notFound();
  }

  const assignments = await loadPublishedAssignments(
    supabase,
    user.id,
    courseId,
    filters,
  );
  if (!assignments) {
    throw new Error('Published assignments could not be loaded');
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <AssignmentList
        assignments={assignments}
        filters={filters}
        courseId={courseId}
      />
    </div>
  );
}
