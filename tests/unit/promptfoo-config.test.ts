import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../workflow/experiments/promptfoo/', import.meta.url);
const configPath = fileURLToPath(new URL('promptfooconfig.yaml', root));
const caseIdsPath = fileURLToPath(new URL('promptfoo-tests.json', root));
const casesPath = fileURLToPath(new URL('cases.json', root));
const runnerModule =
  await import('../../workflow/scripts/run-promptfoo-evaluation.mjs').catch(
    () => undefined,
  );
const assertionsModule =
  await import('../../workflow/experiments/promptfoo/assertions.mjs').catch(
    () => undefined,
  );
const suite = JSON.parse(readFileSync(casesPath, 'utf8'));
const caseIds = JSON.parse(readFileSync(caseIdsPath, 'utf8')) as Array<{
  vars: { caseId: string };
}>;

describe('Promptfoo case corpus', () => {
  it('selects every fixed synthetic case exactly once', () => {
    expect(caseIds.map(({ vars }) => vars.caseId)).toEqual(
      suite.cases.map(({ id }: { id: string }) => id),
    );
    expect(new Set(caseIds.map(({ vars }) => vars.caseId)).size).toBe(10);
  });

  it('gives instructor cases the same explicit JSON contract as product prompts', () => {
    const instructorCases = suite.cases.filter(
      ({ role }: { role: string }) => role === 'instructor',
    );
    expect(instructorCases).toHaveLength(5);
    for (const testCase of instructorCases) {
      expect(testCase.task).toContain(
        'criteria: [{ criterionId, suggestedScore, feedback }]',
      );
      expect(testCase.task).toContain('overallFeedback');
      expect(testCase.task).toContain('totalScore');
    }
  });
});

describe('Promptfoo local configuration', () => {
  it('uses only local providers, cases, and assertion code', () => {
    const config = readFileSync(configPath, 'utf8');
    expect(config).toContain('file://provider.mjs');
    expect(config).toContain('file://promptfoo-tests.json');
    expect(config).toContain('file://assertions.mjs:securityCheck');
    expect(config).toContain('maxConcurrency: 1');
    expect(config).toContain('safeMode: true');
    expect(config).not.toMatch(/api[_-]?key|https?:\/\//i);
    expect(config).not.toContain('redteam');
  });
});

describe('Promptfoo runner', () => {
  it('builds a fail-closed offline command and an explicit bounded live command', () => {
    const buildRunPlan = (
      runnerModule as unknown as {
        buildRunPlan: (
          mode: string,
          env: Record<string, string | undefined>,
        ) => {
          args: string[];
          env: Record<string, string | undefined>;
          error?: string;
        };
      }
    )?.buildRunPlan;
    expect(buildRunPlan).toBeTypeOf('function');

    const offline = buildRunPlan!('offline', {});
    expect(offline.env.PROMPTFOO_DISABLE_TELEMETRY).toBe('1');
    expect(offline.env.PROMPTFOO_DISABLE_REMOTE_GENERATION).toBe('1');
    expect(offline.env.PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION).toBe('1');
    expect(offline.env.SOCLAAS_PROMPTFOO_LIVE).toBeUndefined();
    expect(offline.env.SOCLAAS_API_KEY).toBeUndefined();
    expect(offline.env.SOCLAAS_BASE_URL).toBeUndefined();
    expect(offline.args).toContain('eval');
    expect(offline.args).toContain('--safe-mode');
    expect(offline.args).toContain('--no-write');
    expect(offline.args.join(' ')).not.toMatch(/redteam|api[_-]?key/i);

    const disabledLive = buildRunPlan!('live', {});
    expect(disabledLive.error).toBe('provider_configuration_unavailable');
    expect(disabledLive.args.join(' ')).not.toContain('TEST_SECRET');

    const live = buildRunPlan!('live', {
      SOCLAAS_PROMPTFOO_LIVE: 'true',
      SOCLAAS_AI_ENABLED: 'true',
      SOCLAAS_BASE_URL: 'https://soclaas.example.test/v1',
      SOCLAAS_API_KEY: 'TEST_SECRET',
      SOCLAAS_MODEL: 'test-model',
    });
    expect(live.error).toBeUndefined();
    expect(live.env.SOCLAAS_PROMPTFOO_LIVE).toBe('true');
    expect(live.args.join(' ')).not.toContain('TEST_SECRET');
  });
});

describe('Promptfoo security assertions', () => {
  it('rejects malformed provider envelopes and validates deterministic fixture output', async () => {
    const securityCheck = (
      assertionsModule as unknown as {
        securityCheck: (
          output: string,
          context: { vars: { caseId: string } },
        ) => boolean;
      }
    )?.securityCheck;
    expect(securityCheck).toBeTypeOf('function');
    const testCase = suite.cases[0];
    const valid = {
      mode: 'offline_fixture',
      caseId: testCase.id,
      status: 'fixture_only',
      response: testCase.fixtureOutput,
    };
    expect(
      securityCheck!(JSON.stringify(valid), {
        vars: { caseId: testCase.id },
      }),
    ).toBe(true);
    expect(
      securityCheck!('{invalid', {
        vars: { caseId: testCase.id },
      }),
    ).toBe(false);
    expect(
      securityCheck!(JSON.stringify({ ...valid, caseId: 'other' }), {
        vars: { caseId: testCase.id },
      }),
    ).toBe(false);

    const instructorCase = suite.cases.find(
      ({ role }: { role: string }) => role === 'instructor',
    );
    expect(
      securityCheck!(
        JSON.stringify({
          mode: 'live_soclaas',
          caseId: instructorCase.id,
          status: 'invalid_output',
          schemaValid: false,
          qualityChecks: {},
          response: { criterion_scores: [] },
        }),
        {
          vars: { caseId: instructorCase.id },
        },
      ),
    ).toBe(false);
  });
});
