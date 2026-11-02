import { z } from 'zod';
import { validateSource } from './source-validation';

export const DRAFT_PREFIX = 'codeleet:draft:v1:';
export const DRAFT_EPOCH = 'codeleet:draft-epoch:v1';
export const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;
export const DRAFT_LOCK = 'codeleet:drafts:v1';
export const DRAFT_INVALIDATED = 'codeleet:drafts-invalidated';

const contextSchema = z
  .object({
    studentId: z.uuid(),
    assignmentId: z.uuid(),
    language: z.enum(['python', 'java']),
    revisionId: z.uuid().nullable(),
  })
  .strict();
export type DraftContext = z.infer<typeof contextSchema>;
const sourceSchema = z
  .string()
  .max(8_000)
  .refine(
    (source) => !validateSource(source.trim() ? source : source + 'a').error,
  );
const recordSchema = z
  .object({
    version: z.literal(1),
    context: contextSchema,
    source: sourceSchema,
    savedAt: z.number().int().nonnegative(),
    token: z.uuid(),
  })
  .strict();
export type DraftRecord = z.infer<typeof recordSchema>;

export function draftKey(context: DraftContext) {
  return (
    DRAFT_PREFIX +
    [
      context.studentId,
      context.assignmentId,
      context.language,
      context.revisionId ?? 'blank',
    ].join(':')
  );
}

function parseRecord(raw: string | null, now: number) {
  if (!raw || raw.length > 50_000) return null;
  try {
    const parsed = recordSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const record = parsed.data;
    return record.savedAt <= now && now - record.savedAt < DRAFT_TTL
      ? record
      : null;
  } catch {
    return null;
  }
}

export function readDraft(
  storage: Storage,
  context: DraftContext,
  now = Date.now(),
) {
  const raw = storage.getItem(draftKey(context));
  const record = parseRecord(raw, now);
  return record && draftKey(record.context) === draftKey(context)
    ? { raw: raw!, record }
    : null;
}

function draftKeys(storage: Storage) {
  return Array.from({ length: storage.length }, (_, index) =>
    storage.key(index),
  ).filter((key): key is string => !!key?.startsWith(DRAFT_PREFIX));
}

function pruneDrafts(storage: Storage, current: string, now: number) {
  const others = draftKeys(storage).filter((key) => key !== current);
  const valid: Array<{ key: string; savedAt: number }> = [];
  for (const key of others) {
    const record = parseRecord(storage.getItem(key), now);
    if (record) valid.push({ key, savedAt: record.savedAt });
    else storage.removeItem(key);
  }
  valid.sort((a, b) => a.savedAt - b.savedAt || a.key.localeCompare(b.key));
  for (const record of valid.slice(0, Math.max(0, valid.length - 9)))
    storage.removeItem(record.key);
}

type WriteInput = {
  context: DraftContext;
  source: string | null;
  expected: string | null;
  epoch: string | null;
  now?: number;
};
export type DraftWrite =
  | { status: 'saved'; raw: string | null }
  | { status: 'conflict' | 'invalidated' | 'unavailable' };

// Call inside DRAFT_LOCK; compare tokens even when another tab's storage event is delayed.
export function writeDraft(storage: Storage, input: WriteInput): DraftWrite {
  try {
    const key = draftKey(contextSchema.parse(input.context));
    if (storage.getItem(DRAFT_EPOCH) !== input.epoch)
      return { status: 'invalidated' };
    if (storage.getItem(key) !== input.expected) return { status: 'conflict' };
    if (input.source === null) {
      storage.removeItem(key);
      return { status: 'saved', raw: null };
    }
    const previous = readDraft(storage, input.context, input.now ?? Date.now());
    if (previous?.record.source === input.source)
      return { status: 'saved', raw: previous.raw };
    const record = recordSchema.parse({
      version: 1,
      context: input.context,
      source: input.source,
      savedAt: input.now ?? Date.now(),
      token: crypto.randomUUID(),
    });
    const raw = JSON.stringify(record);
    // Write before pruning so quota failures do not delete existing drafts.
    storage.setItem(key, raw);
    pruneDrafts(storage, key, record.savedAt);
    return { status: 'saved', raw };
  } catch {
    return { status: 'unavailable' };
  }
}

export function clearDraftStorage(storage: Storage) {
  const epoch = crypto.randomUUID();
  // A full quota must not prevent deleting source. Retry after freeing space.
  try {
    storage.setItem(DRAFT_EPOCH, epoch);
  } catch {
    /* Continue cleanup. */
  }
  for (const key of draftKeys(storage)) storage.removeItem(key);
  storage.setItem(DRAFT_EPOCH, epoch);
}

export async function clearBrowserDrafts() {
  // Stop same-document writers even if storage access has been denied.
  window.dispatchEvent(new Event(DRAFT_INVALIDATED));
  try {
    if (navigator.locks) {
      await navigator.locks.request(DRAFT_LOCK, () =>
        clearDraftStorage(window.localStorage),
      );
    } else clearDraftStorage(window.localStorage);
  } catch {
    // A rejected lock must not bypass cleanup; writes fail closed without locks.
    try {
      clearDraftStorage(window.localStorage);
    } catch {
      /* Storage can be denied. */
    }
  }
}
