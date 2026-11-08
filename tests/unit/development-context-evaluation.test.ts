import { describe, expect, it } from 'vitest';
import {
  runDevelopmentContextBenchmark,
  developmentBenchmarkTasks,
} from '../../workflow/scripts/evaluate-development-context.mjs';

describe('Development Context Engineering & Resource-Aware Benchmark', () => {
  it('demonstrates that focused context achieves dramatic token savings and noise reduction', async () => {
    const report = await runDevelopmentContextBenchmark();
    expect(report.summary.totalTasks).toBe(5);
    expect(report.summary.overallMultiplier).toBeGreaterThan(15);
    expect(report.summary.overallSavingsPercent).toBeGreaterThan(90);
    expect(report.summary.totalObsoleteRisksPrevented).toBeGreaterThan(5);
    expect(report.findings.length).toBeGreaterThanOrEqual(4);
  });

  it('verifies that each benchmark task specifies explicit budget and scope constraints', () => {
    for (const task of developmentBenchmarkTasks) {
      expect(task.focusedContext.budget).toBeTruthy();
      expect(task.focusedContext.relevantFiles.length).toBeGreaterThan(0);
      expect(task.focusedContext.interfaces).toBeTruthy();
      expect(task.obsoleteReferencesInMonolithic.length).toBeGreaterThan(0);
    }
  });
});
