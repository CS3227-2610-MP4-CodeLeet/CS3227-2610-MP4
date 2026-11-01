import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ForumPager, PostAuthor } from './components';
import ForumsError from '@/app/forums/error';
import ForumsLoading from '@/app/forums/loading';

describe('forum presentation boundaries', () => {
  it('escapes author names and labels Singapore time', () => {
    const html = renderToStaticMarkup(
      <PostAuthor
        post={{
          id: crypto.randomUUID(),
          body: 'Text',
          author_name: '<img src=x onerror=alert(1)>',
          author_role: 'student',
          created_at: '2026-10-31T00:00:00Z',
        }}
      />,
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('SGT');
  });
  it('omits unnecessary pagination and retains previous-page recovery', () => {
    expect(
      renderToStaticMarkup(
        <ForumPager page={1} hasNext={false} path="/forums" />,
      ),
    ).toBe('');
    const html = renderToStaticMarkup(
      <ForumPager page={2} hasNext={false} path="/forums" />,
    );
    expect(html).toContain('/forums?page=1');
    expect(html).not.toContain('Next');
  });
  it('shows loading and safe recoverable errors', () => {
    expect(renderToStaticMarkup(<ForumsLoading />)).toContain('role="status"');
    expect(
      renderToStaticMarkup(<ForumsError reset={() => undefined} />),
    ).toContain('Try again');
  });
});
