'use client';
import { useState } from 'react';
import {
  practiceUpdateSchema,
  type AuthoredCase,
  type PracticeUpdate,
} from './contracts';
import type { OwnerTestSet } from './queries.server';
import { CaseFields } from './editor-fields';

type Action = PracticeUpdate['action'];
const buttonStyle = 'rounded-md border px-3 py-2 text-sm disabled:opacity-50';
async function sendUpdate(id: string, value: PracticeUpdate) {
  const response = await fetch(`/api/assignments/${id}/practice-tests`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(value),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error?.message ?? 'Tests could not be saved.');
  return result.data as { version: number; published_revision: number };
}
function usePracticeEditor(initial: OwnerTestSet) {
  const [cases, setCases] = useState(initial.cases);
  const [version, setVersion] = useState(initial.version);
  const [published, setPublished] = useState(Boolean(initial.published_at));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(action: Action) {
    if (busy) return;
    const parsed = practiceUpdateSchema.safeParse(
      action === 'unpublish'
        ? { action, expectedVersion: version }
        : { action, expectedVersion: version, cases },
    );
    if (!parsed.success) {
      setMessage('Check case names and input/output sizes before saving.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await sendUpdate(initial.assignment_id, parsed.data);
      setVersion(result.version);
      if (action !== 'save') setPublished(action === 'publish');
      setMessage(
        action === 'publish'
          ? 'Tests published.'
          : action === 'save'
            ? 'Draft saved.'
            : 'Tests unpublished.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Tests could not be saved.',
      );
    } finally {
      setBusy(false);
    }
  }
  return { cases, setCases, published, busy, message, save };
}
export function PracticeTestEditor({ initial }: { initial: OwnerTestSet }) {
  const state = usePracticeEditor(initial);
  return (
    <section className="space-y-5 rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">
        {state.published
          ? 'Students can use the published tests. Draft edits stay private until published.'
          : 'Tests are not published.'}
      </p>
      {state.cases.map((item, index) => (
        <CaseFields
          key={item.id}
          item={item}
          index={index}
          disabled={state.busy}
          onChange={(value) =>
            state.setCases(
              state.cases.map((entry) =>
                entry.id === value.id ? value : entry,
              ),
            )
          }
          onRemove={() =>
            state.setCases(state.cases.filter((entry) => entry.id !== item.id))
          }
        />
      ))}
      <button
        type="button"
        className={buttonStyle}
        disabled={state.busy || state.cases.length === 5}
        onClick={() => state.setCases([...state.cases, blankCase()])}
      >
        Add test case
      </button>
      <p className="text-xs text-muted-foreground">
        Up to 5 cases. Input: 4,096 UTF-8 bytes; expected output: 8,192 bytes
        per case.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonStyle}
          disabled={state.busy}
          onClick={() => void state.save('save')}
        >
          Save draft
        </button>
        <button
          type="button"
          className={buttonStyle + ' bg-primary text-primary-foreground'}
          disabled={state.busy || !state.cases.length}
          onClick={() => void state.save('publish')}
        >
          Publish tests
        </button>
        {state.published && (
          <button
            type="button"
            className={buttonStyle}
            disabled={state.busy}
            onClick={() => void state.save('unpublish')}
          >
            Unpublish tests
          </button>
        )}
      </div>
      <p role="status" className="text-sm">
        {state.busy ? 'Saving…' : state.message}
      </p>
    </section>
  );
}
function blankCase(): AuthoredCase {
  return { id: crypto.randomUUID(), name: '', stdin: '', expected_stdout: '' };
}
