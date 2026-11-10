import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  access: { role: 'student', lifecycle: 'active', featureEnabled: true },
}));

vi.mock('@/features/forums/access.server', () => ({
  requireForumMember: async () => ({ user: { id: 'user-1' }, supabase: {} }),
  requireDiscussionCourse: async (
    _userId: string,
    _client: unknown,
    courseId: string,
  ) => ({
    courseId,
    access: mocks.access,
  }),
}));

vi.mock('@/lib/courses/access', () => ({
  readCourseAccess: async () => ({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  }),
}));

vi.mock('@/features/forums/data.server', () => ({ loadThreads: mocks.load }));

import CourseForumsPage from './page';

const courseId = 'f0300000-0000-4000-8000-000000000020';

beforeEach(() => {
  mocks.load.mockResolvedValue({ rows: [], hasNext: false });
  mocks.access.lifecycle = 'active';
});

describe('course forums empty and text states', () => {
  it('shows search recovery and retains the normalized query in paging', async () => {
    const html = renderToStaticMarkup(
      await CourseForumsPage({
        params: Promise.resolve({ courseId }),
        searchParams: Promise.resolve({ q: '  loops  ', page: '2' }),
      }),
    );
    expect(mocks.load).toHaveBeenCalledWith({}, courseId, 2, 'loops');
    expect(html).toContain('No more discussions on this page.');
    expect(html).toContain('data-illustration="discussion"');
  });

  it('offers a new-discussion action when active', async () => {
    const html = renderToStaticMarkup(
      await CourseForumsPage({
        params: Promise.resolve({ courseId }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(html).toContain(`/courses/${courseId}/forums/new`);
    expect(html).toContain('New discussion');
    expect(html).toContain('data-illustration="discussion"');
  });
});
