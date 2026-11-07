'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore, type ReactNode } from 'react';
import type { CourseFeatureSetting } from '@/features/course-workspaces/contracts';
import { formatXp } from '@/features/assignment-xp/contracts';
import {
  ArrowsRightLeftIcon,
  BarChartIcon,
  ChatBubbleIcon,
  ClipboardIcon,
  ClockIcon,
  HomeIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
  TrophyIcon,
} from './course-sidebar-icons';

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

const SIDEBAR_STORAGE_KEY = 'codeleet:course-sidebar-collapsed';
const listeners = new Set<() => void>();

function subscribeSidebar(callback: () => void) {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getSidebarSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getServerSidebarSnapshot(): boolean {
  return false;
}

function setSidebarCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // Ignore local storage errors
  }
  listeners.forEach((listener) => listener());
}

function isFeatureEnabled(
  features: CourseFeatureSetting[],
  feature: string,
  archived: boolean,
) {
  if (archived) return true;
  return features.some((f) => f.feature === feature && f.enabled);
}

function getInstructorNavItems(
  courseId: string,
  archived: boolean,
  features: CourseFeatureSetting[],
): NavItem[] {
  if (archived) return [];
  const hasAssessments = features.some(
    (f) => f.feature === 'assessments' && f.enabled,
  );
  const hasAi = features.some((f) => f.feature === 'ai' && f.enabled);
  return [
    {
      label: 'Context comparison',
      href: `/courses/${courseId}/instructor/ai-context`,
      enabled: hasAi,
      icon: () => <ArrowsRightLeftIcon />,
    },
    {
      label: 'New assignment',
      href: `/courses/${courseId}/instructor/assignments/new`,
      enabled: hasAssessments,
      primary: true,
      icon: () => <PlusIcon />,
    },
  ];
}

function getStudentNavItems(
  courseId: string,
  features: CourseFeatureSetting[],
): NavItem[] {
  const hasXp = features.some((f) => f.feature === 'xp' && f.enabled);
  return [
    {
      label: 'My submissions',
      href: `/courses/${courseId}/submissions`,
      enabled: true,
      icon: () => <ClockIcon />,
    },
    {
      label: 'My grades',
      href: `/courses/${courseId}/grades`,
      enabled: true,
      icon: () => <BarChartIcon />,
    },
    {
      label: 'My progress',
      href: `/courses/${courseId}/progress`,
      enabled: true,
      icon: () => <TrendingUpIcon />,
    },
    {
      label: 'My XP',
      href: `/courses/${courseId}/xp`,
      enabled: hasXp,
      icon: () => <StarIcon />,
    },
  ];
}

function buildNavItems(
  courseId: string,
  role: 'student' | 'instructor',
  lifecycle: string,
  features: CourseFeatureSetting[],
): NavItem[] {
  const archived = lifecycle === 'archived';
  const assessments = isFeatureEnabled(features, 'assessments', archived);
  const discussions = isFeatureEnabled(features, 'discussions', archived);
  const leaderboard = isFeatureEnabled(features, 'leaderboard', archived);
  const ai = isFeatureEnabled(features, 'ai', archived);

  const assignmentsHref =
    role === 'student'
      ? `/courses/${courseId}/assignments`
      : `/courses/${courseId}/instructor`;

  return [
    {
      label: 'Course overview',
      href: `/courses/${courseId}`,
      enabled: true,
      icon: () => <HomeIcon />,
    },
    {
      label: 'Assignments',
      href: assignmentsHref,
      enabled: assessments,
      icon: () => <ClipboardIcon />,
    },
    ...(role === 'student' ? getStudentNavItems(courseId, features) : []),
    {
      label: 'Discussions',
      href: `/courses/${courseId}/forums`,
      enabled: discussions,
      icon: () => <ChatBubbleIcon />,
    },
    {
      label: 'Leaderboard',
      href: `/courses/${courseId}/leaderboard`,
      enabled: leaderboard,
      icon: () => <TrophyIcon />,
    },
    {
      label: 'AI usage',
      href: `/courses/${courseId}/ai-usage`,
      enabled: ai,
      icon: () => <SparklesIcon />,
    },
    ...(role === 'instructor'
      ? getInstructorNavItems(courseId, archived, features)
      : []),
  ];
}

function SidebarHeader({
  course,
  isCollapsed,
  toggleCollapse,
}: {
  course: CourseSidebarProps['course'];
  isCollapsed: boolean;
  toggleCollapse: () => void;
}) {
  return (
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
          className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
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
  );
}

function SidebarUserProfile({
  userName,
  role,
  totalXp,
  xpEnabled,
  isCollapsed,
}: {
  userName: string;
  role: 'student' | 'instructor';
  totalXp?: string | null;
  xpEnabled: boolean;
  isCollapsed: boolean;
}) {
  return (
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

      {role === 'student' && xpEnabled && totalXp != null && (
        <div
          className={`mt-3 flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-500 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
          title={`${formatXp(totalXp)} XP`}
        >
          {!isCollapsed && <span>Total XP</span>}
          <span>{formatXp(totalXp)} XP</span>
        </div>
      )}
    </div>
  );
}

function SidebarNavLinks({
  courseId,
  navItems,
  pathname,
  isCollapsed,
  onCloseMobile,
}: {
  courseId: string;
  navItems: NavItem[];
  pathname: string;
  isCollapsed: boolean;
  onCloseMobile?: () => void;
}) {
  return (
    <nav
      aria-label="Course section links"
      className="flex-1 space-y-1 overflow-y-auto p-3"
    >
      {navItems
        .filter((item) => item.enabled)
        .map((item) => {
          const isActive =
            item.href === `/courses/${courseId}`
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
  );
}

function MobileSidebarDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative flex w-4/5 max-w-xs flex-col border-r bg-background shadow-xl">
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={onClose}
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
        {children}
      </aside>
    </div>
  );
}

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
  const isCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getServerSidebarSnapshot,
  );

  const toggleCollapse = () => {
    setSidebarCollapsed(!isCollapsed);
  };

  const xpEnabled = features.some((f) => f.feature === 'xp' && f.enabled);
  const navItems = buildNavItems(course.id, role, course.lifecycle, features);

  const content = (
    <div className="flex h-full flex-col">
      <SidebarHeader
        course={course}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />
      <SidebarUserProfile
        userName={userName}
        role={role}
        totalXp={totalXp}
        xpEnabled={xpEnabled}
        isCollapsed={isCollapsed}
      />
      <SidebarNavLinks
        courseId={course.id}
        navItems={navItems}
        pathname={pathname}
        isCollapsed={isCollapsed}
        onCloseMobile={onCloseMobile}
      />
    </div>
  );

  return (
    <>
      <aside
        className={`hidden border-r bg-background transition-all duration-200 md:block ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {content}
      </aside>
      <MobileSidebarDrawer isOpen={isMobileOpen} onClose={onCloseMobile}>
        {content}
      </MobileSidebarDrawer>
    </>
  );
}
