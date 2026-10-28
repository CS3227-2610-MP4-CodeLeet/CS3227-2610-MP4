import { describe, expect, it } from 'vitest';
import {
  normalizeOutput,
  runPracticeTests,
  validateCases,
  verdict,
  type BrowserRun,
  type PracticeResult,
} from './practice-tests';

const ok: BrowserRun = {
  status: 'ok',
  stdout: '5\n',
  stderr: '',
  executionMs: 1,
};
const sourceSnapshot = 'source snapshot';
const expectedFive = '5';
const wrongOutput = 'wrong-output';
const cases = [
  { id: 'one', name: 'One', stdin: '2 3\n', expected_stdout: '5' },
  { id: 'two', name: 'Two', stdin: '-2 3\n', expected_stdout: '1' },
];
describe('practice output contract', () => {
  it('normalizes line endings and exactly one terminal newline', () => {
    expect(normalizeOutput('a\r\nb\r')).toBe('a\nb');
    expect(verdict(ok, expectedFive)).toBe('passed');
    expect(verdict({ ...ok, stdout: '5\n\n' }, expectedFive)).toBe(wrongOutput);
  });
  it('preserves spaces and case', () => {
    expect(verdict({ ...ok, stdout: ' 5\n' }, expectedFive)).toBe(wrongOutput);
    expect(verdict({ ...ok, stdout: 'Hello' }, 'hello')).toBe(wrongOutput);
  });
  it('requires success even when partial output matches', () => {
    expect(verdict({ ...ok, status: 'error' }, expectedFive)).toBe('error');
    expect(verdict({ ...ok, status: 'timeout' }, expectedFive)).toBe('timeout');
    expect(verdict({ ...ok, stderr: 'warning' }, expectedFive)).toBe('passed');
    expect(verdict({ ...ok, status: 'unknown-result' }, expectedFive)).toBe(
      'unavailable',
    );
  });
  it('bounds cases, distinct IDs, UTF-8 input and expected output', () => {
    expect(() =>
      validateCases(
        Array.from({ length: 6 }, (_, index) => ({
          ...cases[0],
          id: `${index}`,
        })),
      ),
    ).toThrow();
    expect(() => validateCases([cases[0], cases[0]])).toThrow();
    expect(() =>
      validateCases([{ ...cases[0], stdin: 'é'.repeat(2048) }]),
    ).not.toThrow();
    expect(() =>
      validateCases([{ ...cases[0], stdin: 'é'.repeat(2049) }]),
    ).toThrow();
    expect(() =>
      validateCases([{ ...cases[0], expected_stdout: 'x'.repeat(8193) }]),
    ).toThrow();
  });
});
describe('practice suite', () => {
  it('uses each stdin sequentially with a fixed source snapshot and budget', async () => {
    const seen: string[] = [];
    const results: PracticeResult[] = [];
    await runPracticeTests({
      cases,
      language: 'python',
      source: sourceSnapshot,
      signal: new AbortController().signal,
      run: async (input) => {
        expect(input.source).toBe(sourceSnapshot);
        expect(input.timeoutMs).toBe(5000);
        seen.push(input.stdin);
        return { ...ok, stdout: seen.length === 1 ? '5\n' : '1\n' };
      },
      onResult: (result) => results.push(result),
    });
    expect(seen).toEqual(['2 3\n', '-2 3\n']);
    expect(results.map((result) => result.verdict)).toEqual([
      'passed',
      'passed',
    ]);
  });
  it('does not mark a cancelled result passed or schedule remaining cases', async () => {
    const controller = new AbortController();
    const results: PracticeResult[] = [];
    await runPracticeTests({
      cases,
      language: 'java',
      source: 'Main',
      signal: controller.signal,
      run: async () => {
        controller.abort();
        return ok;
      },
      onResult: (result) => results.push(result),
    });
    expect(results).toHaveLength(1);
    expect(results[0].verdict).toBe('stopped');
  });
  it('stops on compile failure but continues after wrong output', async () => {
    for (const status of ['compile-error', 'ok']) {
      const results: PracticeResult[] = [];
      await runPracticeTests({
        cases,
        language: 'java',
        source: 'Main',
        signal: new AbortController().signal,
        run: async () => ({ ...ok, status, stdout: 'wrong' }),
        onResult: (result) => results.push(result),
      });
      expect(results).toHaveLength(status === 'compile-error' ? 1 : 2);
    }
  });
});
