'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { AuthoredCase } from '@/features/practice-test-authoring/contracts';

export function TestCasesFields({
  cases,
  setCases,
}: {
  cases: AuthoredCase[];
  setCases: Dispatch<SetStateAction<AuthoredCase[]>>;
}) {
  function updateCase(index: number, patch: Partial<AuthoredCase>) {
    setCases((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function addCase() {
    setCases((current) =>
      current.length >= 25
        ? current
        : [
            ...current,
            {
              id: crypto.randomUUID(),
              name: `Test case ${current.length + 1}`,
              stdin: '',
              expected_stdout: '',
              is_public: true,
            },
          ],
    );
  }

  function removeCase(index: number) {
    setCases((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <fieldset className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="px-1 font-medium">Test cases ({cases.length}/25)</legend>
        <span className="text-xs text-muted-foreground">
          Public cases are visible to students; private cases are used for instructor evaluation.
        </span>
      </div>

      {cases.map((c, index) => (
        <TestCaseItem
          key={c.id}
          item={c}
          index={index}
          onUpdate={(patch) => updateCase(index, patch)}
          onRemove={() => removeCase(index)}
        />
      ))}

      <button
        type="button"
        disabled={cases.length >= 25}
        onClick={addCase}
        className="text-sm underline disabled:opacity-50"
      >
        Add test case
      </button>
    </fieldset>
  );
}

function TestCaseItem({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: AuthoredCase;
  index: number;
  onUpdate: (patch: Partial<AuthoredCase>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-md border bg-card/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <h3 className="font-medium text-sm">Test case {index + 1}</h3>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={item.is_public}
              onChange={(e) => onUpdate({ is_public: e.target.checked })}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Public (visible to students)</span>
          </label>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-destructive hover:underline"
            aria-label={`Remove test case ${index + 1}`}
          >
            Remove
          </button>
        </div>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Test case {index + 1} name</span>
        <input
          required
          maxLength={120}
          value={item.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>Standard input (stdin)</span>
          <textarea
            rows={3}
            value={item.stdin}
            onChange={(e) => onUpdate({ stdin: e.target.value })}
            className="w-full font-mono text-xs rounded-md border bg-background px-3 py-1.5"
            placeholder="Optional program input"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span>Expected output (stdout)</span>
          <textarea
            rows={3}
            value={item.expected_stdout}
            onChange={(e) => onUpdate({ expected_stdout: e.target.value })}
            className="w-full font-mono text-xs rounded-md border bg-background px-3 py-1.5"
            placeholder="Expected standard output"
          />
        </label>
      </div>
    </div>
  );
}
