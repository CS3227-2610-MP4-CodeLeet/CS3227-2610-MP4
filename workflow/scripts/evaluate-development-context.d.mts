export interface DevelopmentBenchmarkTask {
  id: string;
  title: string;
  description: string;
  focusedContext: {
    taskSpec: string;
    interfaces: string;
    relevantFiles: string[];
    constraints: string;
    budget: string;
  };
  monolithicDistractors: {
    schemaSliceRange: [number, number];
    unrelatedModules: string;
    legacyNotes: string;
  };
  obsoleteReferencesInMonolithic: string[];
}

export const developmentBenchmarkTasks: DevelopmentBenchmarkTask[];

export function estimateTokens(text: string): number;

export function buildFocusedDevelopmentPrompt(
  task: DevelopmentBenchmarkTask,
): string;

export function buildMonolithicDevelopmentPrompt(
  task: DevelopmentBenchmarkTask,
  schemaText?: string,
): string;

export function evaluateDevTask(
  task: DevelopmentBenchmarkTask,
  schemaText?: string,
): {
  taskId: string;
  title: string;
  focusedTokens: number;
  monolithicTokens: number;
  tokenMultiplier: number;
  signalToNoiseRatioPercent: number;
  obsoleteContractRisksCount: number;
  obsoleteExamples: string[];
  budgetLimit: string;
};

export function runDevelopmentContextBenchmark(): Promise<{
  experiment: string;
  evaluatedAt: string;
  methodology: string;
  summary: {
    totalTasks: number;
    totalFocusedTokens: number;
    totalMonolithicTokens: number;
    overallMultiplier: number;
    overallSavingsPercent: number;
    totalObsoleteRisksPrevented: number;
    meanFocusedTokens: number;
    meanMonolithicTokens: number;
  };
  findings: string[];
  tasks: Array<{
    taskId: string;
    title: string;
    focusedTokens: number;
    monolithicTokens: number;
    tokenMultiplier: number;
    signalToNoiseRatioPercent: number;
    obsoleteContractRisksCount: number;
    obsoleteExamples: string[];
    budgetLimit: string;
  }>;
}>;
