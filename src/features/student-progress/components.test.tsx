import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ProgressOverview, type ProgressData } from './components';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const empty: ProgressData = {
  assignments: { total: 0, submitted: 0, outstanding: 0, overdue: 0 },
  upcoming: [],
  xp: '0',
  submissions: [],
  grades: [],
};
const courseId = crypto.randomUUID();
const progressProps = {
  courseId,
  assessmentsEnabled: true,
  xpEnabled: true,
};

it('distinguishes empty work from completed work without inventing a percentage', () => {
  const html = renderToStaticMarkup(
    <ProgressOverview {...progressProps} data={empty} />,
  );
  expect(html).toContain('No assignments yet');
  expect(html).toContain('No upcoming deadlines');
  expect(html).toContain('No submissions yet');
  expect(html).toContain('No published grades yet');
  expect(html).not.toContain('<progress');
  expect(html).not.toContain('100%');
});

it('renders labelled progress, precise XP and safe actionable metadata', () => {
  const id = crypto.randomUUID();
  const data: ProgressData = {
    ...empty,
    assignments: { total: 1203, submitted: 2, outstanding: 1201, overdue: 3 },
    xp: '9007199254740993',
    upcoming: [
      {
        id,
        title: '<img src=x onerror=alert(1)>',
        language: 'java',
        due_at: '2026-11-04T00:00:00Z',
      },
    ],
    submissions: [
      {
        id,
        assignmentId: id,
        title: 'Java practice',
        language: 'java',
        revision: 7,
        submittedAt: '2026-11-03T00:00:00Z',
        isLate: true,
        dueAtSubmission: null,
      },
    ],
    grades: [
      {
        id,
        submissionId: id,
        title: 'Python practice',
        score: null,
        language: 'python',
        revision: 2,
        publishedAt: '2026-11-03T00:00:00Z',
      },
    ],
  };
  const html = renderToStaticMarkup(
    <ProgressOverview {...progressProps} data={data} />,
  );
  expect(html).toContain('max="1203"');
  expect(html).toContain('value="2"');
  expect(html).toContain('9,007,199,254,740,993');
  expect(html).toContain('aria-label="Assignment submission progress"');
  expect(html).toContain('SGT');
  expect(html).toContain('Revision 7');
  expect(html).toContain('Score unavailable');
  expect(html).toContain(`href="/courses/${courseId}/assignments/${id}"`);
  expect(html).toContain(`href="/courses/${courseId}/submissions/${id}"`);
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<img');
});

it.each(['assignments', 'upcoming', 'xp', 'submissions', 'grades'] as const)(
  'keeps healthy sections visible when %s fails without fabricating zero',
  (key) => {
    const html = renderToStaticMarkup(
      <ProgressOverview {...progressProps} data={{ ...empty, [key]: null }} />,
    );
    expect(html).toContain('Try again');
    expect(html).toContain('My progress');
    expect(html).not.toContain('private backend');
    if (key === 'xp') expect(html).toContain('XP unavailable');
    if (key === 'assignments') expect(html).not.toContain('0 of 0');
    if (key !== 'grades') expect(html).toContain('No published grades yet');
  },
);

it('hides course activity when its feature is disabled', () => {
  const html = renderToStaticMarkup(
    <ProgressOverview
      courseId={courseId}
      assessmentsEnabled={false}
      xpEnabled={false}
      data={empty}
    />,
  );
  expect(html).not.toContain('Submitted assignments');
  expect(html).not.toContain('Coming up');
  expect(html).not.toContain('Recent submissions');
  expect(html).not.toContain('Recent grades');
  expect(html).not.toContain('Total XP');
});
