'use client';

import { useState, type ReactNode } from 'react';
import { CourseSidebar, type CourseSidebarProps } from './course-sidebar';
import { CourseBreadcrumbs } from './course-breadcrumbs';

export type CourseWorkspaceShellProps = Omit<
  CourseSidebarProps,
  'isMobileOpen' | 'onCloseMobile'
> & {
  children: ReactNode;
};

export function CourseWorkspaceShell({
  course,
  role,
  userName,
  totalXp,
  features,
  children,
}: CourseWorkspaceShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <CourseSidebar
        course={course}
        role={role}
        userName={userName}
        totalXp={totalXp}
        features={features}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <CourseBreadcrumbs
          courseId={course.id}
          courseTitle={course.title}
          isMobileSidebarOpen={isMobileOpen}
          onToggleMobileSidebar={() => setIsMobileOpen(true)}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
