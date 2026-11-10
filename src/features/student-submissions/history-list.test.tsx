import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SubmissionHistoryList } from './history-list';
import type { HistoryItem } from './history';
import { emptyListFilters } from '@/features/student-lists/filters';

const rowData = {
  id: '00000000-0000-4000-8000-000000000001',
  assignmentId: '00000000-0000-4000-8000-000000000002',
  title: 'Loops & arrays',
  language: 'python',
  revision: 3,
  submittedAt: '2026-10-31T00:00:00Z',
  isLate: false,
  dueAtSubmission: null,
} as const;
const row: HistoryItem = rowData;
const codeIllustrationMarker = 'data-illustration="code"';

describe('submission history presentation', () => {
  it('renders revision details and pagination for a populated page', () => {
    const html = renderToStaticMarkup(
      <SubmissionHistoryList
        history={{ rows: [row], hasNext: true }}
        page={2}
        courseId="course-a"
      />,
    );
    expect(html).toContain('aria-label="My submitted revisions"');
    expect(html).toContain('Loops &amp; arrays');
    expect(html).toContain(
      '/courses/course-a/submissions/00000000-0000-4000-8000-000000000001',
    );
    expect(html).toContain('Python');
    expect(html).toMatch(/(?:>3<\/td>|>3<\/p>)/);
    expect(html).toContain('31 Oct 2026');
    expect(html).toContain('Next');
  }, 15_000);

  it('distinguishes an unfiltered first page from later pages and filtered emptiness', () => {
    const first = renderToStaticMarkup(
      <SubmissionHistoryList
        history={{ rows: [], hasNext: false }}
        page={1}
        courseId="course-a"
      />,
    );
    expect(first).toContain('No submissions yet');
    expect(first).toContain(codeIllustrationMarker);
    expect(first).toContain('/courses/course-a/assignments');

    const later = renderToStaticMarkup(
      <SubmissionHistoryList
        history={{ rows: [], hasNext: false }}
        page={2}
        courseId="course-a"
      />,
    );
    expect(later).toContain('No submissions on this page');
    expect(later).toContain(codeIllustrationMarker);
    expect(later).toContain('Latest submissions');
    expect(later).toContain('href="/courses/course-a/submissions"');

    const filtered = renderToStaticMarkup(
      <SubmissionHistoryList
        history={{ rows: [], hasNext: false }}
        page={1}
        filters={{ ...emptyListFilters, q: 'missing' }}
        courseId="course-a"
      />,
    );
    expect(filtered).toContain('No matching submissions');
    expect(filtered).not.toContain('No submissions yet');
    expect(filtered).toContain(codeIllustrationMarker);
  });
});
