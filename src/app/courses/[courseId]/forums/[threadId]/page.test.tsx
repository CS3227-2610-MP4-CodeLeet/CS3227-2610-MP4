import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  loadReplies: vi.fn(),
  loadThread: vi.fn(),
}));

vi.mock('@/features/forums/access.server', () => ({
  requireForumMember: async () => ({ user: { id: 'user-1' }, supabase: {} }),
  requireDiscussionCourse: async () => ({
    access: { lifecycle: 'archived', featureEnabled: false },
  }),
}));
vi.mock('@/features/forums/data.server', () => ({
  loadReplies: mocks.loadReplies,
  loadThread: mocks.loadThread,
}));
vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
}));

import CourseDiscussionPage from './page';

const courseId = 'f0300000-0000-4000-8000-000000000020';
const threadId = 'f0300000-0000-4000-8000-000000000021';

beforeEach(() => {
  mocks.loadThread.mockResolvedValue({
    id: threadId,
    title: 'Discussion title',
    body: 'Opening post',
    author_name: 'Student',
    author_role: 'student',
    created_at: '2026-11-01T00:00:00Z',
  });
  mocks.loadReplies.mockResolvedValue({ rows: [], hasNext: false });
});

describe('course discussion replies', () => {
  it('illustrates an empty reply list and keeps archived discussions read-only', async () => {
    const page = await CourseDiscussionPage({
      params: Promise.resolve({ courseId, threadId }),
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('No replies yet');
    expect(html).toContain('data-illustration="discussion"');
    expect(html).toContain('This discussion is read-only.');
    expect(html).not.toContain('Write a reply');
  });
});
