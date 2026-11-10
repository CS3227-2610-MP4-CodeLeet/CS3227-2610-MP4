import Link from 'next/link';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { IllustratedEmptyState } from './illustrated-empty-state';

describe('IllustratedEmptyState', () => {
  it('renders accessible copy and the selected decorative illustration', () => {
    const html = renderToStaticMarkup(
      <IllustratedEmptyState
        title="No discussions yet"
        description="Start a conversation with your course."
        illustration="discussion"
      />,
    );

    expect(html).toMatch(/<h2[^>]*>No discussions yet<\/h2>/);
    expect(html).toContain('Start a conversation with your course.');
    expect(html).toContain('data-illustration="discussion"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('supports an optional keyboard-accessible action', () => {
    const withAction = renderToStaticMarkup(
      <IllustratedEmptyState
        title="No courses yet"
        description="Create or join a course."
        illustration="collection"
        action={<Link href="/courses/new">Create course</Link>}
      />,
    );
    const withoutAction = renderToStaticMarkup(
      <IllustratedEmptyState
        title="No courses yet"
        description="Create or join a course."
        illustration="collection"
      />,
    );

    expect(withAction).toContain('href="/courses/new"');
    expect(withAction).toContain('>Create course</a>');
    expect(withoutAction).not.toContain('href=');
  });

  it('uses the compact layout when requested', () => {
    const html = renderToStaticMarkup(
      <IllustratedEmptyState
        title="No revisions yet"
        description="Submit code to start your history."
        illustration="code"
        size="compact"
      />,
    );

    expect(html).toContain('data-size="compact"');
  });
});
