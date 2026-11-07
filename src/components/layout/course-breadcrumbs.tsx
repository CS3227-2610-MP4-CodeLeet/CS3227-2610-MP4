'use client';

import Link from 'next/link';
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

  let currentPath = `/courses/${courseId}`;
  courseSubSegments.forEach((segment, idx) => {
    const isLast = idx === courseSubSegments.length - 1;
    currentPath += `/${segment}`;
    const label = isLast && leafTitle ? leafTitle : formatSegmentLabel(segment);
    crumbs.push({
      label,
      href: isLast ? undefined : currentPath,
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
              ) : (
                <Link
                  href={crumb.href || '#'}
                  className="truncate hover:text-foreground hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
