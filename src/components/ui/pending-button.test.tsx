// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PendingButton, FormSubmitButton } from './pending-button';

afterEach(cleanup);

it('shows progress, blocks duplicate clicks and restores its original label', () => {
  const onClick = vi.fn();
  const { rerender } = render(
    <PendingButton pending pendingLabel="Saving…" onClick={onClick}>
      Save
    </PendingButton>,
  );
  const button = screen.getByRole('button', { name: 'Saving…' });
  expect(button.getAttribute('aria-busy')).toBe('true');
  expect(button.querySelector('[aria-hidden="true"]')).toBeTruthy();
  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
  rerender(
    <PendingButton pending={false} onClick={onClick}>
      Save
    </PendingButton>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onClick).toHaveBeenCalledOnce();
});

it('keeps an independently disabled button disabled', () => {
  render(
    <PendingButton pending={false} disabled>
      Publish
    </PendingButton>,
  );
  expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
});

it('tracks the enclosing form through an asynchronous submission', async () => {
  let finish!: () => void;
  const request = new Promise<void>((resolve) => {
    finish = resolve;
  });
  render(
    <form
      action={async () => {
        await request;
      }}
    >
      <FormSubmitButton pendingLabel="Searching…">Search</FormSubmitButton>
    </form>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  expect(
    (await screen.findByRole('button', { name: 'Searching…' })).getAttribute(
      'aria-busy',
    ),
  ).toBe('true');
  await act(async () => {
    finish();
  });
  expect(
    (screen.getByRole('button', { name: 'Search' }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});
