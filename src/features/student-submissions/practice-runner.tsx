'use client';

import { useEffect, useRef, useState } from 'react';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import { BrowserRunnerClient } from './browser-client';
import {
  runPracticeTests,
  verdictLabels,
  type BrowserRun,
  type PracticeCase,
  type PracticeResult,
} from './practice-tests';
import { validateSource } from './source-validation';

export function PracticeRunner({
  language,
  source,
  cases,
}: {
  language: AssignmentLanguage;
  source: string;
  cases: readonly PracticeCase[];
}) {
  const [stdin, setStdin] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [single, setSingle] = useState<BrowserRun | null>(null);
  const [message, setMessage] = useState('');
  const [testedSource, setTestedSource] = useState('');
  const active = useRef<{
    client: BrowserRunnerClient;
    controller: AbortController;
  } | null>(null);
  useEffect(
    () => () => {
      active.current?.controller.abort();
      active.current?.client.dispose();
    },
    [],
  );
  const changed = testedSource !== source;
  async function start(tests: boolean) {
    if (active.current) return;
    const invalid = validateSource(source).error;
    if (invalid) {
      setMessage(invalid);
      return;
    }
    if (new TextEncoder().encode(stdin).length > 4096 && !tests) {
      setMessage('Standard input exceeds 4,096 UTF-8 bytes.');
      return;
    }
    const client = new BrowserRunnerClient();
    const controller = new AbortController();
    active.current = { client, controller };
    const deadline = setTimeout(() => {
      controller.abort('suite-timeout');
      client.stop();
    }, 90000);
    setBusy(true);
    setResults([]);
    setSingle(null);
    setTestedSource(source);
    setMessage(tests ? 'Running published tests…' : 'Running code…');
    try {
      if (tests)
        await runPracticeTests({
          cases,
          language,
          source,
          signal: controller.signal,
          run: (input) => client.run(input),
          onResult: (result) => setResults((previous) => [...previous, result]),
        });
      else
        setSingle(
          await client.run({ language, source, stdin, timeoutMs: 5000 }),
        );
      setMessage(
        controller.signal.reason === 'suite-timeout'
          ? 'Suite time limit reached. Remaining cases were not run.'
          : controller.signal.aborted
            ? 'Stopped. Remaining cases were not run.'
            : 'Run finished. Results are practice feedback only.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Browser runner unavailable. Try again.',
      );
    } finally {
      clearTimeout(deadline);
      client.dispose();
      active.current = null;
      setBusy(false);
    }
  }
  const button =
    'rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50';
  return (
    <section
      className="min-w-0 space-y-4 border-t pt-5"
      aria-labelledby="practice-heading"
    >
      <h3 id="practice-heading" className="text-lg font-semibold">
        Browser practice
      </h3>
      <p className="text-sm text-muted-foreground">
        Synthetic published cases for local preview. Runs stay in your browser;
        results do not award grades or XP. Execution limit: 5 seconds per case.
        Java compilation has a separate deadline. Leaving the page stops the
        run.
      </p>
      {language === 'java' && (
        <p className="text-sm">
          Use one public Main class. Buffered UTF-8 input and basic Scanner
          methods are supported; advanced Scanner APIs are unavailable.
        </p>
      )}
      <label className="block text-sm font-medium" htmlFor="practice-stdin">
        Standard input
      </label>
      <textarea
        id="practice-stdin"
        rows={3}
        value={stdin}
        onChange={(event) => setStdin(event.target.value)}
        disabled={busy}
        className="block w-full min-w-0 rounded-md border p-3 font-mono text-sm"
      />
      <p className="text-sm text-muted-foreground">
        Maximum 4,096 UTF-8 bytes. Custom input applies to Run code only.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          className={button}
          disabled={busy}
          onClick={() => void start(false)}
        >
          Run code
        </button>
        <button
          className={button}
          disabled={busy || !cases.length}
          onClick={() => void start(true)}
        >
          Run published tests
        </button>
        <button
          className={button}
          disabled={!busy}
          onClick={() => {
            active.current?.controller.abort();
            active.current?.client.stop();
          }}
        >
          Stop
        </button>
      </div>
      <p role="status">{message}</p>
      {(single || results.length > 0) && changed && (
        <p>Code changed. Run again to update the results.</p>
      )}
      {single && !changed && (
        <div className="space-y-2" data-testid="custom-run-result">
          <p>
            {single.status === 'ok'
              ? 'Completed'
              : (verdictLabels[single.status] ?? 'Runner unavailable')}
          </p>
          <p>
            Execution:{' '}
            {single.executionMs === null
              ? 'not started'
              : `approximately ${Math.round(single.executionMs)} ms`}
          </p>
          <p>Standard output</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3">
            {single.stdout || '(empty)'}
          </pre>
          {single.stderr && (
            <>
              <p>Standard error</p>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words">
                {single.stderr}
              </pre>
            </>
          )}
        </div>
      )}
      <h4 className="font-medium">Published test cases</h4>
      <p className="text-sm">
        Compare printed output. Line endings and one final newline are ignored;
        other spaces and capitalization must match.
      </p>
      {!cases.length && <p>No published test cases.</p>}
      <ol className="space-y-4">
        {cases.map((item) => {
          const result = changed
            ? undefined
            : results.find((value) => value.id === item.id);
          return (
            <li
              key={item.id}
              className="min-w-0 rounded-md border p-4"
              data-testid={`practice-case-${item.id}`}
            >
              <p className="font-medium">
                {item.name} —{' '}
                {result ? verdictLabels[result.verdict] : 'Not run'}
              </p>
              <p>Input</p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words">
                {item.stdin || '(empty)'}
              </pre>
              <p>Expected output</p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words">
                {item.expected_stdout || '(empty)'}
              </pre>
              {result && (
                <>
                  <p>Actual output</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words">
                    {result.stdout || '(empty)'}
                  </pre>
                  {result.stderr && (
                    <>
                      <p>Standard error</p>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words">
                        {result.stderr}
                      </pre>
                    </>
                  )}
                  <p>
                    Execution:{' '}
                    {result.executionMs === null
                      ? 'not started'
                      : `approximately ${Math.round(result.executionMs)} ms`}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
