import type { BrowserRun } from './practice-tests';

// Presentation only: retain raw results and do not infer a cause from source text.
export function runnerErrorMessage(
  result: Pick<BrowserRun, 'status' | 'stderr'>,
) {
  if (result.status !== 'compile-error') return result.stderr;
  return result.stderr.replace(
    /^teavm: (?:Class [^\r\n]+ is not supported on current target|Method is not annotated with [^\r\n]+)\r?$/gm,
    'This program uses a feature that the code runner does not support.',
  );
}
