'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { LoaderCircle, Play, TestTubes } from 'lucide-react';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import { BrowserRunnerClient } from './browser-client';
import {
  runPracticeTests,
  type BrowserRun,
  type PracticeCase,
  type PracticeCaseKind,
  type PracticeResult,
  type RunInput,
} from './practice-tests';
import { validateSource } from './source-validation';
import { CaseResults, CustomResult } from './practice-results';

type ActiveRun = {
  client: BrowserRunnerClient;
  controller: AbortController;
};

function getInputError(source: string, stdin: string, tests: boolean) {
  const sourceError = validateSource(source).error;
  if (sourceError) return sourceError;
  if (!tests && new TextEncoder().encode(stdin).length > 4096)
    return 'Standard input exceeds 4,096 UTF-8 bytes.';
  return null;
}

function getOutcomeMessage(signal: AbortSignal) {
  if (signal.reason === 'suite-timeout')
    return 'Suite time limit reached. Remaining cases were not run.';
  if (signal.aborted) return 'Stopped. Remaining cases were not run.';
  return '';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Browser runner unavailable. Try again.';
}

async function executePracticeRun({
  client,
  tests,
  cases,
  language,
  source,
  stdin,
  signal,
  onResult,
}: {
  client: BrowserRunnerClient;
  tests: boolean;
  cases: readonly PracticeCase[];
  language: AssignmentLanguage;
  source: string;
  stdin: string;
  signal: AbortSignal;
  onResult: (result: PracticeResult) => void;
}): Promise<BrowserRun | null> {
  if (tests) {
    await runPracticeTests({
      cases,
      language,
      source,
      signal,
      run: (input: RunInput) => client.run(input),
      onResult,
    });
    return null;
  }
  return client.run({ language, source, stdin, timeoutMs: 5000 });
}

function stopActiveRun(active: ActiveRun | null) {
  active?.controller.abort();
  active?.client.dispose();
}

const runButtonStyle =
  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';

function RunCodeButton({ busy, onRun }: { busy: boolean; onRun: () => void }) {
  return (
    <button
      type="button"
      className={runButtonStyle + ' bg-cyan-700 text-white hover:bg-cyan-800'}
      disabled={busy}
      onClick={onRun}
    >
      <Play aria-hidden="true" className="size-3.5" />
      Run code
    </button>
  );
}

function TestCasesAction({
  busy,
  kind,
  onRun,
}: {
  busy: boolean;
  kind: PracticeCaseKind;
  onRun: () => void;
}) {
  return (
    <button
      type="button"
      className={
        runButtonStyle + ' border bg-background text-foreground hover:bg-accent'
      }
      disabled={busy}
      onClick={onRun}
    >
      <TestTubes aria-hidden="true" className="size-3.5" />
      {kind === 'examples' ? 'Run tests' : 'Run published tests'}
    </button>
  );
}

