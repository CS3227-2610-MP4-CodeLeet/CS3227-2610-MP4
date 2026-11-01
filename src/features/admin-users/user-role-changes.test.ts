import { describe, expect, it, vi } from 'vitest';
import { runUserRoleChange } from './user-directory';

function deferredRequest() {
  let finish!: () => void;
  const promise = new Promise<void>((resolve) => {
    finish = resolve;
  });
  return { promise, finish };
}

function startConcurrentChanges() {
  const firstUserId = '00000000-0000-4000-8000-000000000001';
  const secondUserId = '00000000-0000-4000-8000-000000000002';
  const pendingUserIds = new Set<string>();
  const onPendingChange = vi.fn();
  const firstRequest = deferredRequest();
  const secondRequest = deferredRequest();
  const runFirst = vi.fn(() => firstRequest.promise);
  const runSecond = vi.fn(() => secondRequest.promise);
  const runDuplicate = vi.fn().mockResolvedValue(undefined);
  const firstChange = runUserRoleChange(
    pendingUserIds,
    firstUserId,
    runFirst,
    onPendingChange,
  );
  const secondChange = runUserRoleChange(
    pendingUserIds,
    secondUserId,
    runSecond,
    onPendingChange,
  );
  const duplicateChange = runUserRoleChange(
    pendingUserIds,
    firstUserId,
    runDuplicate,
    onPendingChange,
  );
  return {
    firstUserId,
    secondUserId,
    pendingUserIds,
    onPendingChange,
    firstRequest,
    secondRequest,
    runFirst,
    runSecond,
    runDuplicate,
    firstChange,
    secondChange,
    duplicateChange,
  };
}

describe('admin role mutation tracking', () => {
  it('keeps concurrent accounts pending independently and ignores same-account duplicates', async () => {
    const scenario = startConcurrentChanges();

    await expect(scenario.duplicateChange).resolves.toBe(false);
    expect(scenario.runDuplicate).not.toHaveBeenCalled();
    expect(scenario.pendingUserIds).toEqual(
      new Set([scenario.firstUserId, scenario.secondUserId]),
    );

    scenario.firstRequest.finish();
    await expect(scenario.firstChange).resolves.toBe(true);
    expect(scenario.pendingUserIds).toEqual(new Set([scenario.secondUserId]));
    expect(scenario.onPendingChange).toHaveBeenLastCalledWith(
      new Set([scenario.secondUserId]),
    );

    scenario.secondRequest.finish();
    await expect(scenario.secondChange).resolves.toBe(true);
    expect(scenario.pendingUserIds.size).toBe(0);
    expect(scenario.runFirst).toHaveBeenCalledOnce();
    expect(scenario.runSecond).toHaveBeenCalledOnce();
  });
});
