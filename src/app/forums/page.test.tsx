import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/features/forums/access.server', () => ({
  requireForumMember: async () => ({ supabase: {} }),
}));
vi.mock('@/features/forums/data.server', () => ({ loadThreads: mocks.load }));
import ForumsPage from './page';

beforeEach(() => {
  mocks.load.mockResolvedValue({ rows: [], hasNext: false });
});
describe('forum empty and text states', () => {
  it('offers a first-discussion action when the forum is empty', async () => {
    const html = renderToStaticMarkup(
      await ForumsPage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain('No discussions yet. Start the first one.');
    expect(html).toContain('href="/forums/new"');
  });
  it('offers page recovery when an older page is empty', async () => {
    const html = renderToStaticMarkup(
      await ForumsPage({ searchParams: Promise.resolve({ page: '2' }) }),
    );
    expect(html).toContain('No discussions on this page.');
    expect(html).toContain('/forums?page=1');
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
      await ForumsPage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
