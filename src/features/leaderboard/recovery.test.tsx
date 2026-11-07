// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const refresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
import LeaderboardError from '@/app/courses/[courseId]/leaderboard/error';
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('uses the framework retry callback to clear a caught boundary error', () => {
  const retry = vi.fn();
  render(<LeaderboardError {...{ retry }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledOnce();
  expect(refresh).not.toHaveBeenCalled();
});
it('refreshes an explicitly rendered service error', () => {
  render(<LeaderboardError />);
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(refresh).toHaveBeenCalledOnce();
});
