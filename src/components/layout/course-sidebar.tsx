'use client';

import { usePathname } from 'next/navigation';
import { useSyncExternalStore, type ReactNode } from 'react';
import type { CourseFeatureSetting } from '@/features/course-workspaces/contracts';
import { formatXp } from '@/features/assignment-xp/contracts';
import { PendingLink } from '@/components/ui/pending-link';
import {
  ArrowsRightLeftIcon,
  BarChartIcon,
  ChatBubbleIcon,
  ClipboardIcon,
  ClockIcon,
  HomeIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
  TrophyIcon,
  UserGearIcon,
} from './course-sidebar-icons';
import { isNavItemActive } from './course-sidebar-nav';

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

import {
  getServerSidebarSnapshot,
  getSidebarSnapshot,
  setSidebarCollapsed,
  subscribeSidebar,
} from './course-sidebar-storage';
import { MobileSidebarDrawer } from './mobile-sidebar-drawer';

type NavItem = {
  label: string;
  href: string;
  enabled: boolean;
  icon: (collapsed: boolean) => ReactNode;
};

function isFeatureEnabled(
  features: CourseFeatureSetting[],
  feature: string,
  archived: boolean,
) {
  if (archived) return true;
  return features.some((f) => f.feature === feature && f.enabled);
}

function buildAdminNavItems(
  courseId: string,
  archived: boolean,
  features: CourseFeatureSetting[],
): NavItem[] {
  const hasAi = features.some((f) => f.feature === 'ai' && f.enabled);
  return [
    {
      label: 'Manage Users',
      href: `/courses/${courseId}/manage-users`,
      enabled: true,
      icon: () => <UserGearIcon />,
    },
    {
      label: 'Context comparison',
      href: `/courses/${courseId}/context-comparison`,
      enabled: !archived && hasAi,
      icon: () => <ArrowsRightLeftIcon />,
    },
  ];
}

function getStudentNavItems(
  courseId: string,
  archived: boolean,
  features: CourseFeatureSetting[],
): NavItem[] {
  const hasAssessments = isFeatureEnabled(features, 'assessments', archived);
  const hasXp = isFeatureEnabled(features, 'xp', archived);
  const hasProgress = hasAssessments || hasXp;
  return [
    {
      label: 'My submissions',
      href: `/courses/${courseId}/submissions`,
      enabled: hasAssessments,
      icon: () => <ClockIcon />,
    },
    {
      label: 'My grades',
      href: `/courses/${courseId}/grades`,
      enabled: hasAssessments,
      icon: () => <BarChartIcon />,
    },
    {
      label: 'My progress',
      href: `/courses/${courseId}/progress`,
      enabled: hasProgress,
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

  const assignmentsHref = `/courses/${courseId}/assignments`;

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
    ...(role === 'instructor'
      ? [
          {
            label: 'Submissions',
            href: `/courses/${courseId}/submissions`,
            enabled: assessments,
            icon: () => <ClockIcon />,
          },
        ]
      : []),
    ...(role === 'student'
      ? getStudentNavItems(courseId, archived, features)
      : []),
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

function SidebarLinkItem({
  item,
  isActive,
  isCollapsed,
  onCloseMobile,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onCloseMobile?: () => void;
}) {
  return (
    <PendingLink
      href={item.href}
      onClick={onCloseMobile}
      title={isCollapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
      icon={item.icon(isCollapsed)}
      hideLabel={isCollapsed}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        isActive
          ? 'bg-accent font-semibold text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      } ${isCollapsed ? 'justify-center px-2' : ''}`}
    >
      {item.label}
    </PendingLink>
  );
}

function SidebarNavLinks({
  courseId,
  navItems,
  adminNavItems,
  pathname,
  isCollapsed,
  onCloseMobile,
}: {
  courseId: string;
  navItems: NavItem[];
  adminNavItems?: NavItem[];
  pathname: string;
  isCollapsed: boolean;
  onCloseMobile?: () => void;
}) {
  const visibleAdminItems = (adminNavItems ?? []).filter(
    (item) => item.enabled,
  );

  return (
    <nav
      aria-label="Course section links"
      className="flex-1 space-y-1 overflow-y-auto p-3"
    >
      {navItems
        .filter((item) => item.enabled)
        .map((item) => (
          <SidebarLinkItem
            key={item.href}
            item={item}
            isActive={isNavItemActive(item.href, pathname, courseId)}
            isCollapsed={isCollapsed}
            onCloseMobile={onCloseMobile}
          />
        ))}

      {visibleAdminItems.length > 0 && (
        <div className="pt-4">
          {!isCollapsed ? (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </p>
          ) : (
            <hr className="my-2 border-border" />
          )}
          <div className="space-y-1">
            {visibleAdminItems.map((item) => (
              <SidebarLinkItem
                key={item.href}
                item={item}
                isActive={isNavItemActive(item.href, pathname, courseId)}
                isCollapsed={isCollapsed}
                onCloseMobile={onCloseMobile}
              />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function SidebarContent({
  course,
  role,
  userName,
  totalXp,
  xpEnabled,
  navItems,
  adminNavItems,
  pathname,
  isCollapsed,
  toggleCollapse,
  onCloseMobile,
}: {
  course: CourseSidebarProps['course'];
  role: 'student' | 'instructor';
  userName: string;
  totalXp?: string | null;
  xpEnabled: boolean;
  navItems: NavItem[];
  adminNavItems?: NavItem[];
  pathname: string;
  isCollapsed: boolean;
  toggleCollapse?: () => void;
  onCloseMobile?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <SidebarHeader
        course={course}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse ?? (() => {})}
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
        adminNavItems={adminNavItems}
        pathname={pathname}
        isCollapsed={isCollapsed}
        onCloseMobile={onCloseMobile}
      />
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
  const adminNavItems =
    role === 'instructor'
      ? buildAdminNavItems(course.id, course.lifecycle === 'archived', features)
      : [];

  return (
    <>
      <aside
        className={`hidden border-r bg-background transition-all duration-200 md:block ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent
          course={course}
          role={role}
          userName={userName}
          totalXp={totalXp}
          xpEnabled={xpEnabled}
          navItems={navItems}
          adminNavItems={adminNavItems}
          pathname={pathname}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />
      </aside>
      <MobileSidebarDrawer isOpen={isMobileOpen} onClose={onCloseMobile}>
        <SidebarContent
          course={course}
          role={role}
          userName={userName}
          totalXp={totalXp}
          xpEnabled={xpEnabled}
          navItems={navItems}
          adminNavItems={adminNavItems}
          pathname={pathname}
          isCollapsed={false}
          onCloseMobile={onCloseMobile}
        />
      </MobileSidebarDrawer>
    </>
  );
}
