type Kind = 'unchanged' | 'added' | 'removed';
type Change = { kind: Kind; text: string };
export type DiffLine = Change & { before: number | null; after: number | null };
const MAX_CELLS = 250_000;

function block(lines: string[], kind: Kind): Change[] {
  return lines.map((text) => ({ kind, text }));
}

function commonEdges(before: string[], after: string[]) {
  let start = 0;
  let end = 0;
  const length = Math.min(before.length, after.length);
  while (start < length && before[start] === after[start]) start += 1;
  while (end < length - start && before.at(-end - 1) === after.at(-end - 1))
    end += 1;
  return { start, end };
}

function middleChanges(before: string[], after: string[]): Change[] {
  const width = after.length + 1;
  const cells = (before.length + 1) * width;
  if (cells > MAX_CELLS)
    return [...block(before, 'removed'), ...block(after, 'added')];
  const lengths = new Uint16Array(cells);
  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      lengths[i * width + j] =
        before[i] === after[j]
          ? 1 + lengths[(i + 1) * width + j + 1]
          : Math.max(lengths[(i + 1) * width + j], lengths[i * width + j + 1]);
    }
  }
  return traceChanges(before, after, lengths);
}

function traceChanges(
  before: string[],
  after: string[],
  lengths: Uint16Array,
): Change[] {
  const changes: Change[] = [];
  const width = after.length + 1;
  let i = 0;
  let j = 0;
  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      changes.push({ kind: 'unchanged', text: before[i++] });
      j += 1;
    } else if (lengths[(i + 1) * width + j] >= lengths[i * width + j + 1]) {
      changes.push({ kind: 'removed', text: before[i++] });
    } else {
      changes.push({ kind: 'added', text: after[j++] });
    }
  }
  return [
    ...changes,
    ...block(before.slice(i), 'removed'),
    ...block(after.slice(j), 'added'),
  ];
}

export function compareLines(original: string, updated: string): DiffLine[] {
  const before = original.replace(/\r\n?/g, '\n').split('\n');
  const after = updated.replace(/\r\n?/g, '\n').split('\n');
  const { start, end } = commonEdges(before, after);
  const changes = [
    ...block(before.slice(0, start), 'unchanged'),
    ...middleChanges(
      before.slice(start, before.length - end),
      after.slice(start, after.length - end),
    ),
    ...block(before.slice(before.length - end), 'unchanged'),
  ];
  let oldLine = 0;
  let newLine = 0;
  return changes.map((change) => ({
    ...change,
    before: change.kind === 'added' ? null : ++oldLine,
    after: change.kind === 'removed' ? null : ++newLine,
  }));
}
