'use client';
import type { AuthoredCase } from './contracts';
const fieldStyle =
  'block w-full rounded-md border bg-background p-3 font-mono text-sm';
type Props = {
  item: AuthoredCase;
  index: number;
  disabled: boolean;
  onChange: (item: AuthoredCase) => void;
  onRemove: () => void;
};
export function CaseFields({
  item,
  index,
  disabled,
  onChange,
  onRemove,
}: Props) {
  return (
    <fieldset
      disabled={disabled}
      className="min-w-0 space-y-3 rounded-lg border p-4"
    >
      <legend className="px-2 text-sm font-medium">Case {index + 1}</legend>
      <label className="block space-y-1 text-sm">
        Name
        <input
          aria-label={`Case ${index + 1} name`}
          value={item.name}
          maxLength={240}
          className={fieldStyle}
          onChange={(event) => onChange({ ...item, name: event.target.value })}
        />
      </label>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <label className="block min-w-0 space-y-1 text-sm">
          Input
          <textarea
            aria-label={`Case ${index + 1} input`}
            value={item.stdin}
            rows={4}
            className={fieldStyle}
            onChange={(event) =>
              onChange({ ...item, stdin: event.target.value })
            }
          />
        </label>
        <label className="block min-w-0 space-y-1 text-sm">
          Expected output
          <textarea
            aria-label={`Case ${index + 1} expected output`}
            value={item.expected_stdout}
            rows={4}
            className={fieldStyle}
            onChange={(event) =>
              onChange({ ...item, expected_stdout: event.target.value })
            }
          />
        </label>
      </div>
      <button
        type="button"
        className="rounded-md border px-3 py-2 text-sm"
        aria-label={`Remove case ${index + 1}`}
        onClick={onRemove}
      >
        Remove
      </button>
    </fieldset>
  );
}
