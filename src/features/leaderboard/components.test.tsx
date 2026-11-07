// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LeaderboardView } from './components';
afterEach(cleanup);
it('renders shared ranks, exact totals and own position without executing names', () => {
  render(
    <LeaderboardView
      courseId="course-1"
      data={{
        page: 1,
        has_more: true,
        own: { rank: '3', total_xp: '9007199254740993' },
        rows: [
          {
            position: 1,
            rank: '1',
            username: '<script>literal</script>',
            total_xp: '9007199254740993',
            is_current_user: true,
          },
          {
            position: 2,
            rank: '1',
            username: 'Other',
            total_xp: '9007199254740993',
            is_current_user: false,
          },
        ],
      }}
    />,
  );
  expect(screen.getAllByRole('cell', { name: /^1$/ })).toHaveLength(2);
  expect(screen.getByText('<script>literal</script>')).toBeTruthy();
  expect(document.querySelector('script')).toBeNull();
  expect(screen.getByText('You')).toBeTruthy();
  expect(screen.getAllByText('9,007,199,254,740,993')).toHaveLength(3);
  expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe(
    '/courses/course-1/leaderboard?page=2',
  );
});
it('distinguishes a new student, empty board and an empty later page', () => {
  const view = render(
    <LeaderboardView
      courseId="course-1"
      data={{
        page: 1,
        has_more: false,
        rows: [],
        own: { rank: null, total_xp: '0' },
      }}
    />,
  );
  expect(screen.getByText('Unranked')).toBeTruthy();
  expect(screen.getByText('No rankings yet')).toBeTruthy();
  view.rerender(
    <LeaderboardView
      courseId="course-1"
      data={{ page: 2, has_more: false, rows: [], own: null }}
    />,
  );
  expect(screen.getByText('No students on this page.')).toBeTruthy();
  expect(screen.queryByText('Your rank')).toBeNull();
  expect(
    screen.getByRole('link', { name: 'Previous' }).getAttribute('href'),
  ).toBe('/courses/course-1/leaderboard?page=1');
});
