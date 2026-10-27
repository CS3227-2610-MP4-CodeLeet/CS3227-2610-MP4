import type { AssignmentLanguage } from '@/features/student-assignments/types';

export type PracticeCase = {
  id: string;
  name: string;
  stdin: string;
  expected_stdout: string;
};
export type BrowserRun = {
  status: string;
  stdout: string;
  stderr: string;
  executionMs: number | null;
};
export type RunInput = {
  language: AssignmentLanguage;
  source: string;
  stdin: string;
  timeoutMs: number;
};
export type PracticeResult = PracticeCase & BrowserRun & { verdict: string };
export const verdictLabels: Record<string, string> = {
  passed: 'Passed',
  'wrong-output': 'Wrong output',
  'compile-error': 'Compile error',
  error: 'Runtime error',
  timeout: 'Time limit exceeded',
  'compile-timeout': 'Preparation time limit exceeded',
  'output-limit': 'Output limit exceeded',
  stopped: 'Stopped',
  unavailable: 'Runner unavailable',
};
export function normalizeOutput(value: string) {
  return value.replace(/\r\n?/g, '\n').replace(/\n$/, '');
}
export function verdict(result: BrowserRun, expected: string) {
  if (result.status !== 'ok')
    return Object.hasOwn(verdictLabels, result.status)
      ? result.status
      : 'unavailable';
  return normalizeOutput(result.stdout) === normalizeOutput(expected)
    ? 'passed'
    : 'wrong-output';
}
export function validateCases(cases: readonly PracticeCase[]) {
  const bytes = (value: string) => new TextEncoder().encode(value).length;
  if (
    cases.length > 5 ||
    new Set(cases.map((item) => item.id)).size !== cases.length ||
    cases.some(
      (item) =>
        !item.id ||
        !item.name ||
        item.name.length > 120 ||
        bytes(item.stdin) > 4096 ||
        bytes(item.expected_stdout) > 8192,
    )
  )
    throw new Error('Invalid published test cases');
}
export async function runPracticeTests({
  cases,
  language,
  source,
  run,
  signal,
  onResult,
}: {
  cases: readonly PracticeCase[];
  language: AssignmentLanguage;
  source: string;
  run: (input: RunInput) => Promise<BrowserRun>;
  signal: AbortSignal;
  onResult: (result: PracticeResult) => void;
}) {
  validateCases(cases);
  for (const item of cases) {
    if (signal.aborted) break;
    const result = await run({
      language,
      source,
      stdin: item.stdin,
      timeoutMs: 5000,
    });
    const actual = signal.aborted ? { ...result, status: 'stopped' } : result;
    const outcome = {
      ...item,
      ...actual,
      verdict: verdict(actual, item.expected_stdout),
    };
    onResult(outcome);
    if (['stopped', 'unavailable', 'compile-error'].includes(outcome.verdict))
      break;
  }
}
