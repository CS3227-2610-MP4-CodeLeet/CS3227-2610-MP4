// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
import { AssignmentForm } from '@/features/codementor/assignment-form';
const maxXpLabel = 'Maximum XP';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('submits an explicit instructor maximum as a number, including zero', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ assignment: { id: 'saved' } })),
    );
  vi.stubGlobal('fetch', fetch);
  render(<AssignmentForm courseId="00000000-0000-4000-8000-000000000003" />);
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'Sum' },
  });
  fireEvent.change(screen.getByLabelText('Instructions'), {
    target: { value: 'Print a sum.' },
  });
  fireEvent.change(screen.getByLabelText(maxXpLabel), {
    target: { value: '0' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save assignment' }));
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    maxXp: 0,
    title: 'Sum',
  });
});
it('preserves the typed amount and rejects a fractional maximum before a request', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const view = render(
    <AssignmentForm courseId="00000000-0000-4000-8000-000000000003" />,
  );
  fireEvent.change(screen.getByLabelText(maxXpLabel), {
    target: { value: '1.5' },
  });
  fireEvent.submit(view.container.querySelector('form')!);
  await screen.findByText(
    'Maximum XP must be a whole number from 0 to 100,000.',
  );
  expect((screen.getByLabelText(maxXpLabel) as HTMLInputElement).value).toBe(
    '1.5',
  );
  expect(fetch).not.toHaveBeenCalled();
});
