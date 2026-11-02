// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSubmissionDraft } from './use-submission-draft';
import {
  confirmUnsavedNavigation,
  installUnsavedCodeGuard,
} from './unsaved-code-guard';

afterEach(() => cleanup());

describe('submission draft lifecycle', () => {
  it('tracks edits, reuses an attempt id, and creates a new id after source changes', () => {
    const { result } = renderHook(() => useSubmissionDraft('print(1)'));
    expect(result.current.ready).toBe(true);
    expect(result.current.dirty).toBe(false);
    let first!: ReturnType<typeof result.current.submissionAttempt>;
    act(() => {
      first = result.current.submissionAttempt();
    });
    act(() => {
      result.current.setSource('print(1)');
    });
    let reused!: ReturnType<typeof result.current.submissionAttempt>;
    act(() => {
      reused = result.current.submissionAttempt();
    });
    expect(reused).toEqual(first);
    act(() => {
      result.current.setSource('print(2)');
    });
    expect(result.current.dirty).toBe(true);
    let changed!: ReturnType<typeof result.current.submissionAttempt>;
    act(() => {
      changed = result.current.submissionAttempt();
    });
    expect(changed.source).toBe('print(2)');
    expect(changed.requestId).not.toBe(first.requestId);
    act(() => {
      result.current.acknowledge('print(2)');
    });
    expect(result.current.dirty).toBe(false);
  });

  it('blocks explicit leave and same-site links when the user declines, then cleans up', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const uninstall = installUnsavedCodeGuard();
    expect(confirmUnsavedNavigation()).toBe(false);
    const link = document.createElement('a');
    link.href = '/student/assignments?page=2';
    document.body.append(link);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(2);
    uninstall();
    expect(confirmUnsavedNavigation()).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('allows modified and external links without showing the unsaved warning', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const uninstall = installUnsavedCodeGuard();
    const internal = document.createElement('a');
    internal.href = '/student/assignments';
    document.body.append(internal);
    const modified = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    });
    modified.preventDefault();
    internal.dispatchEvent(modified);
    const external = document.createElement('a');
    external.href = 'https://example.test/';
    document.body.append(external);
    const externalClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    externalClick.preventDefault();
    external.dispatchEvent(externalClick);
    expect(confirm).not.toHaveBeenCalled();
    uninstall();
  });
});
