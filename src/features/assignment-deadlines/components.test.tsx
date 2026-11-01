import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AssignmentDueDate, SubmissionTiming } from './components';

it('labels Singapore deadlines and missing dates without inventing one', () => {
  const html = renderToStaticMarkup(
    <AssignmentDueDate dueAt="2026-11-12T16:30:00Z" />,
  );
  expect(html).toContain('13 Nov 2026');
  expect(html).toContain('SGT');
  expect(html).toContain('dateTime="2026-11-12T16:30:00Z"');
  expect(renderToStaticMarkup(<AssignmentDueDate dueAt={null} />)).toContain(
    'No deadline',
  );
});

it('shows captured late/on-time status as text as well as colour', () => {
  expect(
    renderToStaticMarkup(
      <SubmissionTiming isLate dueAt="2000-01-01T00:00:00Z" />,
    ),
  ).toContain('Late');
  expect(
    renderToStaticMarkup(
      <SubmissionTiming isLate={false} dueAt="2999-01-01T00:00:00Z" />,
    ),
  ).toContain('On time');
  expect(
    renderToStaticMarkup(<SubmissionTiming isLate={false} dueAt={null} />),
  ).toContain('Submitted');
});
