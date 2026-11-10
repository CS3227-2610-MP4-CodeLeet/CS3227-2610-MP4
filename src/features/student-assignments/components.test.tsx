import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AssignmentInstructions, AssignmentList } from './components';
import type { AssignmentDetail, AssignmentSummary } from './types';
import { emptyListFilters } from '@/features/student-lists/filters';

const assignment: AssignmentSummary = {
  id: 'loops',
  title: 'Loops & arrays',
  language: 'python',
  publication_status: 'published',
};

describe('student assignment components', () => {
  it('renders published assignments with language and stable destinations', () => {
    const html = renderToStaticMarkup(
      <AssignmentList assignments={[assignment]} />,
    );
    expect(html).toContain('1 available');
    expect(html).toContain('Loops &amp; arrays');
    expect(html).toContain('Python');
    expect(html).toContain('/student/assignments/loops');
    expect(html).toContain('aria-label="View assignment: Loops &amp; arrays"');
  });

  it('keeps course context on assignment and filter destinations', () => {
    const html = renderToStaticMarkup(
      <AssignmentList assignments={[assignment]} courseId="course-a" />,
    );
    expect(html).toContain('href="/courses/course-a/assignments/loops"');
    expect(html).toContain('action="/courses/course-a/assignments"');
  });

  it('distinguishes empty library from an empty filtered result', () => {
    const empty = renderToStaticMarkup(<AssignmentList assignments={[]} />);
    expect(empty).toContain('No assignments yet');
    expect(empty).toContain('data-illustration="collection"');
    const filtered = renderToStaticMarkup(
      <AssignmentList
        assignments={[]}
        filters={{ ...emptyListFilters, q: 'loops' }}
      />,
    );
    expect(filtered).toContain('No matching assignments');
    expect(filtered).not.toContain('No assignments yet');
    expect(filtered).toContain('data-illustration="collection"');
  });

  it('renders published instructions as text and preserves line breaks', () => {
    const detail: AssignmentDetail = {
      ...assignment,
      instructions: 'Read a number.\nPrint its square.',
    };
    const html = renderToStaticMarkup(
      <AssignmentInstructions assignment={detail} />,
    );
    expect(html).toContain('Python assignment');
    expect(html).toContain('Read a number.\nPrint its square.');
    expect(html).toContain('href="/student/assignments"');
    const courseHtml = renderToStaticMarkup(
      <AssignmentInstructions assignment={detail} courseId="course-a" />,
    );
    expect(courseHtml).toContain('href="/courses/course-a/assignments"');
  });
});
