/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({ requestSoCLaaS: vi.fn() }));

vi.mock('@/lib/ai/soclaas', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/soclaas')>();
  return { ...actual, requestSoCLaaS: mocks.requestSoCLaaS };
});

import { SoCLaaSError } from '@/lib/ai/soclaas';
import { performContextComparison, performReview } from './review-service';

const userId = '20000000-0000-4000-8000-000000000001';
const otherUserId = '20000000-0000-4000-8000-000000000002';
const submissionId = '50000000-0000-4000-8000-000000000001';
const assignmentId = '30000000-0000-4000-8000-000000000001';
const criterionId = '40000000-0000-4000-8000-000000000001';

const feedback = {
  summary: 'The loop is clear.',
  strengths: ['Readable variable names.'],
  nextSteps: ['Try an empty input.'],
  questions: ['What happens at the boundary?'],
};
const evaluation = {
  criteria: [
    {
      criterionId,
      suggestedScore: 8,
      feedback: 'The output is correct.',
    },
  ],
  overallFeedback: 'Check the empty-input case.',
  totalScore: 8,
};

function makeSupabase(
  options: {
    submission?: Record<string, unknown> | null;
    assignment?: Record<string, unknown> | null;
    rubric?: Record<string, unknown> | null;
    cached?: unknown | unknown[];
    reserveError?: { message: string } | null;
    reserveData?: string | null;
    insertError?: { message: string } | null;
  } = {},
) {
  const submission =
    options.submission === null
      ? null
      : {
          id: submissionId,
          assignment_id: assignmentId,
          student_id: userId,
          source: 'print(1)',
          language: 'python',
          revision: 2,
          created_at: '2026-10-25T10:00:00.000Z',
          ...options.submission,
        };
  const assignment =
    options.assignment === null
      ? null
      : {
          id: assignmentId,
          title: 'Loops',
          instructions: 'Write a loop.',
          language: 'python',
          version: 3,
          publication_status: 'published',
          created_at: '2026-10-20T10:00:00.000Z',
          updated_at: '2026-10-24T10:00:00.000Z',
          ...options.assignment,
        };
  const rubric =
    options.rubric === null
      ? null
      : {
          version: 4,
          criteria: [
            {
              id: criterionId,
              title: 'Correctness',
              description: 'Produces the expected output.',
              maxScore: 10,
            },
          ],
          ...options.rubric,
        };
  const inserts: Array<{ table: string; value: unknown }> = [];
  const rpcCalls: Array<{ name: string; args: unknown }> = [];
  const filters: Array<{ table: string; column: string; value: unknown }> = [];
  let cacheRead = 0;

  const client = {
    from(table: string) {
      const query = {
        select: () => query,
        eq(column: string, value: unknown) {
          filters.push({ table, column, value });
          return query;
        },
        async maybeSingle() {
          if (
            table === 'assignments' &&
            filters.some(
              (filter) =>
                filter.table === table &&
                filter.column === 'publication_status' &&
                filter.value !== assignment?.publication_status,
            )
          )
            return { data: null, error: null };
          if (table === 'ai_reviews') {
            const cachedValues = Array.isArray(options.cached)
              ? options.cached
              : [options.cached];
            const cached = cachedValues[cacheRead++];
            return {
              data:
                cached === undefined || cached === null
                  ? null
                  : { result: cached },
              error: null,
            };
          }
          const dataByTable: Record<string, unknown> = {
            submissions: submission,
            assignments: assignment,
            assignment_rubrics: rubric,
          };
          return { data: dataByTable[table] ?? null, error: null };
        },
        async insert(value: unknown) {
          inserts.push({ table, value });
          return { error: options.insertError ?? null };
        },
      };
      return query;
    },
    async rpc(name: string, args: unknown) {
      rpcCalls.push({ name, args });
      if (name === 'reserve_ai_request')
        return {
          data:
            options.reserveData === undefined ? 'usage-1' : options.reserveData,
          error: options.reserveError ?? null,
        };
      return { data: null, error: null };
    },
  };

  return {
    supabase: client as unknown as SupabaseClient,
    inserts,
    rpcCalls,
    filters,
  };
}

function providerResult(content: unknown, tokens = true) {
  return {
    content: JSON.stringify(content),
    model: 'educator-v1',
    ...(tokens ? { inputTokens: 123, outputTokens: 45 } : {}),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SOCLAAS_MODEL', ' educator-v1 ');
  mocks.requestSoCLaaS.mockResolvedValue(providerResult(feedback));
});

