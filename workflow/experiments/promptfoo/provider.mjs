import { readFileSync } from 'node:fs';
import {
  isProviderConfigurationReady,
  runTrial,
} from '../../scripts/evaluate-soclaas-models.mjs';

const MAX_LIVE_REQUESTS = 10;
const suite = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));

function caseFixtures(testCase, fixtures) {
  return {
    ...fixtures,
    assignment: { ...fixtures.assignment, ...testCase.assignmentOverride },
    rubric: testCase.rubricOverride ?? fixtures.rubric,
  };
}

function fixtureResponse(testCase) {
  return {
    output: JSON.stringify({
      mode: 'offline_fixture',
      caseId: testCase.id,
      status: 'fixture_only',
      response: testCase.fixtureOutput,
    }),
  };
}

function liveResponse(testCase, trial) {
  return {
    output: JSON.stringify({
      mode: 'live_soclaas',
      caseId: testCase.id,
      status: trial.status,
      schemaValid: trial.schemaValid ?? false,
      qualityChecks: trial.qualityChecks,
      response: trial.response ?? trial.rawResponse ?? null,
      latencyMs: trial.latencyMs,
    }),
    tokenUsage:
      trial.inputTokens === undefined && trial.outputTokens === undefined
        ? undefined
        : {
            prompt: trial.inputTokens,
            completion: trial.outputTokens,
            total: (trial.inputTokens ?? 0) + (trial.outputTokens ?? 0),
          },
  };
}

export function createPromptfooProvider({
  cases = suite.cases,
  fixtures = suite.fixtures,
  env = process.env,
  fetchImpl = fetch,
  maxRequests = MAX_LIVE_REQUESTS,
} = {}) {
  let liveRequests = 0;
  return {
    id: () => 'codeleet-soclaas-security',
    async callApi(_prompt, context) {
      const caseId = context?.vars?.caseId;
      const testCase = cases.find((item) => item.id === caseId);
      if (!testCase) return { error: 'unknown_case' };
      const testFixtures = caseFixtures(testCase, fixtures);
      if (env.SOCLAAS_PROMPTFOO_LIVE !== 'true')
        return fixtureResponse(testCase);
      if (
        !isProviderConfigurationReady({
          enabled: env.SOCLAAS_AI_ENABLED,
          baseUrl: env.SOCLAAS_BASE_URL,
          apiKey: env.SOCLAAS_API_KEY,
        }) ||
        !env.SOCLAAS_MODEL
      )
        return { error: 'provider_configuration_unavailable' };
      if (liveRequests >= maxRequests || liveRequests >= MAX_LIVE_REQUESTS)
        return { error: 'request_budget_exceeded' };
      liveRequests += 1;
      const trial = await runTrial({
        baseUrl: env.SOCLAAS_BASE_URL.trim(),
        apiKey: env.SOCLAAS_API_KEY.trim(),
        model: env.SOCLAAS_MODEL.trim(),
        testCase,
        fixtures: testFixtures,
        fetchImpl,
      });
      return liveResponse(testCase, trial);
    },
  };
}

export default class PromptfooSoCLaaSProvider {
  constructor() {
    this.provider = createPromptfooProvider();
  }

  id() {
    return this.provider.id();
  }

  callApi(prompt, context, options) {
    return this.provider.callApi(prompt, context, options);
  }
}
