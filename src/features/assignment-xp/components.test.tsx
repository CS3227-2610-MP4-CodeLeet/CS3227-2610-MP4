// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { MaximumXpField, XpOverview } from './components';
afterEach(cleanup);
it('requires an explicit whole-number maximum and shows zero as a valid existing value', () => {
  render(<MaximumXpField />);
  const input = screen.getByLabelText('Maximum XP') as HTMLInputElement;
  expect(input.required).toBe(true);
  expect(input.value).toBe('');
  expect(input.max).toBe('100000');
  expect(input.step).toBe('1');
});
it('renders exact totals, available assignment links and hidden-title fallback without grade data', () => {
  render(
    <XpOverview
      courseId="course-1"
      data={{
        total_xp: '9007199254740993',
        page: 1,
        has_more: true,
        awards: [
          {
            assignment_id: 'c2000000-0000-4000-8000-000000000001',
            assignment_title: null,
            awarded_xp: 80,
            max_xp: null,
            updated_at: '2026-11-02T00:00:00Z',
          },
        ],
      }}
    />,
  );
  expect(screen.getByText('9,007,199,254,740,993')).toBeTruthy();
  expect(screen.getByText('Assignment unavailable')).toBeTruthy();
  expect(
    screen.queryByRole('link', { name: 'Assignment unavailable' }),
  ).toBeNull();
  expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe(
    '/courses/course-1/xp?page=2',
  );
});
it('illustrates a zero-award state without implying XP was earned', () => {
  render(
    <XpOverview
      courseId="course-1"
      data={{ total_xp: '0', page: 1, has_more: false, awards: [] }}
    />,
  );

  expect(screen.getByText('No XP awards yet.')).toBeTruthy();
  expect(document.querySelector('svg[data-illustration="progress"]')).toBeTruthy();
});
