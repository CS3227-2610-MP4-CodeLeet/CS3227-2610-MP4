/* eslint-disable max-lines-per-function -- grouped behavioral scenarios. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DraftController } from './draft-controller';
import {
  DRAFT_EPOCH,
  draftKey,
  readDraft,
  type DraftContext,
} from './draft-storage';

const context: DraftContext = {
  studentId: crypto.randomUUID(),
  assignmentId: crypto.randomUUID(),
  language: 'python',
  revisionId: null,
};
const make = (source = '') =>
  new DraftController(source, context, {
    storage: () => localStorage,
    lock: async (work) => work(),
  });
const flush = async () => {
  await vi.advanceTimersByTimeAsync(500);
};
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('browser editor draft lifecycle', () => {
  it('debounces, offers recovery before editing, and restores without submitting', async () => {
    const first = make();
    first.start();
    first.edit('print(1)');
    expect(first.getSnapshot().status).toBe('saving');
    expect(readDraft(localStorage, context)).toBeNull();
    await flush();
    first.dispose();
    const second = make();
    second.start();
    expect(second.getSnapshot().status).toBe('recover');
    second.edit('overwrite');
    expect(second.getSnapshot().source).toBe('');
    second.resolve('restore');
    expect(second.getSnapshot().source).toBe('print(1)');
    expect(second.getSnapshot().dirty).toBe(true);
    second.dispose();
  });

  it('discards the recovery candidate, preserves baseline and handles blank edits', async () => {
    const first = make('print(1)');
    first.start();
    first.edit('');
    await flush();
    first.dispose();
    const second = make('print(1)');
    second.start();
    expect(second.getSnapshot().status).toBe('recover');
    second.resolve('discard');
    await flush();
    expect(second.getSnapshot().source).toBe('print(1)');
    expect(localStorage.getItem(draftKey(context))).toBeNull();
    second.dispose();
  });

  it('acknowledges exactly the submitted source and preserves newer in-flight edits', async () => {
    const editor = make();
    editor.start();
    editor.edit('print(1)');
    await flush();
    editor.edit('print(2)');
    editor.acknowledge('print(1)');
    await flush();
    expect(readDraft(localStorage, context)?.record.source).toBe('print(2)');
    expect(editor.getSnapshot().dirty).toBe(true);
    editor.acknowledge('print(2)');
    await flush();
    expect(localStorage.getItem(draftKey(context))).toBeNull();
    expect(editor.getSnapshot().dirty).toBe(false);
    editor.dispose();
  });

  it('detects conflicts without an event and supports explicit keep/load choices', async () => {
    const a = make();
    const b = make();
    a.start();
    b.start();
    a.edit('a');
    await flush();
    b.edit('b');
    await flush();
    expect(b.getSnapshot().status).toBe('conflict');
    expect(b.getSnapshot().source).toBe('b');
    b.resolve('keep');
    await flush();
    expect(readDraft(localStorage, context)?.record.source).toBe('b');
    a.externalChange();
    expect(a.getSnapshot().status).toBe('conflict');
    a.resolve('load');
    expect(a.getSnapshot().source).toBe('b');
    a.dispose();
    b.dispose();
  });

  it('invalidates pending and suspended writers without permitting override', async () => {
    const editor = make();
    editor.start();
    editor.edit('private');
    localStorage.setItem(DRAFT_EPOCH, crypto.randomUUID());
    await flush();
    expect(editor.getSnapshot().status).toBe('stopped');
    editor.resolve('keep');
    editor.edit('old account');
    await flush();
    expect(localStorage.getItem(draftKey(context))).toBeNull();
    editor.dispose();
  });

  it('flushes on departure, handles read/write failure and cleans up pending timers', async () => {
    const editor = make();
    editor.start();
    editor.edit('flush');
    await editor.flush();
    expect(readDraft(localStorage, context)?.record.source).toBe('flush');
    editor.dispose();
    const denied = new DraftController('', context, {
      storage: () => {
        throw new Error('blocked');
      },
      lock: async (work) => work(),
    });
    denied.start();
    expect(denied.getSnapshot().status).toBe('error');
    denied.edit('still editable');
    await flush();
    expect(denied.getSnapshot().source).toBe('still editable');
    expect(denied.getSnapshot().status).toBe('error');
    denied.dispose();
  });
});
