import Link from 'next/link';
import type { CourseSummary } from './contracts';

export function CourseCard({
  course,
  currentUserId,
  platformAdmin,
}: {
  course: CourseSummary;
  currentUserId: string;
  platformAdmin: boolean;
}) {
  const canOpen = course.role !== null;
  const role = course.role ?? (platformAdmin ? 'Platform admin' : 'Member');
  const card = (
    <div className="h-full rounded-xl border p-5 transition-colors hover:bg-muted/30">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{course.title}</h3>
        <span className="shrink-0 rounded-full border px-2 py-1 text-xs capitalize">
          {course.lifecycle}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 min-h-12 text-sm text-muted-foreground">
        {course.description || 'No description provided.'}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-muted px-2 py-1 capitalize">
          {role}
        </span>
        {course.owner_id === null && course.is_legacy ? (
          <span>Owner: Unassigned</span>
        ) : course.owner_id === currentUserId ? (
          <span>Owner: You</span>
        ) : null}
      </div>
    </div>
  );
  return canOpen ? (
    <Link
      href={`/courses/${course.id}`}
      className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {card}
    </Link>
  ) : (
    <article aria-label={`${course.title}, platform administrator view`}>
      {card}
    </article>
  );
}
