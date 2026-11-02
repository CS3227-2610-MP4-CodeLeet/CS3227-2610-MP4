'use client';
import type { usePublishedCases } from './use-published-cases';
export function PublishedCasesControls({
  state,
  busy,
}: {
  state: ReturnType<typeof usePublishedCases>;
  busy: boolean;
}) {
  return (
    <div className="space-y-2 text-sm">
      {state.error && <p role="alert">{state.error}</p>}
      {!state.ready && <p role="status">Loading published tests…</p>}
      <button
        type="button"
        disabled={busy || !state.ready}
        className="rounded-md border px-3 py-2 text-xs disabled:opacity-50"
        onClick={() => void state.refresh().catch(() => {})}
      >
        Refresh tests
      </button>
    </div>
  );
}
export function ExampleCaseToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby="example-tests-description"
          className="size-4 accent-cyan-700"
        />
        Use example test cases
      </label>
      <div
        id="example-tests-description"
        className="space-y-1 text-xs text-muted-foreground"
      >
        <p>Read two integers from standard input and print their sum.</p>
        <p>These examples are not your assignment’s tests.</p>
      </div>
    </div>
  );
}
