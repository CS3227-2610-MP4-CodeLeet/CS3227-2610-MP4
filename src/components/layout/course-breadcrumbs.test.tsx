/** @vitest-environment jsdom */
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BreadcrumbProvider, BreadcrumbSetter } from './breadcrumb-context';
import { CourseBreadcrumbs } from './course-breadcrumbs';

const mockUsePathname = vi.fn(() => '/courses/course-123/assignments/asg-456');

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

afterEach(() => {
  cleanup();
  mockUsePathname.mockReturnValue('/courses/course-123/assignments/asg-456');
});

describe('CourseBreadcrumbs', () => {
  it('renders hierarchical breadcrumb trail with dynamic leaf title', () => {
    render(
      <BreadcrumbProvider>
        <CourseBreadcrumbs courseId="course-123" courseTitle="CS101: Python" />
        <BreadcrumbSetter title="Problem Set 1: Loops" />
      </BreadcrumbProvider>,
    );

    expect(
      screen.getByRole('navigation', { name: /breadcrumb/i }),
    ).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'Courses' }).getAttribute('href'),
    ).toBe('/courses');
    expect(
      screen.getByRole('link', { name: 'CS101: Python' }).getAttribute('href'),
    ).toBe('/courses/course-123');
    expect(
      screen.getByRole('link', { name: 'Assignments' }).getAttribute('href'),
    ).toBe('/courses/course-123/assignments');
    expect(screen.getByText('Problem Set 1: Loops')).toBeDefined();
  });

  it('renders mobile menu trigger button and fires callback', () => {
    const onToggle = vi.fn();
    render(
      <BreadcrumbProvider>
        <CourseBreadcrumbs
          courseId="course-123"
          courseTitle="CS101: Python"
          onToggleMobileSidebar={onToggle}
        />
      </BreadcrumbProvider>,
    );

    const toggleBtn = screen.getByRole('button', {
      name: /open navigation menu/i,
    });
    expect(toggleBtn).toBeDefined();
    toggleBtn.click();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('omits non-routable dynamic intermediate segments from breadcrumbs', () => {
    mockUsePathname.mockReturnValue(
      '/courses/course-123/assignments/asg-456/edit',
    );
    render(
      <BreadcrumbProvider>
        <CourseBreadcrumbs courseId="course-123" courseTitle="CS101: Python" />
      </BreadcrumbProvider>,
    );

    expect(
      screen.getByRole('link', { name: 'Assignments' }).getAttribute('href'),
    ).toBe('/courses/course-123/assignments');
    expect(screen.queryByText('Asg 456')).toBeNull();
    expect(screen.getByText('Edit')).toBeDefined();
  });

  it('omits intermediate dynamic identifiers on student revision comparison', () => {
    mockUsePathname.mockReturnValue(
      '/courses/course-123/submissions/sub-789/compare',
    );
    render(
      <BreadcrumbProvider>
        <CourseBreadcrumbs courseId="course-123" courseTitle="CS101: Python" />
        <BreadcrumbSetter title="Compare Revisions" />
      </BreadcrumbProvider>,
    );

    expect(
      screen.getByRole('link', { name: 'Submissions' }).getAttribute('href'),
    ).toBe('/courses/course-123/submissions');
    expect(screen.queryByText('Sub 789')).toBeNull();
    expect(screen.getByText('Compare Revisions')).toBeDefined();
  });
});
