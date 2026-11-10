/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceShell } from './workspace-shell';

const mocks = vi.hoisted(() => ({
  pathname: '/student/assignments',
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.searchParams,
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

const assignments = [
  {
    id: 'loops',
    title: 'Loop practice',
    language: 'python' as const,
    publication_status: 'published' as const,
  },
];
beforeEach(() => {
  mocks.pathname = '/student/assignments';
  mocks.searchParams = new URLSearchParams();
});

describe('student workspace shell', () => {
  it.each([['/courses/course-a/progress', 'My progress']])(
    'uses the matching breadcrumb for %s',
    (path, label) => {
      mocks.pathname = path;
      const html = renderToStaticMarkup(
        <WorkspaceShell assignments={[]} authenticated>
          <p>XP overview</p>
        </WorkspaceShell>,
      );
      const header = html.slice(
        html.indexOf('<header'),
        html.indexOf('</header>'),
      );
      const breadcrumb = header.slice(0, header.indexOf('</a>'));
      expect(breadcrumb).toContain(`href="${path}"`);
      expect(breadcrumb).toContain(label);
    },
  );
  it('shows a local preview with assignment navigation and the current assignment title', () => {
    mocks.pathname = '/student/assignments/loops';
    const html = renderToStaticMarkup(
      <WorkspaceShell assignments={assignments}>
        <p>Assignment body</p>
      </WorkspaceShell>,
    );
    expect(html).toContain('data-theme="light"');
    expect(html).toContain('Preview with sample assignments.');
    expect(html).toContain('Code stays on this page.');
    expect(html).toContain('Loop practice');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Skip to content');
    expect(html).not.toContain('Profile settings');
    expect(html).not.toContain('My progress');
    expect(html).not.toContain('>Sign out<');
  });

  it('uses only course-scoped authenticated destinations when a course is selected', () => {
    mocks.pathname = '/courses/course-a/forums/thread-1';
    mocks.searchParams = new URLSearchParams('courseId=course-a');
    const html = renderToStaticMarkup(
      <WorkspaceShell assignments={assignments} authenticated>
        <p>Thread</p>
      </WorkspaceShell>,
    );
    expectSelectedCourseNavigation(html);
  });
});

describe('authenticated course navigation', () => {
  it('offers only the course directory when authenticated navigation has no course context', () => {
    mocks.pathname = '/forums/thread-1';
    const html = renderToStaticMarkup(
      <WorkspaceShell assignments={assignments} authenticated>
        <p>Thread</p>
      </WorkspaceShell>,
    );
    expect(html).not.toContain('Preview with sample assignments.');
    expect(html).toContain('href="/courses"');
    expect(html).not.toContain('My submissions');
    expect(html).not.toContain('My grades');
    expect(html).not.toMatch(/href="\/student\//);
    expect(html).toContain('Profile settings');
    expect(html).toContain('Sign out');
    expect(html).not.toContain('href="/forums"');
    expect(html).toContain('Thread');
  });

  it('uses the grades section for grade routes and omits a missing assignment crumb', () => {
    mocks.pathname = '/courses/course-a/grades';
    mocks.searchParams = new URLSearchParams('courseId=course-a');
    const html = renderToStaticMarkup(
      <WorkspaceShell assignments={assignments} authenticated>
        <p>Grades</p>
      </WorkspaceShell>,
    );
    expect(html).toContain('href="/courses/course-a/grades"');
    expect(html).toContain('>Grades</p>');
    expect(html).not.toContain('Loop practice');
  });

  it('keeps the selected course on assignment and course navigation', () => {
    mocks.pathname = '/courses/course-a/assignments/loops';
    mocks.searchParams = new URLSearchParams('courseId=course-a');
    const html = renderToStaticMarkup(
      <WorkspaceShell assignments={assignments} authenticated>
        <p>Assignment</p>
      </WorkspaceShell>,
    );
    expect(html).toContain('href="/courses/course-a/assignments"');
    expect(html).toContain('href="/courses"');
  });

  it('uses the course in the URL path when a stale query names another course', () => {
    mocks.pathname = '/courses/course-a/assignments';
    mocks.searchParams = new URLSearchParams('courseId=course-b');
    const html = renderToStaticMarkup(
      <WorkspaceShell assignments={assignments} authenticated>
        <p>Assignments</p>
      </WorkspaceShell>,
    );
    expectSelectedCourseNavigation(html);
    expect(html).not.toContain('href="/courses/course-b/');
  });
});

function expectSelectedCourseNavigation(html: string) {
  expect(html).toContain('href="/courses/course-a/assignments"');
  expect(html).toContain('href="/courses/course-a/progress"');
  expect(html).toContain('href="/courses/course-a/submissions"');
  expect(html).toContain('href="/courses/course-a/grades"');
  expect(html).toContain('href="/courses"');
  expect(html).not.toMatch(/href="\/student\//);
  expect(html).toContain('My submissions');
  expect(html).toContain('My grades');
  expect(html).toContain('Profile settings');
  expect(html).toContain('Sign out');
}
