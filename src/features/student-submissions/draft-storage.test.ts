/* eslint-disable max-lines-per-function -- grouped storage boundary scenarios. */
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DRAFT_PREFIX,
  DRAFT_EPOCH,
  DRAFT_TTL,
  draftKey,
  readDraft,
  writeDraft,
  clearDraftStorage,
  type DraftContext,
} from './draft-storage';

const context: DraftContext = {
  studentId: 'd2000000-0000-4000-8000-000000000001',
  assignmentId: 'd2000000-0000-4000-8000-000000000002',
  language: 'python',
  revisionId: null,
};
const now = 1_800_000_000_000;
const write = (source = 'print(1)', expected: string | null = null) =>
  writeDraft(localStorage, { context, source, expected, epoch: null, now });
beforeEach(() => localStorage.clear());

describe('bounded browser draft storage', () => {
  it('separates account, assignment, language and revision contexts', () => {
    expect(write().status).toBe('saved');
    expect(readDraft(localStorage, context, now)?.record.source).toBe(
      'print(1)',
    );
    for (const changed of [
      { studentId: crypto.randomUUID() },
      { assignmentId: crypto.randomUUID() },
      { language: 'java' as const },
      { revisionId: crypto.randomUUID() },
    ])
      expect(
        readDraft(localStorage, { ...context, ...changed }, now),
      ).toBeNull();
  });

  it.each(['', ' \n\t', '😀', '<script>alert(1)</script>', 'a'.repeat(8000)])(
    'round-trips source as plain text, including empty drafts',
    (source) => {
      expect(write(source).status).toBe('saved');
      expect(readDraft(localStorage, context, now)?.record.source).toBe(source);
    },
  );

  it.each(['a'.repeat(8001), '\ud800', 'x\0'])(
    'rejects invalid source',
    (source) => {
      expect(write(source).status).toBe('unavailable');
      expect(localStorage.getItem(draftKey(context))).toBeNull();
    },
  );

  it('rejects corrupt, oversized, mismatched and expired records', () => {
    write();
    const valid = localStorage.getItem(draftKey(context))!;
    expect(readDraft(localStorage, context, now + DRAFT_TTL)).toBeNull();
    for (const raw of [
      '{',
      'a'.repeat(60_000),
      valid.replace('python', 'java'),
    ]) {
      localStorage.setItem(draftKey(context), raw);
      expect(readDraft(localStorage, context, now)).toBeNull();
    }
  });

  it('detects another writer without replacing it and rejects invalidated writers', () => {
    write();
    expect(write('print(2)').status).toBe('conflict');
    expect(readDraft(localStorage, context, now)?.record.source).toBe(
      'print(1)',
    );
    clearDraftStorage(localStorage);
    expect(localStorage.getItem(DRAFT_EPOCH)).not.toBeNull();
    expect(write().status).toBe('invalidated');
  });

  it('clears source even when writing an invalidation marker initially exceeds quota', () => {
    write();
    let attempts = 0;
    const storage = new Proxy(localStorage, {
      get(target, key) {
        if (key === 'setItem')
          return (name: string, value: string) => {
            if (name === DRAFT_EPOCH && attempts++ === 0)
              throw new DOMException('Full', 'QuotaExceededError');
            target.setItem(name, value);
          };
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    clearDraftStorage(storage);
    expect(localStorage.getItem(draftKey(context))).toBeNull();
    expect(localStorage.getItem(DRAFT_EPOCH)).not.toBeNull();
  });

  it('does not rewrite an unchanged saved draft during departure or conflict loading', () => {
    write();
    const raw = localStorage.getItem(draftKey(context));
    expect(write('print(1)', raw)).toEqual({ status: 'saved', raw });
  });

  it('prunes expired and oldest records to ten contexts, preserving unrelated storage', () => {
    localStorage.setItem('other-app', 'preserve');
    for (let index = 0; index < 12; index++) {
      expect(
        writeDraft(localStorage, {
          context: { ...context, assignmentId: crypto.randomUUID() },
          source: '',
          expected: null,
          epoch: null,
          now: now + index,
        }).status,
      ).toBe('saved');
    }
    expect(
      Object.keys(localStorage).filter((key) => key.startsWith(DRAFT_PREFIX)),
    ).toHaveLength(10);
    writeDraft(localStorage, {
      context,
      source: '',
      expected: null,
      epoch: null,
      now: now + DRAFT_TTL + 20,
    });
    expect(
      Object.keys(localStorage).filter((key) => key.startsWith(DRAFT_PREFIX)),
    ).toHaveLength(1);
    clearDraftStorage(localStorage);
    expect(localStorage.getItem('other-app')).toBe('preserve');
    expect(
      Object.keys(localStorage).filter((key) => key.startsWith(DRAFT_PREFIX)),
    ).toHaveLength(0);
  });
});