function StandardInput({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-xs font-medium" htmlFor="practice-stdin">
        Standard input
      </label>
      <textarea
        id="practice-stdin"
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Optional input for Run code"
        className="block min-h-32 w-full min-w-0 resize-y rounded-md border bg-muted/30 p-3 font-mono text-xs leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

function RunStatus({
  busy,
  runningTests,
  resultCount,
  caseCount,
  message,
}: {
  busy: boolean;
  runningTests: boolean;
  resultCount: number;
  caseCount: number;
  message: string;
}) {
  const status =
    busy && runningTests
      ? `Running test ${Math.min(resultCount + 1, caseCount)} of ${caseCount}…`
      : message;
  return (
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
      {status}
    </p>
  );
}

function StaleResultNotice({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <p className="text-xs text-amber-800 dark:text-amber-200">
      Code changed. Run again to update the results.
    </p>
  );
}

type PracticeRunnerProps = {
  language: AssignmentLanguage;
  source: string;
  cases: readonly PracticeCase[];
  caseKind?: PracticeCaseKind;
  beforeCases?: ReactNode;
};

export function PracticeRunner({
  language,
  source,
  cases,
  caseKind = 'published',
  beforeCases = null,
}: PracticeRunnerProps) {
  const [stdin, setStdin] = useState('');
  const [busy, setBusy] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [single, setSingle] = useState<BrowserRun | null>(null);
  const [message, setMessage] = useState('');
  const [testedSource, setTestedSource] = useState('');
  const active = useRef<ActiveRun | null>(null);
  const changed = testedSource !== source;
  useEffect(() => () => stopActiveRun(active.current), []);

  function start(tests: boolean) {
    return startPracticeRun({
      tests,
      source,
      stdin,
      cases,
      language,
      active,
      setBusy,
      setRunningTests,
      setResults,
      setSingle,
      setTestedSource,
      setMessage,
    });
  }

  return (
    <section
      className="min-w-0 space-y-4 border-t pt-4"
      aria-labelledby="practice-heading"
    >
      <RunCodeButton busy={busy} onRun={() => void start(false)} />
      <h3 id="practice-heading" className="text-sm font-semibold">
        Run &amp; test
      </h3>
      <PracticeOutputArea
        stdin={stdin}
        busy={busy}
        onStdinChange={setStdin}
        changed={changed}
        single={single}
        runningTests={runningTests}
        resultCount={results.length}
        caseCount={cases.length}
        message={message}
      >
        {beforeCases}
        <CaseResults
          cases={cases}
          results={changed ? [] : results}
          kind={caseKind}
          action={
            cases.length > 0 ? (
              <TestCasesAction
                busy={busy}
                kind={caseKind}
                onRun={() => void start(true)}
              />
            ) : null
          }
        />
      </PracticeOutputArea>
    </section>
  );
}

type StartRunOptions = {
  tests: boolean;
  source: string;
  stdin: string;
  cases: readonly PracticeCase[];
  language: AssignmentLanguage;
  active: MutableRefObject<ActiveRun | null>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setRunningTests: Dispatch<SetStateAction<boolean>>;
  setResults: Dispatch<SetStateAction<PracticeResult[]>>;
  setSingle: Dispatch<SetStateAction<BrowserRun | null>>;
  setTestedSource: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
};

async function startPracticeRun({
  tests,
  source,
  stdin,
  cases,
  language,
  active,
  setBusy,
  setRunningTests,
  setResults,
  setSingle,
  setTestedSource,
  setMessage,
}: StartRunOptions) {
  if (active.current) return;
  const inputError = getInputError(source, stdin, tests);
  if (inputError) return setMessage(inputError);
  const run = createActiveRun();
  active.current = run;
  const deadline = createRunDeadline(run);
  beginRun({
    tests,
    source,
    setBusy,
    setRunningTests,
    setResults,
    setSingle,
    setTestedSource,
    setMessage,
  });
  try {
    const result = await executePracticeRun({
      client: run.client,
      tests,
      cases,
      language,
      source,
      stdin,
      signal: run.controller.signal,
      onResult: (item) => setResults((previous) => [...previous, item]),
    });
    if (result) setSingle(result);
    setMessage(getOutcomeMessage(run.controller.signal));
  } catch (error) {
    setMessage(getErrorMessage(error));
  } finally {
    clearTimeout(deadline);
    completeRun(run, active, setBusy);
  }
}

type PracticeOutputProps = {
  children: ReactNode;
  stdin: string;
  busy: boolean;
  onStdinChange: (value: string) => void;
  changed: boolean;
  single: BrowserRun | null;
  runningTests: boolean;
  resultCount: number;
  caseCount: number;
  message: string;
};

function PracticeOutputArea({
  children,
  stdin,
  busy,
  onStdinChange,
  changed,
  single,
  runningTests,
  resultCount,
  caseCount,
  message,
}: PracticeOutputProps) {
  return (
    <>
      <div className="grid min-w-0 items-start gap-4 md:grid-cols-2">
        <StandardInput value={stdin} disabled={busy} onChange={onStdinChange} />
        <CustomResult result={changed ? null : single} />
      </div>
      <RunStatus
        busy={busy}
        runningTests={runningTests}
        resultCount={resultCount}
        caseCount={caseCount}
        message={message}
      />
      <StaleResultNotice
        visible={Boolean((single || resultCount > 0) && changed)}
      />
      {children}
    </>
  );
}

function createActiveRun(): ActiveRun {
  return {
    client: new BrowserRunnerClient(),
    controller: new AbortController(),
  };
}

function createRunDeadline({ client, controller }: ActiveRun) {
  return setTimeout(() => {
    controller.abort('suite-timeout');
    client.stop();
  }, 90000);
}

function beginRun({
  tests,
  source,
  setBusy,
  setRunningTests,
  setResults,
  setSingle,
  setTestedSource,
  setMessage,
}: {
  tests: boolean;
  source: string;
  setBusy: (value: boolean) => void;
  setRunningTests: (value: boolean) => void;
  setResults: (value: PracticeResult[]) => void;
  setSingle: (value: BrowserRun | null) => void;
  setTestedSource: (value: string) => void;
  setMessage: (value: string) => void;
}) {
  setBusy(true);
  setRunningTests(tests);
  setResults([]);
  setSingle(null);
  setTestedSource(source);
  setMessage(tests ? 'Running tests…' : 'Running code…');
}

function completeRun(
  run: ActiveRun,
  active: { current: ActiveRun | null },
  setBusy: (value: boolean) => void,
) {
  run.client.dispose();
  if (active.current === run) active.current = null;
  setBusy(false);
}
