export function buildTrialPlan(
  models: string[],
  cases: string[],
  maxRequests: number,
): {
  models: string[];
  omittedModels: string[];
  trials: Array<{ model: string; caseId: string }>;
  truncated: boolean;
};

export function buildEvaluationMessages(
  testCase: { role: 'student' | 'instructor'; task: string; source: string },
  fixtures: { assignment: unknown; rubric: unknown },
): { system: string; user: string };

export function scoreAssertions(
  testCase: {
    role: 'student' | 'instructor';
    assertions: Record<string, unknown>;
  },
  value: Record<string, unknown>,
  fixtures: { rubric: { criteria: Array<{ id: string; maxScore: number }> } },
): Record<string, boolean>;
export function classifyTrialStatus(
  schemaValid: boolean,
  qualityChecks: Record<string, boolean>,
): 'invalid_output' | 'validated' | 'quality_check_failed';
export function countProviderCalls(
  results: Array<Record<string, unknown>>,
): number;
export function runTrial(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
  testCase: {
    id: string;
    role: 'student' | 'instructor';
    task: string;
    source: string;
    assertions: Record<string, unknown>;
  };
  fixtures: { assignment: unknown; rubric: unknown };
  fetchImpl: typeof fetch;
}): Promise<Record<string, unknown>>;
export function parseEnvAssignment(
  line: string,
): { name: string; value: string } | null;
export function summarize(
  results: Array<Record<string, unknown>>,
  candidateModels?: string[],
  caseIds?: string[],
): Array<Record<string, unknown>>;
export function formatSafeProviderError(error: unknown): string;
export function isProviderConfigurationReady(config: {
  enabled?: string;
  baseUrl?: string;
  apiKey?: string;
}): boolean;
