// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SlowRequestNotice } from './slow-request-notice';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('explains a slow request and removes its timer when the action finishes', () => {
  vi.useFakeTimers();
  const { unmount } = render(<SlowRequestNotice />);
  expect(screen.queryByRole('status')).toBeNull();
  act(() => {
    vi.advanceTimersByTime(10000);
  });
  expect(screen.getByRole('status').textContent).toContain(
    'taking longer than usual',
  );
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
