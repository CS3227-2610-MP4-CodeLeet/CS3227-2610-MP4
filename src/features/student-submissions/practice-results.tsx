import { CheckCircle2, ChevronDown, Circle, CircleAlert } from 'lucide-react';
import {
  verdictLabels,
  type BrowserRun,
  type PracticeCase,
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
      {result ? (
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
      ) : (
        <p className="flex min-h-32 items-center justify-center rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          Run your code to see output.
        </p>
      )}
    </div>
  );
}
export function CaseResults({
  cases,
  results,
}: {
  cases: readonly PracticeCase[];
  results: readonly PracticeResult[];
}) {
  const passed = results.filter((result) => result.verdict === 'passed').length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Published test cases</h4>
        <p
          className="text-xs text-slate-500 dark:text-slate-400"
          aria-live="polite"
        >
          {results.length
            ? `${passed} of ${cases.length} passed · ${results.length} run`
            : `${cases.length} public ${cases.length === 1 ? 'case' : 'cases'}`}
        </p>
      </div>
      {!cases.length && (
        <p className="rounded-md border p-4 text-sm text-slate-500 dark:text-slate-400">
          No published test cases.
        </p>
      )}
      <ol className="space-y-2">
        {cases.map((item, index) => {
          const result = results.find((value) => value.id === item.id);
          const failed = result && result.verdict !== 'passed';
          const StatusIcon = !result
            ? Circle
            : failed
              ? CircleAlert
              : CheckCircle2;
          return (
            <li
              key={item.id}
              data-testid={`practice-case-${item.id}`}
              className="min-w-0"
            >
              <details
                open={Boolean(failed)}
                className={`group overflow-hidden rounded-md border bg-white dark:bg-slate-900 ${failed ? 'border-red-200 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs focus-visible:outline-2 focus-visible:outline-ring">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <StatusIcon
                      aria-hidden="true"
                      className={`size-4 shrink-0 ${!result ? 'text-slate-300' : failed ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                    />
                    <span className="font-mono text-slate-400 dark:text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {item.name}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className={
                        !result
                          ? 'text-slate-400 dark:text-slate-400'
                          : failed
                            ? 'font-medium text-red-700 dark:text-red-300'
                            : 'font-medium text-emerald-700 dark:text-emerald-400'
                      }
                    >
                      {result ? verdictLabels[result.verdict] : 'Not run'}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className="size-3.5 text-slate-400 dark:text-slate-400 transition-transform group-open:rotate-180"
                    />
                  </span>
                </summary>
                <div className="space-y-4 border-t p-4">
                  <div
                    className={`grid min-w-0 gap-4 ${result ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}
                  >
                    <OutputBlock label="Input" text={item.stdin} />
                    <OutputBlock
                      label="Expected output"
                      text={item.expected_stdout}
                    />
                    {result && (
                      <OutputBlock
                        label="Actual output"
                        text={result.stdout}
                        error={Boolean(failed)}
                      />
                    )}
                  </div>
                  {result?.stderr && (
                    <OutputBlock
                      label="Standard error"
                      text={result.stderr}
                      error
                    />
                  )}
                  {result && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <ExecutionTime value={result.executionMs} />
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