describe('performReview', () => {
  it('generates, validates, stores, and records an uncached student review', async () => {
    const db = makeSupabase();

    const result = await performReview(
      db.supabase,
      userId,
      'student',
      submissionId,
    );

    expect(result).toEqual({ result: feedback, cacheHit: false });
    expect(mocks.requestSoCLaaS).toHaveBeenCalledOnce();
    expect(db.filters).toContainEqual({
      table: 'assignments',
      column: 'publication_status',
      value: 'published',
    });
    expect(db.inserts).toHaveLength(1);
    expect(db.inserts[0]).toMatchObject({
      table: 'ai_reviews',
      value: {
        submission_id: submissionId,
        requester_id: userId,
        review_type: 'student_feedback',
        model: 'educator-v1',
        assignment_version: 3,
        rubric_version: null,
        result: feedback,
      },
    });
    expect(db.rpcCalls).toContainEqual({
      name: 'finish_ai_request',
      args: expect.objectContaining({
        p_usage_id: 'usage-1',
        p_succeeded: true,
        p_input_tokens: 123,
        p_output_tokens: 45,
        p_token_source: 'provider',
      }),
    });
  });

  it('uses a valid cached result without reserving quota or calling SoCLaaS', async () => {
    const db = makeSupabase({ cached: feedback });

    const result = await performReview(
      db.supabase,
      userId,
      'student',
      submissionId,
    );

    expect(result).toEqual({ result: feedback, cacheHit: true });
    expect(mocks.requestSoCLaaS).not.toHaveBeenCalled();
    expect(db.inserts).toHaveLength(0);
    expect(db.rpcCalls).toHaveLength(1);
    expect(db.rpcCalls[0]).toMatchObject({
      name: 'record_ai_cache_hit',
      args: {
        p_review_type: 'student_feedback',
        p_submission_id: submissionId,
      },
    });
  });

  it('does not expose another student submission or an unpublished assignment', async () => {
    const foreignSubmission = makeSupabase({
      submission: { student_id: otherUserId },
    });
    await expect(
      performReview(
        foreignSubmission.supabase,
        userId,
        'student',
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });

    const unpublished = makeSupabase({
      assignment: { publication_status: 'draft' },
    });
    await expect(
      performReview(unpublished.supabase, userId, 'student', submissionId),
    ).rejects.toMatchObject({ code: 'not_found' });
    expect(mocks.requestSoCLaaS).not.toHaveBeenCalled();
  });

  it('rejects a missing submission, assignment, or instructor rubric', async () => {
    await expect(
      performReview(
        makeSupabase({ submission: null }).supabase,
        userId,
        'student',
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(
      performReview(
        makeSupabase({ assignment: null }).supabase,
        userId,
        'student',
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(
      performReview(
        makeSupabase({ rubric: null }).supabase,
        userId,
        'instructor',
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('rejects malformed private rubric data before calling the provider', async () => {
    const db = makeSupabase({ rubric: { version: 1, criteria: [] } });

    await expect(
      performReview(db.supabase, userId, 'instructor', submissionId),
    ).rejects.toMatchObject({ code: 'invalid_model_output' });
    expect(mocks.requestSoCLaaS).not.toHaveBeenCalled();
  });

  it('rejects prompts over the configured context budget', async () => {
    const db = makeSupabase({
      assignment: { instructions: '🙂'.repeat(6_000) },
      submission: { source: '🙂'.repeat(4_000) },
    });

    await expect(
      performReview(db.supabase, userId, 'student', submissionId),
    ).rejects.toMatchObject({ code: 'context_too_large' });
    expect(mocks.requestSoCLaaS).not.toHaveBeenCalled();
  });

  it('maps quota errors and rejected reservations to stable service errors', async () => {
    await expect(
      performReview(
        makeSupabase({ reserveError: { message: 'daily_quota_exceeded' } })
          .supabase,
        userId,
        'student',
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'quota_exceeded' });
    await expect(
      performReview(
        makeSupabase({ reserveError: { message: 'database unavailable' } })
          .supabase,
        userId,
        'student',
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(
      performReview(
        makeSupabase({ reserveData: null }).supabase,
        userId,
        'student',
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('records invalid provider output as a failed attempt without accepting unsafe content', async () => {
    mocks.requestSoCLaaS.mockResolvedValueOnce(
      providerResult({
        summary: '<script>bad</script>',
        strengths: [],
        nextSteps: [],
        questions: [],
      }),
    );
    const db = makeSupabase();

    await expect(
      performReview(db.supabase, userId, 'student', submissionId),
    ).rejects.toMatchObject({ code: 'invalid_model_output' });
    expect(db.inserts).toHaveLength(0);
    expect(db.rpcCalls).toContainEqual({
      name: 'finish_ai_request',
      args: expect.objectContaining({
        p_succeeded: false,
        p_error_category: 'invalid_model_output',
      }),
    });
  });

  it('uses estimated token counts when the provider omits usage', async () => {
    mocks.requestSoCLaaS.mockResolvedValueOnce(providerResult(feedback, false));
    const db = makeSupabase();

    await performReview(db.supabase, userId, 'student', submissionId);

    expect(db.rpcCalls).toContainEqual({
      name: 'finish_ai_request',
      args: expect.objectContaining({
        p_succeeded: true,
        p_token_source: 'estimate',
        p_input_tokens: expect.any(Number),
        p_output_tokens: expect.any(Number),
      }),
    });
  });

  it('maps provider unavailability separately and records a failed usage result', async () => {
    mocks.requestSoCLaaS.mockRejectedValueOnce(new SoCLaaSError('unavailable'));
    const db = makeSupabase();

    await expect(
      performReview(db.supabase, userId, 'student', submissionId),
    ).rejects.toMatchObject({ code: 'unavailable' });
    expect(db.rpcCalls).toContainEqual({
      name: 'finish_ai_request',
      args: expect.objectContaining({
        p_succeeded: false,
        p_error_category: 'unavailable',
      }),
    });
  });

  it('maps provider and persistence failures to a stable provider error', async () => {
    const providerFailure = makeSupabase();
    mocks.requestSoCLaaS.mockRejectedValueOnce(new Error('network detail'));
    await expect(
      performReview(providerFailure.supabase, userId, 'student', submissionId),
    ).rejects.toMatchObject({ code: 'provider_error' });

    const persistenceFailure = makeSupabase({
      insertError: { message: 'database detail' },
    });
    mocks.requestSoCLaaS.mockResolvedValueOnce(providerResult(feedback));
    await expect(
      performReview(
        persistenceFailure.supabase,
        userId,
        'student',
        submissionId,
      ),
    ).rejects.toMatchObject({ code: 'provider_error' });
    expect(persistenceFailure.rpcCalls).toContainEqual({
      name: 'finish_ai_request',
      args: expect.objectContaining({
        p_succeeded: false,
        p_error_category: 'provider_error',
      }),
    });
  });
});

describe('performContextComparison', () => {
  it('returns optimized and broader authorized evaluations with token estimates', async () => {
    mocks.requestSoCLaaS
      .mockResolvedValueOnce(providerResult(evaluation))
      .mockResolvedValueOnce(providerResult(evaluation, false));
    const db = makeSupabase();

    const result = await performContextComparison(
      db.supabase,
      userId,
      submissionId,
    );

    expect(result.optimized).toMatchObject({
      result: evaluation,
      cacheHit: false,
    });
    expect(result.optimized.inputTokens).toBeGreaterThan(0);
    expect(result.broader).toMatchObject({
      result: evaluation,
      cacheHit: false,
    });
    expect(result.broader.inputTokens).toBeGreaterThan(0);
    expect(db.inserts).toHaveLength(2);
    expect(
      db.rpcCalls.filter((call) => call.name === 'reserve_ai_request'),
    ).toHaveLength(2);
  });

  it('reuses a cached broader context evaluation', async () => {
    const db = makeSupabase({ cached: [null, evaluation] });
    mocks.requestSoCLaaS.mockResolvedValueOnce(providerResult(evaluation));

    const result = await performContextComparison(
      db.supabase,
      userId,
      submissionId,
    );

    expect(result.optimized.cacheHit).toBe(false);
    expect(result.broader).toMatchObject({
      result: evaluation,
      cacheHit: true,
    });
    expect(result.broader.inputTokens).toBeGreaterThan(0);
    expect(mocks.requestSoCLaaS).toHaveBeenCalledOnce();
  });
});
