import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RevisionComparisonView } from './revision-comparison';
import type { RevisionComparison } from './revision-comparison.server';

const data: RevisionComparison = {
  anchor: {
    id: '10000000-0000-4000-8000-000000000010',
    assignment_id: '10000000-0000-4000-8000-000000000011',
    language: 'java',
    revision: 2,
    assignments: null,
  },
  latestRevision: 2,
  before: {
    id: '10000000-0000-4000-8000-000000000012',
    revision: 1,
    source: 'old\n<img src=x onerror=alert(1)>',
  },
  after: {
    id: '10000000-0000-4000-8000-000000000010',
    revision: 2,
    source: 'new\n<img src=x onerror=alert(1)>',
  },
};

it('renders safe code, both line numbers, accessible change markers and bounded revision controls', () => {
  const html = renderToStaticMarkup(
    <RevisionComparisonView comparison={data} />,
  );
  expect(html).toContain('Compare revisions');
  expect(html).toContain('Assignment unavailable');
  expect(html).toContain('Java');
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<img');
  expect(html).toContain('From line');
  expect(html).toContain('To line');
  expect(html).toContain('Removed');
  expect(html).toContain('Added');
  expect(html).toContain('tabindex="0"');
  expect(html).toContain('name="before"');
  expect(html).toContain('max="2"');
});

it('explains identical and single-revision comparisons', () => {
  expect(
    renderToStaticMarkup(
      <RevisionComparisonView comparison={{ ...data, after: data.before }} />,
    ),
  ).toContain('No changes between these revisions.');
  const html = renderToStaticMarkup(
    <RevisionComparisonView
      comparison={{ ...data, latestRevision: 1, before: null, after: null }}
    />,
  );
  expect(html).toContain('Save another revision to compare changes.');
  expect(html).not.toContain('name="before"');
});
