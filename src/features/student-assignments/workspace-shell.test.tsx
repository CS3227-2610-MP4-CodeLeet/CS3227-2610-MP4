/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceShell } from './workspace-shell';

const mocks = vi.hoisted(() => ({
  pathname: '/student/assignments',
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
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
});

describe('student workspace shell', () => {
  it.each([
    ['/student/progress', 'My progress'],
    ['/student/xp', 'My XP'],
    ['/leaderboard', 'Leaderboard'],
  ])('uses the matching breadcrumb for %s', (path, label) => {
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
  });
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

  it('adds authenticated workspace destinations and selects the matching section', () => {
    mocks.pathname = '/forums/thread-1';
    const html = renderToStaticMarkup(
      <WorkspaceShell assignments={assignments} authenticated>
        <p>Thread</p>
      </WorkspaceShell>,
    );
    expect(html).not.toContain('Preview with sample assignments.');
    expect(html).toContain('My submissions');
    expect(html).toContain('My grades');
    expect(html).toContain('Forums');
    expect(html).toContain('Profile settings');
    expect(html).toContain('Sign out');
    expect(html).toContain('href="/forums"');
    expect(html).toContain('Thread');
  });

  it('uses the grades section for grade routes and omits a missing assignment crumb', () => {
    mocks.pathname = '/student/grades';
    const html = renderToStaticMarkup(
      <WorkspaceShell assignments={assignments} authenticated>
        <p>Grades</p>
      </WorkspaceShell>,
    );
    expect(html).toContain('href="/student/grades"');
    expect(html).toContain('>Grades</p>');
    expect(html).not.toContain('Loop practice');
  });
});
