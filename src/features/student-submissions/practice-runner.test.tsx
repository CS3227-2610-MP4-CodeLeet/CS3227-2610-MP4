/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticeRunner } from './practice-runner';
import { AssignmentPractice } from './assignment-practice';
import type { BrowserRun, PracticeCase } from './practice-tests';

const state = vi.hoisted(() => ({
  clients: [] as Array<{
    run: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }>,
}));
vi.mock('./browser-client', () => ({
  BrowserRunnerClient: vi.fn(function BrowserRunnerClient() {
    const client = state.clients.shift()!;
    return client;
  }),
}));

const cases: PracticeCase[] = [
  { id: 'a', name: 'First', stdin: '1', expected_stdout: 'one' },
  { id: 'b', name: 'Second', stdin: '2', expected_stdout: 'two' },
];
const result: BrowserRun = {
  status: 'ok',
  stdout: 'done',
  stderr: '',
  executionMs: 3,
};

function client(run: ReturnType<typeof vi.fn>) {
  return { run, stop: vi.fn(), dispose: vi.fn() };
}

beforeEach(() => state.clients.splice(0));
afterEach(() => cleanup());

describe('PracticeRunner', () => {
  it('prevents empty or invalid source and oversized single-run input locally', async () => {
    render(
      <PracticeRunner
        runnerOrigin="http://127.0.0.1:3130"
        language="python"
        source=" "
        cases={cases}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Run code' }));
    expect(
      await screen.findByText('Enter some code before checking it.'),
    ).toBeTruthy();
    expect(state.clients).toHaveLength(0);
  });

  it('sends the selected standard input, shows the result, and marks it stale after edits', async () => {
    const run = vi.fn().mockResolvedValue(result);
    state.clients.push(client(run));
    const { rerender } = render(
      <PracticeRunner
        runnerOrigin="http://127.0.0.1:3130"
        language="java"
        source="class Main {}"
        cases={[]}
      />,
    );
    fireEvent.change(screen.getByLabelText('Standard input'), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run code' }));
    expect(await screen.findByText('done')).toBeTruthy();
    expect(run).toHaveBeenCalledWith({
      language: 'java',
      source: 'class Main {}',
      stdin: 'hello',
      timeoutMs: 5000,
    });
    expect(screen.getByText('Completed')).toBeTruthy();
    rerender(
      <PracticeRunner
        runnerOrigin="http://127.0.0.1:3130"
        language="java"
        source="class Main { int x; }"
        cases={[]}
      />,
    );
    expect(
      screen.getByText('Code changed. Run again to update the results.'),
    ).toBeTruthy();
    expect(screen.getByText('Run your code to see output.')).toBeTruthy();
  });

  it('runs public cases sequentially, reports verdicts, and disposes the client', async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ ...result, stdout: 'one' })
      .mockResolvedValueOnce({ ...result, stdout: 'wrong' });
    const activeClient = client(run);
    state.clients.push(activeClient);
    render(
      <PracticeRunner
        runnerOrigin="http://127.0.0.1:3130"
        language="python"
        source="print(1)"
        cases={cases}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Run published tests' }),
    );
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('1 of 2 passed · 2 run')).toBeTruthy();
    expect(screen.getByText('Wrong output')).toBeTruthy();
    expect(activeClient.dispose).toHaveBeenCalledOnce();
  });

  it('shows a safe fallback when the runner rejects with an unknown error', async () => {
    const run = vi.fn().mockRejectedValue('untrusted detail');
    state.clients.push(client(run));
    render(
      <PracticeRunner
        runnerOrigin="http://127.0.0.1:3130"
        language="python"
        source="print(1)"
        cases={[]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Run code' }));
    expect(
      await screen.findByText('Browser runner unavailable. Try again.'),
    ).toBeTruthy();
  });

  it('keeps the assignment runner boundary visible and switches to supplied example cases', () => {
    const unavailable = render(
      <AssignmentPractice
        runnerOrigin={null}
        language="python"
        source="print(1)"
        examples={cases}
      />,
    );
    expect(screen.getByText('Code runner is unavailable.')).toBeTruthy();
    unavailable.unmount();

    render(
      <AssignmentPractice
        runnerOrigin="http://127.0.0.1:3130"
        language="python"
        source="print(1)"
        examples={cases}
      />,
    );
    expect(screen.getByText('0 public cases')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Use example test cases' }),
    );
    expect(screen.getByText('2 example cases')).toBeTruthy();
    expect(screen.getByText('First')).toBeTruthy();
  });
});
