// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProgressRetryButton } from './retry-button';

const refresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
afterEach(cleanup);

it('shows refresh progress and prevents duplicate retries until navigation completes', async () => {
  let finish!: () => void;
  refresh.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<ProgressRetryButton />);
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  const pending = screen.getByRole('button', { name: 'Refreshing…' });
  expect(pending.getAttribute('aria-busy')).toBe('true');
  expect(pending.hasAttribute('disabled')).toBe(true);
  fireEvent.click(pending);
  expect(refresh).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  expect(
    screen.getByRole('button', { name: 'Try again' }).hasAttribute('disabled'),
  ).toBe(false);
});
