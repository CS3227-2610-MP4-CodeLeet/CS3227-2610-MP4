'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Play, TestTubes } from 'lucide-react';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import { BrowserRunnerClient } from './browser-client';
import {
  runPracticeTests,
  type BrowserRun,
  type PracticeCase,
  type PracticeResult,
} from './practice-tests';
import { validateSource } from './source-validation';
import { CaseResults, CustomResult } from './practice-results';

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
  const [runningTests, setRunningTests] = useState(false);
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
    setRunningTests(tests);
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
    'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';
  const visibleResults = changed ? [] : results;
  return (
    <section
      className="min-w-0 space-y-4 border-t pt-4"
      aria-labelledby="practice-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="practice-heading" className="text-sm font-semibold">
          Run &amp; test
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={button + ' bg-cyan-700 text-white hover:bg-cyan-800'}
            disabled={busy}
            onClick={() => void start(false)}
          >
            <Play aria-hidden="true" className="size-3.5" />
            Run code
          </button>
          <button
            type="button"
            className={
              button + ' border bg-background text-foreground hover:bg-accent'
            }
            disabled={busy || !cases.length}
            onClick={() => void start(true)}
          >
            <TestTubes aria-hidden="true" className="size-3.5" />
            Run published tests
          </button>
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <label className="block text-xs font-medium" htmlFor="practice-stdin">
            Standard input
          </label>
          <textarea
            id="practice-stdin"
            rows={4}
            value={stdin}
            onChange={(event) => setStdin(event.target.value)}
            disabled={busy}
            placeholder="Optional input for Run code"
            className="block min-h-32 w-full min-w-0 resize-y rounded-md border bg-muted/30 p-3 font-mono text-xs leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <CustomResult result={changed ? null : single} />
      </div>
      <p
        role="status"
        className="flex items-center gap-2 text-xs leading-5 text-muted-foreground empty:hidden"
      >
        {busy && (
          <LoaderCircle
            aria-hidden="true"
            className="size-3.5 animate-spin text-cyan-700 dark:text-cyan-300 motion-reduce:animate-none"
          />
        )}
        {busy && runningTests
          ? 'Running test ' +
            Math.min(results.length + 1, cases.length) +
            ' of ' +
            cases.length +
            '…'
          : message}
      </p>
      {(single || results.length > 0) && changed && (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Code changed. Run again to update the results.
        </p>
      )}
      <CaseResults cases={cases} results={visibleResults} />
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer py-1 font-medium">
          Run details
        </summary>
        <div className="space-y-2 pt-2 leading-6">
          <p>
            Practice only. Runs stay in your browser and do not award grades or
            XP. Input: up to 4,096 UTF-8 bytes. Execution: up to 5 seconds per
            case, with a separate Java compilation deadline. Leaving the page
            ends the run.
          </p>
          <p>
            Compare printed output. Line endings and one final newline are
            ignored; other spaces and capitalization must match.
          </p>
          {language === 'java' && (
            <p>
              Use one public Main class. Buffered UTF-8 input and basic Scanner
              methods are supported; advanced Scanner APIs are unavailable.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
