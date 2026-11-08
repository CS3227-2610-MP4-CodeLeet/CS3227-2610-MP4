'use client';

import { PendingLink } from '@/components/ui/pending-link';
import { usePathname } from 'next/navigation';
import { useBreadcrumbTitle } from './breadcrumb-context';

export type CourseBreadcrumbsProps = {
  courseId: string;
  courseTitle: string;
  onToggleMobileSidebar?: () => void;
};

const segmentLabelMap: Record<string, string> = {
  assignments: 'Assignments',
  submissions: 'Submissions',
  grades: 'Grades',
  progress: 'Progress',
  xp: 'My XP',
  forums: 'Discussions',
  leaderboard: 'Leaderboard',
  'ai-usage': 'AI Usage',
  'ai-context': 'Context Comparison',
  instructor: 'Instructor',
  edit: 'Edit',
  new: 'New',
  'practice-tests': 'Practice Tests',
  compare: 'Compare',
};

function formatSegmentLabel(segment: string): string {
  if (segmentLabelMap[segment]) {
    return segmentLabelMap[segment];
  }
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type BreadcrumbItem = { label: string; href?: string; isCurrent: boolean };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FIXTURE_ID_REGEX = /^(asg|sub|course|thread|user)-/i;

export function isDynamicIdentifier(segment: string): boolean {
  return (
    UUID_REGEX.test(segment) ||
    FIXTURE_ID_REGEX.test(segment) ||
    /^\d+$/.test(segment)
  );
}

const INSTRUCTOR_DASHBOARD_SEGMENTS = new Set([
  'instructor',
  'assignments',
  'submissions',
]);

function resolveAncestorHref(
  courseId: string,
  segment: string,
  isInstructor: boolean,
): string | undefined {
  if (isInstructor) {
    if (INSTRUCTOR_DASHBOARD_SEGMENTS.has(segment)) {
      return `/courses/${courseId}/instructor`;
    }
    return segment === 'ai-context'
      ? `/courses/${courseId}/instructor/ai-context`
      : undefined;
  }

  return `/courses/${courseId}/${segment}`;
}

function buildBreadcrumbs(
  pathname: string,
  courseId: string,
  courseTitle: string,
  leafTitle: string | null,
): BreadcrumbItem[] {
  const segments = pathname.split('?')[0].split('/').filter(Boolean);
  const courseIndex = segments.indexOf(courseId);
  const courseSubSegments =
    courseIndex >= 0 ? segments.slice(courseIndex + 1) : [];

  const crumbs: BreadcrumbItem[] = [
    { label: 'Courses', href: '/courses', isCurrent: false },
    {
      label: courseTitle,
      href: `/courses/${courseId}`,
      isCurrent: courseSubSegments.length === 0,
    },
  ];

  const displaySegments = courseSubSegments.filter((segment, idx) => {
    const isLast = idx === courseSubSegments.length - 1;
    return isLast || !isDynamicIdentifier(segment);
  });

  const isInstructor = courseSubSegments[0] === 'instructor';

  displaySegments.forEach((segment, idx) => {
    const isLast = idx === displaySegments.length - 1;
    const label =
      isLast && leafTitle
        ? leafTitle
        : isDynamicIdentifier(segment)
          ? 'Details'
          : formatSegmentLabel(segment);
    const href = isLast
      ? undefined
      : resolveAncestorHref(courseId, segment, isInstructor);
    crumbs.push({
      label,
      href,
      isCurrent: isLast,
    });
  });

  return crumbs;
}

export function CourseBreadcrumbs({
  courseId,
  courseTitle,
  onToggleMobileSidebar,
}: CourseBreadcrumbsProps) {
  const pathname = usePathname();
  const leafTitle = useBreadcrumbTitle();
  const crumbs = buildBreadcrumbs(pathname, courseId, courseTitle, leafTitle);

  return (
    <div className="flex items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur">
      {onToggleMobileSidebar && (
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          aria-expanded={false}
          className="rounded-md border p-1.5 text-muted-foreground hover:bg-accent md:hidden"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {crumbs.map((crumb, idx) => (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span aria-hidden="true">/</span>}
              {crumb.isCurrent ? (
                <span
                  aria-current="page"
                  className="truncate font-semibold text-foreground"
                >
                  {crumb.label}
                </span>
              ) : crumb.href ? (
                <PendingLink
                  href={crumb.href}
                  className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground hover:underline"
                >
                  {crumb.label}
                </PendingLink>
              ) : (
                <span className="truncate text-muted-foreground">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
