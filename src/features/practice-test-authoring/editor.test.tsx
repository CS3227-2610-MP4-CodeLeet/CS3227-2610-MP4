// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PracticeTestEditor } from './editor';
const addCaseLabel = 'Add test case';
const nameLabel = 'Case 1 name';
const initial = {
  assignment_id: 'b2000000-0000-4000-8000-000000000001',
  title: 'Sum',
  language: 'python',
  cases: [],
  version: 0,
  published_revision: 0,
  published_at: null,
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('illustrates an empty authored case list and keeps the add action', () => {
  render(<PracticeTestEditor initial={initial} />);

  expect(screen.getByText('No test cases added yet')).toBeTruthy();
  expect(document.querySelector('svg[data-illustration="code"]')).toBeTruthy();
  expect(screen.getByRole('button', { name: addCaseLabel })).toBeTruthy();
  expect(
    (screen.getByRole('button', { name: 'Publish tests' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});
it('authors a case, publishes literal output, and advances expected version', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({ data: { version: 1, published_revision: 1 } }),
      ),
    );
  vi.stubGlobal('fetch', fetch);
  render(<PracticeTestEditor initial={initial} />);
  fireEvent.click(screen.getByRole('button', { name: addCaseLabel }));
  fireEvent.change(screen.getByLabelText(nameLabel), {
    target: { value: 'Sum' },
  });
  fireEvent.change(screen.getByLabelText('Case 1 input'), {
    target: { value: '2 3\n' },
  });
  fireEvent.change(screen.getByLabelText('Case 1 expected output'), {
    target: { value: '5\n' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Publish tests' }));
  await screen.findByText('Tests published.');
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body).toMatchObject({
    action: 'publish',
    expectedVersion: 0,
    cases: [{ name: 'Sum', stdin: '2 3\n', expected_stdout: '5\n' }],
  });
  fetch.mockResolvedValue(
    new Response(
      JSON.stringify({ data: { version: 2, published_revision: 2 } }),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Unpublish tests' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
    action: 'unpublish',
    expectedVersion: 1,
  });
}, 15000);
it('retains typed cases on conflict and displays a reload instruction', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: 'These tests changed. Reload before saving again.',
          },
        }),
        { status: 409 },
      ),
    ),
  );
  render(<PracticeTestEditor initial={initial} />);
  fireEvent.click(screen.getByRole('button', { name: addCaseLabel }));
  fireEvent.change(screen.getByLabelText(nameLabel), {
    target: { value: 'Keep me' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByText('These tests changed. Reload before saving again.');
  expect((screen.getByLabelText(nameLabel) as HTMLInputElement).value).toBe(
    'Keep me',
  );
});
it('bounds authored cases and supports removing them', () => {
  render(<PracticeTestEditor initial={initial} />);
  for (let i = 0; i < 5; i++)
    fireEvent.click(screen.getByRole('button', { name: addCaseLabel }));
  expect(
    (screen.getByRole('button', { name: addCaseLabel }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Remove case 2' }));
  expect(screen.getAllByLabelText(/Case \d name/)).toHaveLength(4);
});
