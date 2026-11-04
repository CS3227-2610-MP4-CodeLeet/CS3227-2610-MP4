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
import ForumsPage from './page';
import DiscussionNotFound from './not-found';
const courseId = 'f0300000-0000-4000-8000-000000000020';

beforeEach(() => {
  mocks.load.mockResolvedValue({ rows: [], hasNext: false });
  mocks.access.lifecycle = 'active';
});
describe('forum empty and text states', () => {
  it('shows search recovery and retains the normalized query in paging', async () => {
    const html = renderToStaticMarkup(
      await ForumsPage({
        searchParams: Promise.resolve({ courseId, q: '  loops  ', page: '2' }),
      }),
    );
    expect(mocks.load).toHaveBeenCalledWith({}, courseId, 2, 'loops');
    expect(html).toContain('No discussions match your search.');
    expect(html).toContain('Clear search');
    expect(html).toContain(
      `/forums?courseId=${courseId}&amp;q=loops&amp;page=1`,
    );
  });
  it('offers a first-discussion action when the forum is empty', async () => {
    const html = renderToStaticMarkup(
      await ForumsPage({ searchParams: Promise.resolve({ courseId }) }),
    );
    expect(html).toContain('No discussions yet. Start the first one.');
    expect(html).toContain(`href="/forums/new?courseId=${courseId}"`);
  });
  it('hides the new-discussion action in an archived course', async () => {
    mocks.access.lifecycle = 'archived';
    const html = renderToStaticMarkup(
      await ForumsPage({ searchParams: Promise.resolve({ courseId }) }),
    );
    expect(html).not.toContain('New discussion');
    expect(html).not.toContain('/forums/new');
  });
  it('offers page recovery when an older page is empty', async () => {
    const html = renderToStaticMarkup(
      await ForumsPage({
        searchParams: Promise.resolve({ courseId, page: '2' }),
      }),
    );
    expect(html).toContain('No discussions on this page.');
    expect(html).toContain(`/forums?courseId=${courseId}&amp;page=1`);
  });
  it('renders titles and post bodies as escaped text', async () => {
    mocks.load.mockResolvedValue({
      rows: [
        {
          id: crypto.randomUUID(),
          title: '<img src=x>',
          body: '<script>text only</script>',
          author_name: 'Member',
          author_role: 'student',
          created_at: '2026-10-31T00:00:00Z',
        },
      ],
      hasNext: false,
    });
    const html = renderToStaticMarkup(
      await ForumsPage({ searchParams: Promise.resolve({ courseId }) }),
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('links to /courses in DiscussionNotFound without creating an infinite /forums loop', () => {
    const html = renderToStaticMarkup(DiscussionNotFound());
    expect(html).toContain('href="/courses"');
    expect(html).not.toContain('href="/forums"');
  });
});
