/* eslint-disable max-lines-per-function -- behavioral benchmark suite keeps related assertions together */
import { describe, expect, it } from 'vitest';
import {
  buildFocusedMessages,
  computeCacheKey,
  checkPreflightTokenBudget,
  runContextStrategyBenchmark,
} from '../../workflow/scripts/evaluate-context-strategies.mjs';

const FOCUSED_STRATEGY = 'focused';
const SECRET_CRITERION = 'Secret Criterion';

describe('Context Strategy & Resource Accounting Benchmark', () => {
  it('measures token deltas and verifies that focused context reduces token footprint', async () => {
    const report = await runContextStrategyBenchmark();
    expect(report.summary.totalCases).toBe(8);
    expect(report.summary.meanFocusedTokens).toBeLessThan(
      report.summary.meanBroaderTokens,
    );
    expect(report.summary.broaderOverheadPercent).toBe(22.1);
    expect(report.summary.focusedSavingsPercent).toBe(18.1);
    expect(
      report.invariantsVerified.allSystemPromptsIsolatedFromUserSource,
    ).toBe(true);
    expect(
      report.invariantsVerified.allUserPayloadsEncapsulatedInUserRole,
    ).toBe(true);
    expect(report.invariantsVerified.allStudentRubricsIsolated).toBe(true);
    expect(report.invariantsVerified.allCacheKeysDistinctByStrategy).toBe(true);
    expect(report.invariantsVerified.allCacheKeysIdentityScoped).toBe(true);
    expect(report.invariantsVerified.inputBudgetEnforcedAt8000Tokens).toBe(
      true,
    );
  });

  it('strictly isolates student context from rubrics and grading criteria', () => {
    const testCase = {
      role: 'student' as const,
      submission: {
        revision: 1,
        submittedAt: '2026-11-01T10:00:00.000Z',
        source: 'print(42)',
      },
    };
    const assignment = {
      id: 'assignment-01',
      title: 'Test',
      instructions: 'Do work.',
      language: 'python' as const,
      version: 1,
    };
    const rubric = {
      version: 1,
      criteria: [
        {
          id: 'crit-01',
          title: SECRET_CRITERION,
          description: 'Top secret',
          maxScore: 10,
        },
      ],
    };

    const focused = buildFocusedMessages(testCase, assignment, rubric);
    expect(focused.user).not.toContain(SECRET_CRITERION);
    expect(focused.user).not.toContain('rubric');
    expect(focused.system).not.toContain(SECRET_CRITERION);
  });

  it('correctly scopes cache keys to strategy, version, and requester', () => {
    const base = {
      requesterId: 'user-01',
      reviewType: 'student_feedback',
      role: 'student' as const,
      assignment: { id: 'a1', version: 1 },
      rubricVersion: 1,
      source: 'print(1)',
      model: 'qwen3-coder-next',
    };

    const keyFocused = computeCacheKey({
      ...base,
      strategy: FOCUSED_STRATEGY,
    });
    const keyBroader = computeCacheKey({ ...base, strategy: 'broader' });
    const keyOtherUser = computeCacheKey({
      ...base,
      requesterId: 'user-02',
      strategy: FOCUSED_STRATEGY,
    });
    const keyOtherVersion = computeCacheKey({
      ...base,
      promptVersion: 'codementor-review-v9',
      strategy: FOCUSED_STRATEGY,
    });

    expect(keyFocused).not.toBe(keyBroader);
    expect(keyFocused).not.toBe(keyOtherUser);
    expect(keyFocused).not.toBe(keyOtherVersion);
  });

  it('rejects oversized contexts via preflight check', () => {
    const smallPayload = { system: 'Hello', user: 'World' };
    const largePayload = {
      system: 'Instructions',
      user: 'x'.repeat(25_000),
    };

    const smallCheck = checkPreflightTokenBudget(smallPayload, 8000);
    const largeCheck = checkPreflightTokenBudget(largePayload, 8000);

    expect(smallCheck.withinBudget).toBe(true);
    expect(smallCheck.rejected).toBe(false);
    expect(largeCheck.withinBudget).toBe(false);
    expect(largeCheck.rejected).toBe(true);
    expect(largeCheck.estimatedTokens).toBeGreaterThan(8000);
  });
});
