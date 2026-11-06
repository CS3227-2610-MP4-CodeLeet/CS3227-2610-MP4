export const STUDENT_PROMPT_VERSION: string;
export const INSTRUCTOR_PROMPT_VERSION: string;
export const STUDENT_SYSTEM_PROMPT: string;
export const INSTRUCTOR_SYSTEM_PROMPT: string;

export function estimateTokens(value: unknown): number;

export function checkPreflightTokenBudget(
  messages: unknown,
  budgetCeiling?: number,
): {
  estimatedTokens: number;
  withinBudget: boolean;
  rejected: boolean;
};

export function buildFocusedMessages(
  testCase: {
    role: 'student' | 'instructor';
    submission: { source: string };
  },
  assignment: {
    id: string;
    title: string;
    instructions: string;
    language: string;
    version: number;
  },
  rubric: {
    version: number;
    criteria: Array<{
      id: string;
      title: string;
      description: string;
      maxScore: number;
    }>;
  },
): { system: string; user: string };

export function buildBroaderMessages(
  testCase: {
    role: 'student' | 'instructor';
    submission: { revision: number; submittedAt: string; source: string };
  },
  assignment: {
    id: string;
    title: string;
    instructions: string;
    language: string;
    version: number;
    publicationStatus?: string;
    createdAt?: string;
    updatedAt?: string;
    courseId?: string;
  },
  rubric: {
    version: number;
    criteria: Array<{
      id: string;
      title: string;
      description: string;
      maxScore: number;
    }>;
  },
): { system: string; user: string };

export function computeCacheKey(input: {
  requesterId?: string;
  reviewType: string;
  role: 'student' | 'instructor';
  assignment: { id: string; version: number };
  rubricVersion?: number;
  source: string;
  model: string;
  strategy?: string;
  promptVersion?: string;
}): string;

export function runContextStrategyBenchmark(): Promise<{
  experiment: string;
  evaluatedAt: string;
  benchmarkVersion: string;
  estimator: string;
  summary: {
    totalCases: number;
    totalFocusedTokens: number;
    totalBroaderTokens: number;
    overallDelta: number;
    overallPercentageIncrease: number;
    broaderOverheadPercent: number;
    focusedSavingsPercent: number;
    meanFocusedTokens: number;
    meanBroaderTokens: number;
    meanTokenSavingsPerRequest: number;
  };
  invariantsVerified: {
    allSystemPromptsIsolatedFromUserSource: boolean;
    allUserPayloadsEncapsulatedInUserRole: boolean;
    allInjectionsSafelyContainedInUserData: boolean;
    allStudentRubricsIsolated: boolean;
    allCacheKeysDistinctByStrategy: boolean;
    allCacheKeysIdentityScoped: boolean;
    inputBudgetEnforcedAt8000Tokens: boolean;
  };
  preflightEnforcement: {
    budgetThreshold: number;
    regularCasesPass: boolean;
    oversizedCaseRejected: boolean;
    oversizedEstimatedTokens: number;
  };
  cases: Array<{
    caseId: string;
    role: string;
    language: string;
    focusedTokens: number;
    broaderTokens: number;
    tokenDelta: number;
    percentageIncrease: number;
    broaderOverheadPercent: number;
    focusedSavingsPercent: number;
    security: Record<string, boolean>;
  }>;
}>;
