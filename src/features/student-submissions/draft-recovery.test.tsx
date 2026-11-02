// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DraftRecovery } from './draft-recovery';
afterEach(cleanup);

it('offers named restore/discard controls and a machine-readable save time', () => {
  const resolve = vi.fn();
  render(
    <DraftRecovery
      status="recover"
      savedAt={1_800_000_000_000}
      resolve={resolve}
    />,
  );
  expect(
    screen.getByRole('region', { name: 'Recover unfinished code' }),
  ).toBeTruthy();
  expect(document.querySelector('time')?.dateTime).toBe(
    new Date(1_800_000_000_000).toISOString(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Restore draft' }));
  fireEvent.click(screen.getByRole('button', { name: 'Discard draft' }));
  expect(resolve.mock.calls).toEqual([['restore'], ['discard']]);
});

it('offers conflict choices and exposes save failures through status text', () => {
  const resolve = vi.fn();
  const view = render(<DraftRecovery status="conflict" resolve={resolve} />);
  fireEvent.click(screen.getByRole('button', { name: 'Load other draft' }));
  fireEvent.click(screen.getByRole('button', { name: 'Keep this tab’s code' }));
  expect(resolve.mock.calls).toEqual([['load'], ['keep']]);
  view.rerender(<DraftRecovery status="error" resolve={resolve} />);
  expect(screen.getByRole('status').textContent).toBe(
    "Couldn't save draft on this device",
  );
  expect(screen.queryByRole('button')).toBeNull();
});
