// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AssignmentPractice } from '@/features/student-submissions/assignment-practice';
const client = vi.hoisted(() => ({
  run: vi.fn(),
  stop: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('@/features/student-submissions/browser-client', () => ({
  BrowserRunnerClient: vi.fn(function () {
    return client;
  }),
}));
const runTestsLabel = 'Run published tests';
const refreshTestsLabel = 'Refresh tests';
const id = 'b2000000-0000-4000-8000-000000000001';
const originalName = 'Original case';
const item = {
  id: 'b3000000-0000-4000-8000-000000000001',
  name: originalName,
  stdin: '2 3',
  expected_stdout: '5',
};
const source = 'print(5)';
const props = {
  assignmentId: id,
  runnerOrigin: 'http://127.0.0.1:3130',
  language: 'python' as const,
  source,
  examples: null,
};
const snapshot = (cases = [item]) =>
  new Response(
    JSON.stringify({
      data: {
        assignment_id: id,
        assignment_revision: 1,
        test_set_revision: 1,
        cases,
      },
    }),
  );
beforeEach(() => {
  vi.clearAllMocks();
  client.run.mockResolvedValue({
    status: 'ok',
    stdout: '5',
    stderr: '',
    executionMs: 1,
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('invalidates passed verdicts when refresh replaces the published case snapshot', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce(snapshot([{ ...item, expected_stdout: '6' }])),
  );
  render(<AssignmentPractice {...props} />);
  await screen.findByText(originalName);
  fireEvent.click(screen.getByRole('button', { name: runTestsLabel }));
  await screen.findByText('Passed', { exact: true });
  fireEvent.click(screen.getByRole('button', { name: refreshTestsLabel }));
  await screen.findByText('Tests changed. Run again to update the results.');
  expect(screen.queryByText('Passed', { exact: true })).toBeNull();
});
it('fetches current cases before a run and freezes the clicked source snapshot', async () => {
  let resolve!: (value: Response) => void;
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(snapshot())
    .mockImplementationOnce(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
  vi.stubGlobal('fetch', fetch);
  const view = render(<AssignmentPractice {...props} />);
  await screen.findByText(originalName);
  fireEvent.click(screen.getByRole('button', { name: runTestsLabel }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(
    (
      screen.getByRole('button', {
        name: refreshTestsLabel,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  view.rerender(<AssignmentPractice {...props} source="print(6)" />);
  resolve(snapshot([{ ...item, name: 'Updated case', stdin: '-1 6' }]));
  await waitFor(() =>
    expect(client.run).toHaveBeenCalledWith(
      expect.objectContaining({ source, stdin: '-1 6', language: 'python' }),
    ),
  );
  await screen.findByText('Code changed. Run again to update the results.');
});
it('shows load failure rather than empty data or examples and recovers without editing source', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response('{}', { status: 503 }))
    .mockResolvedValueOnce(snapshot());
  vi.stubGlobal('fetch', fetch);
  render(<AssignmentPractice {...props} examples={[item]} />);
  await screen.findByRole('alert');
  expect(screen.queryByText('No published test cases.')).toBeNull();
  expect(screen.queryByText('Use example test cases')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: refreshTestsLabel }));
  await screen.findByText(originalName);
  expect(client.run).not.toHaveBeenCalled();
});
it('does not execute after leaving while a fresh snapshot request is pending', async () => {
  let resolve!: (value: Response) => void;
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(snapshot())
      .mockImplementationOnce(
        () =>
          new Promise<Response>((done) => {
            resolve = done;
          }),
      ),
  );
  const view = render(<AssignmentPractice {...props} />);
  await screen.findByText(originalName);
  fireEvent.click(screen.getByRole('button', { name: runTestsLabel }));
  await waitFor(() => expect(resolve).toBeDefined());
  view.unmount();
  resolve(snapshot());
  await waitFor(() => expect(client.dispose).toHaveBeenCalled());
  expect(client.run).not.toHaveBeenCalled();
});
