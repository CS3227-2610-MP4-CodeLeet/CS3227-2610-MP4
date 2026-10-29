import { CheckCircle2, ChevronDown, Circle, CircleAlert } from 'lucide-react';
import {
  verdictLabels,
  type BrowserRun,
  type PracticeCase,
  type PracticeCaseKind,
  type PracticeResult,
} from './practice-tests';

function ExecutionTime({ value }: { value: number | null }) {
  return (
    <span>
      Execution:{' '}
      {value === null ? 'not started' : `approximately ${Math.round(value)} ms`}
    </span>
  );
}

export function OutputBlock({
  label,
  text,
  error = false,
}: {
  label: string;
  text: string;
  error?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
        {label}
      </p>
      <pre
        className={`max-h-48 min-h-16 overflow-auto rounded-md border p-3 font-mono text-xs leading-6 whitespace-pre-wrap break-words ${error ? 'border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-200'}`}
      >
        {text || '(empty)'}
      </pre>
    </div>
  );
}

export function CustomResult({ result }: { result: BrowserRun | null }) {
  return (
    <div className="min-w-0 space-y-2">
      <h4 className="text-xs font-medium">Output</h4>
      {result ? <CompletedRun result={result} /> : <EmptyRun />}
    </div>
  );
}

function CompletedRun({ result }: { result: BrowserRun }) {
  return (
    <div className="space-y-2" data-testid="custom-run-result">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span
          className={
            result.status === 'ok'
              ? 'font-medium text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-red-700 dark:text-red-300'
          }
        >
          {result.status === 'ok'
            ? 'Completed'
            : (verdictLabels[result.status] ?? 'Runner unavailable')}
        </span>
        <span className="text-muted-foreground">
          <ExecutionTime value={result.executionMs} />
        </span>
      </div>
      <p className="sr-only">Standard output</p>
      <pre className="max-h-40 min-h-24 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-6 whitespace-pre-wrap break-words">
        {result.stdout || '(empty)'}
      </pre>
      {result.stderr && (
        <OutputBlock label="Standard error" text={result.stderr} error />
      )}
    </div>
  );
}

function EmptyRun() {
  return (
    <p className="flex min-h-32 items-center justify-center rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
      Run your code to see output.
    </p>
  );
}

function CaseHeading({
  cases,
  results,
  passed,
  kind,
}: {
  cases: readonly PracticeCase[];
  results: readonly PracticeResult[];
  passed: number;
  kind: PracticeCaseKind;
}) {
  const count = cases.length;
  const summary = results.length
    ? `${passed} of ${count} passed · ${results.length} run`
    : `${count} ${kind === 'examples' ? 'example' : 'public'} ${count === 1 ? 'case' : 'cases'}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-sm font-semibold">
        {kind === 'examples' ? 'Example test cases' : 'Published test cases'}
      </h4>
      <p
        className="text-xs text-slate-500 dark:text-slate-400"
        aria-live="polite"
      >
        {summary}
      </p>
    </div>
  );
}

function CaseStatusIcon({
  result,
  failed,
}: {
  result?: PracticeResult;
  failed: boolean;
}) {
  const StatusIcon = !result ? Circle : failed ? CircleAlert : CheckCircle2;
  const style = !result
    ? 'text-slate-300'
    : failed
      ? 'text-red-600 dark:text-red-400'
      : 'text-emerald-600 dark:text-emerald-400';
  return (
    <StatusIcon aria-hidden="true" className={`size-4 shrink-0 ${style}`} />
  );
}

function CaseSummary({
  item,
  index,
  result,
  failed,
}: {
  item: PracticeCase;
  index: number;
  result?: PracticeResult;
  failed: boolean;
}) {
  const statusStyle = !result
    ? 'text-slate-400 dark:text-slate-400'
    : failed
      ? 'font-medium text-red-700 dark:text-red-300'
      : 'font-medium text-emerald-700 dark:text-emerald-400';
  return (
    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs focus-visible:outline-2 focus-visible:outline-ring">
      <span className="flex min-w-0 items-center gap-2.5">
        <CaseStatusIcon result={result} failed={failed} />
        <span className="font-mono text-slate-400 dark:text-slate-400">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {item.name}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <span className={statusStyle}>
          {result ? verdictLabels[result.verdict] : 'Not run'}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 text-slate-400 dark:text-slate-400 transition-transform group-open:rotate-180"
        />
      </span>
    </summary>
  );
}

function CaseOutputs({
  item,
  result,
  failed,
}: {
  item: PracticeCase;
  result?: PracticeResult;
  failed: boolean;
}) {
  return (
    <div className="space-y-4 border-t p-4">
      <div
        className={`grid min-w-0 gap-4 ${result ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}
      >
        <OutputBlock label="Input" text={item.stdin} />
        <OutputBlock label="Expected output" text={item.expected_stdout} />
        {result && (
          <OutputBlock
            label="Actual output"
            text={result.stdout}
            error={failed}
          />
        )}
      </div>
      {result?.stderr && (
        <OutputBlock label="Standard error" text={result.stderr} error />
      )}
      {result && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <ExecutionTime value={result.executionMs} />
        </p>
      )}
    </div>
  );
}

function PracticeCaseItem({
  item,
  index,
  result,
}: {
  item: PracticeCase;
  index: number;
  result?: PracticeResult;
}) {
  const failed = Boolean(result && result.verdict !== 'passed');
  return (
    <li
      key={item.id}
      data-testid={`practice-case-${item.id}`}
      className="min-w-0"
    >
      <details
        open={failed}
        className={`group overflow-hidden rounded-md border bg-white dark:bg-slate-900 ${failed ? 'border-red-200 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'}`}
      >
        <CaseSummary
          item={item}
          index={index}
          result={result}
          failed={failed}
        />
        <CaseOutputs item={item} result={result} failed={failed} />
      </details>
    </li>
  );
}

export function CaseResults({
  cases,
  results,
  kind = 'published',
}: {
  cases: readonly PracticeCase[];
  results: readonly PracticeResult[];
  kind?: PracticeCaseKind;
}) {
  const passed = results.filter((result) => result.verdict === 'passed').length;
  return (
    <div className="space-y-3">
      <CaseHeading
        cases={cases}
        results={results}
        passed={passed}
        kind={kind}
      />
      {!cases.length && (
        <p className="rounded-md border p-4 text-sm text-slate-500 dark:text-slate-400">
          No published test cases.
        </p>
      )}
      <ol className="space-y-2">
        {cases.map((item, index) => (
          <PracticeCaseItem
            key={item.id}
            item={item}
            index={index}
            result={results.find((value) => value.id === item.id)}
          />
        ))}
      </ol>
    </div>
  );
}
