// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { XpOverview } from './components';
import { LeaderboardView } from '@/features/leaderboard/components';
import { loadOwnXp } from './queries.server';
import { loadLeaderboard } from '@/features/leaderboard/queries.server';

afterEach(cleanup);
const revision = 'a'.repeat(32);
it('carries the revision in XP navigation and explains a restart', () => {
  render(
    <XpOverview
      courseId="course"
      data={{
        total_xp: '80',
        page: 1,
        has_more: true,
        awards: [],
        revision,
        restarted: true,
      }}
    />,
  );
  expect(screen.getByRole('status').textContent).toContain('XP changed');
  expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe(
    `/courses/course/xp?page=2&revision=${revision}`,
  );
  expect(screen.queryByRole('link', { name: 'Previous' })).toBeNull();
});
it('carries the revision in leaderboard navigation and explains a restart', () => {
  render(
    <LeaderboardView
      courseId="course"
      data={{
        page: 1,
        has_more: true,
        rows: [],
        own: null,
        revision,
        restarted: true,
      }}
    />,
  );
  expect(screen.getByRole('status').textContent).toContain('XP changed');
  expect(screen.getByRole('link', { name: 'Next' }).getAttribute('href')).toBe(
    `/courses/course/leaderboard?page=2&revision=${revision}`,
  );
});
it.each([loadOwnXp, loadLeaderboard])(
  'passes a validated revision to the database',
  async (load) => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await load({ rpc } as never, 'course', 2, revision);
    expect(rpc.mock.calls[0][1]).toMatchObject({
      p_page: 2,
      p_revision: revision,
    });
    rpc.mockClear();
    await load({ rpc } as never, 'course', 2, 'invalid');
    expect(rpc).not.toHaveBeenCalled();
  },
);
