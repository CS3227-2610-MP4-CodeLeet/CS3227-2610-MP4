'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import type { CourseFeatureSetting } from '@/features/course-workspaces/contracts';
import { formatXp } from '@/features/assignment-xp/contracts';

export type CourseSidebarProps = {
  course: {
    id: string;
    title: string;
    lifecycle: string;
  };
  role: 'student' | 'instructor';
  userName: string;
  totalXp?: string | null;
  features: CourseFeatureSetting[];
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

type NavItem = {
  label: string;
  href: string;
  enabled: boolean;
  icon: (collapsed: boolean) => ReactNode;
  primary?: boolean;
};

export function CourseSidebar({
  course,
  role,
  userName,
  totalXp,
  features,
  isMobileOpen = false,
  onCloseMobile,
}: CourseSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('codeleet:course-sidebar-collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore local storage errors
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(
          'codeleet:course-sidebar-collapsed',
          next ? 'true' : 'false',
        );
      } catch {
        // Ignore local storage errors
      }
      return next;
    });
  };

  const archived = course.lifecycle === 'archived';
  const hasFeature = (name: string) =>
    features.some((f) => f.feature === name && f.enabled);

  const assessmentsEnabled = archived || hasFeature('assessments');
  const discussionsEnabled = archived || hasFeature('discussions');
  const xpEnabled = hasFeature('xp');
  const leaderboardEnabled = archived || hasFeature('leaderboard');
  const aiEnabled = archived || hasFeature('ai');

  const assignmentsHref =
    role === 'student'
      ? `/courses/${course.id}/assignments`
      : `/courses/${course.id}/instructor`;

  const navItems: NavItem[] = [
    {
      label: 'Course Overview',
      href: `/courses/${course.id}`,
      enabled: true,
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      label: 'Assignments',
      href: assignmentsHref,
      enabled: assessmentsEnabled,
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      label: 'Submissions',
      href: `/courses/${course.id}/submissions`,
      enabled: role === 'student',
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Grades',
      href: `/courses/${course.id}/grades`,
      enabled: role === 'student',
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      label: 'My Progress',
      href: `/courses/${course.id}/progress`,
      enabled: role === 'student',
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
    {
      label: 'Discussions',
      href: `/courses/${course.id}/forums`,
      enabled: discussionsEnabled,
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      label: 'Leaderboard',
      href: `/courses/${course.id}/leaderboard`,
      enabled: leaderboardEnabled,
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
    {
      label: 'My XP',
      href: `/courses/${course.id}/xp`,
      enabled: role === 'student' && xpEnabled,
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
    },
    {
      label: 'AI Usage',
      href: `/courses/${course.id}/ai-usage`,
      enabled: aiEnabled,
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: 'Context Comparison',
      href: `/courses/${course.id}/instructor/ai-context`,
      enabled: role === 'instructor' && !archived && aiEnabled,
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
    },
    {
      label: 'New Assignment',
      href: `/courses/${course.id}/instructor/assignments/new`,
      enabled: role === 'instructor' && !archived && assessmentsEnabled,
      primary: true,
      icon: () => (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
  ];

  const content = (
    <div className="flex h-full flex-col">
      {/* Top: Course branding & collapse toggle */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
            {course.title.slice(0, 2).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold" title={course.title}>
                {course.title}
              </h2>
              <span className="text-xs capitalize text-muted-foreground">
                {course.lifecycle}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleCollapse}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground md:inline-flex"
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* User Info & XP Pill */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
            {userName ? userName.slice(0, 1).toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="text-xs capitalize text-muted-foreground">{role}</p>
            </div>
          )}
        </div>

        {/* Total XP Display */}
        {role === 'student' && xpEnabled && totalXp != null && (
          <div
            className={`mt-3 flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-500 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title={`${formatXp(totalXp)} XP`}
          >
            {!isCollapsed && <span>Total XP</span>}
            <span>{isCollapsed ? `${formatXp(totalXp)} XP` : `${formatXp(totalXp)} XP`}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        aria-label="Course section links"
        className="flex-1 space-y-1 overflow-y-auto p-3"
      >
        {navItems
          .filter((item) => item.enabled)
          .map((item) => {
            const isActive =
              item.href === `/courses/${course.id}`
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  item.primary
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : isActive
                      ? 'bg-accent font-semibold text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                {item.icon(isCollapsed)}
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden border-r bg-background transition-all duration-200 md:block ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile drawer backdrop and overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative flex w-4/5 max-w-xs flex-col border-r bg-background shadow-xl">
            <div className="absolute right-3 top-3">
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation menu"
                className="rounded p-1 text-muted-foreground hover:bg-accent"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
