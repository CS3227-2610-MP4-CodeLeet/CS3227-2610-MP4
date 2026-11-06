/* eslint-disable max-lines-per-function -- behavioral benchmark suite keeps related assertions together */
import { describe, expect, it } from 'vitest';
import {
  buildFocusedMessages,
  computeCacheKey,
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
    expect(report.summary.overallPercentageIncrease).toBeGreaterThan(15);
    expect(
      report.invariantsVerified.allInjectionsSafelyContainedInUserData,
    ).toBe(true);
    expect(report.invariantsVerified.allStudentRubricsIsolated).toBe(true);
    expect(report.invariantsVerified.allCacheKeysDistinctByStrategy).toBe(true);
    expect(report.invariantsVerified.allCacheKeysIdentityScoped).toBe(true);
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
});
