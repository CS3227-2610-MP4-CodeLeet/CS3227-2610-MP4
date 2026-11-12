import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SubmissionHistoryList } from './history-list';
import type { HistoryItem } from './history';
import { emptyListFilters } from '@/features/student-lists/filters';

const assignmentTitle = 'Loops & arrays';
const rowData = {
  id: '00000000-0000-4000-8000-000000000001',
  assignmentId: '00000000-0000-4000-8000-000000000002',
  title: assignmentTitle,
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

it('uses timestamp/ID boundaries on both links and retains filters in Latest', () => {
  const older = {
    ...row,
    id: '00000000-0000-4000-8000-000000000003',
    submittedAt: '2026-10-30T00:00:00.123456Z',
  };
  const html = renderToStaticMarkup(
    <SubmissionHistoryList
      history={{ rows: [row, older], hasNext: true }}
      page={2}
      courseId="course-a"
      filters={{ q: assignmentTitle, language: 'python' }}
    />,
  );
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(
    (match) => new URL(match[1].replaceAll('&amp;', '&'), 'https://local.test'),
  );
  const next = links.find((url) => url.searchParams.has('after'))!;
  const previous = links.find((url) => url.searchParams.has('before'))!;
  expect(next?.searchParams.get('after')).toBe(
    '2026-10-30T00:00:00.123456Z|00000000-0000-4000-8000-000000000003',
  );
  expect(next?.searchParams.get('page')).toBe('3');
  expect(previous?.searchParams.get('before')).toBe(
    '2026-10-31T00:00:00Z|00000000-0000-4000-8000-000000000001',
  );
  expect(previous?.searchParams.get('page')).toBeNull();
  for (const url of [next, previous]) {
    expect(url?.searchParams.get('q')).toBe(assignmentTitle);
    expect(url?.searchParams.get('language')).toBe('python');
  }
  expect(html).toContain('Latest submissions');
});
