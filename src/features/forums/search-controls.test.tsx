import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ForumSearchControls } from './search-controls';

describe('ForumSearchControls', () => {
  it('renders a form targeting the course forum route', () => {
    const html = renderToStaticMarkup(
      <ForumSearchControls query="algorithm" courseId="course-xyz" />,
    );

    expect(html).toContain('action="/courses/course-xyz/forums"');
    expect(html).not.toContain('action="/forums"');
    expect(html).toContain('name="q"');
    expect(html).toContain('value="algorithm"');
    expect(html).toContain('href="/courses/course-xyz/forums"');
    expect(html).toContain('Clear search');
  });

  it('omits clear search when query is empty', () => {
    const html = renderToStaticMarkup(
      <ForumSearchControls query="" courseId="course-xyz" />,
    );

    expect(html).toContain('action="/courses/course-xyz/forums"');
    expect(html).not.toContain('Clear search');
  });
});
