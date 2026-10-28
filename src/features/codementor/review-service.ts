import 'server-only';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateModelEvaluation, validateModelFeedback } from './contracts';
import {
  PROMPT_VERSION,
  promptTokenEstimate,
  reviewCacheKey,
  studentReviewMessages,
  instructorReviewMessages,
  instructorBaselineMessages,
  type PublicAssignmentContext,
  type PrivateRubricContext,
} from './context';
import { requestSoCLaaS, SoCLaaSError } from '@/lib/ai/soclaas';

const rubricSchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(1000),
    maxScore: z.number().int().min(1).max(100),
  })
  .strict();
const criteriaSchema = z.array(rubricSchema).min(1).max(20);
const reviewTypeMap = {
  student: 'student_feedback',
  instructor: 'instructor_evaluation',
} as const;
type ReviewRole = keyof typeof reviewTypeMap;

export class ReviewServiceError extends Error {
  constructor(
    readonly code:
      | 'not_found'
      | 'context_too_large'
      | 'quota_exceeded'
      | 'unavailable'
      | 'invalid_model_output'
      | 'provider_error',
  ) {
    super(code);
  }
}

function asFailure(error: unknown): ReviewServiceError {
  if (error instanceof ReviewServiceError) return error;
  if (error instanceof SoCLaaSError && error.category === 'unavailable')
    return new ReviewServiceError('unavailable');
  return new ReviewServiceError('provider_error');
}

function readModelResult(
  content: string,
  role: ReviewRole,
  criteria: PrivateRubricContext['criteria'],
) {
  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch {
    throw new ReviewServiceError('invalid_model_output');
  }
  const result =
    role === 'student'
      ? validateModelFeedback(decoded)
      : validateModelEvaluation(decoded, criteria);
  if (!result) throw new ReviewServiceError('invalid_model_output');
  return result;
}

async function loadContext(
  supabase: SupabaseClient,
  userId: string,
  role: ReviewRole,
  submissionId: string,
) {
  const { data: submission } = await supabase
    .from('submissions')
    .select('id,assignment_id,student_id,source,revision,created_at')
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission || (role === 'student' && submission.student_id !== userId))
    throw new ReviewServiceError('not_found');
  let assignmentQuery = supabase
    .from('assignments')
    .select(
      'id,title,instructions,language,version,publication_status,created_at,updated_at',
    )
    .eq('id', submission.assignment_id);
  if (role === 'student')
    assignmentQuery = assignmentQuery.eq('publication_status', 'published');
  const { data: rawAssignment } = await assignmentQuery.maybeSingle();
  if (!rawAssignment) throw new ReviewServiceError('not_found');
  const assignment: PublicAssignmentContext = {
    id: rawAssignment.id,
    title: rawAssignment.title,
    instructions: rawAssignment.instructions,
    language: 'python',
    version: rawAssignment.version,
  };
  if (role === 'student')
    return { submission, assignment, rawAssignment, rubric: null };
  const { data: rawRubric } = await supabase
    .from('assignment_rubrics')
    .select('version,criteria')
    .eq('assignment_id', assignment.id)
    .maybeSingle();
  if (!rawRubric) throw new ReviewServiceError('not_found');
  const parsed = criteriaSchema.safeParse(rawRubric.criteria);
  if (!parsed.success) throw new ReviewServiceError('invalid_model_output');
  return {
    submission,
    assignment,
    rawAssignment,
    rubric: {
      version: rawRubric.version,
      criteria: parsed.data,
    } satisfies PrivateRubricContext,
  };
}

export async function performReview(
  supabase: SupabaseClient,
  userId: string,
  role: ReviewRole,
  submissionId: string,
) {
  const reviewType = reviewTypeMap[role];
  const context = await loadContext(supabase, userId, role, submissionId);
  const messages =
    role === 'student'
      ? studentReviewMessages(context.assignment, context.submission.source)
      : instructorReviewMessages(
          context.assignment,
          context.rubric!,
          context.submission.source,
        );
  const promptTokens = promptTokenEstimate(messages);
  if (promptTokens > 8_000) throw new ReviewServiceError('context_too_large');
  const model = process.env.SOCLAAS_MODEL?.trim() || 'unconfigured';
  const cacheKey = reviewCacheKey({
    requesterId: userId,
    reviewType,
    assignment: context.assignment,
    rubricVersion: context.rubric?.version,
    source: context.submission.source,
    model,
  });
  const cachedResult = await readCachedReview(supabase, {
    userId,
    reviewType,
    cacheKey,
    role,
    criteria: context.rubric?.criteria ?? [],
    submissionId,
    promptTokens,
  });
  if (cachedResult) return { result: cachedResult, cacheHit: true };
  const usageId = await reserveUsage(supabase, reviewType, submissionId);
  return generateAndRecordReview(supabase, {
    usageId,
    userId,
    reviewType,
    submissionId,
    role,
    context,
    messages,
    promptTokens,
    cacheKey,
  });
}

export async function performContextComparison(
  supabase: SupabaseClient,
  userId: string,
  submissionId: string,
) {
  const role: ReviewRole = 'instructor';
  const reviewType = reviewTypeMap[role];
  const context = await loadContext(supabase, userId, role, submissionId);
  if (!context.rubric) throw new ReviewServiceError('not_found');
  const optimizedMessages = instructorReviewMessages(
    context.assignment,
    context.rubric,
    context.submission.source,
  );
  const baselineMessages = instructorBaselineMessages(
    {
      ...context.assignment,
      createdAt: context.rawAssignment.created_at,
      updatedAt: context.rawAssignment.updated_at,
      publicationStatus: context.rawAssignment.publication_status,
    },
    context.rubric,
    context.submission.source,
    {
      revision: context.submission.revision,
      createdAt: context.submission.created_at,
    },
  );
  const optimizedTokens = promptTokenEstimate(optimizedMessages);
  const baselineTokens = promptTokenEstimate(baselineMessages);
  if (optimizedTokens > 8_000 || baselineTokens > 8_000)
    throw new ReviewServiceError('context_too_large');
  const optimized = await performReview(supabase, userId, role, submissionId);
  const model = process.env.SOCLAAS_MODEL?.trim() || 'unconfigured';
  const cacheKey = reviewCacheKey({
    requesterId: userId,
    reviewType,
    assignment: context.assignment,
    rubricVersion: context.rubric.version,
    source: context.submission.source,
    model,
    contextStrategy: 'broader-authorized-v1',
  });
  const cached = await readCachedReview(supabase, {
    userId,
    reviewType,
    cacheKey,
    role,
    criteria: context.rubric.criteria,
    submissionId,
    promptTokens: baselineTokens,
  });
  const broader = cached
    ? { result: cached, cacheHit: true }
    : await generateBaselineReview(supabase, {
        usageId: await reserveUsage(supabase, reviewType, submissionId),
        userId,
        reviewType,
        submissionId,
        role,
        context,
        messages: baselineMessages,
        promptTokens: baselineTokens,
        cacheKey,
        promptVersion: `${PROMPT_VERSION}/broader-authorized-v1`,
      });
  return {
    optimized: { ...optimized, inputTokens: optimizedTokens },
    broader: { ...broader, inputTokens: baselineTokens },
  };
}

async function generateBaselineReview(
  supabase: SupabaseClient,
  input: Parameters<typeof generateAndRecordReview>[1],
) {
  return generateAndRecordReview(supabase, input);
}

async function readCachedReview(
  supabase: SupabaseClient,
  input: {
    userId: string;
    reviewType: string;
    cacheKey: string;
    role: ReviewRole;
    criteria: PrivateRubricContext['criteria'];
    submissionId: string;
    promptTokens: number;
  },
) {
  const { data } = await supabase
    .from('ai_reviews')
    .select('result')
    .eq('requester_id', input.userId)
    .eq('cache_key', input.cacheKey)
    .maybeSingle();
  if (!data) return null;
  const result = readCachedResult(data.result, input.role, input.criteria);
  await supabase.rpc('record_ai_cache_hit', {
    p_review_type: input.reviewType,
    p_submission_id: input.submissionId,
    p_input_tokens: input.promptTokens,
    p_output_tokens: Math.ceil(
      new TextEncoder().encode(JSON.stringify(result)).byteLength / 3,
    ),
  });
  return result;
}

async function reserveUsage(
  supabase: SupabaseClient,
  reviewType: string,
  submissionId: string,
) {
  const { data, error } = await supabase.rpc('reserve_ai_request', {
    p_review_type: reviewType,
    p_submission_id: submissionId,
  });
  if (error?.message.includes('daily_quota_exceeded'))
    throw new ReviewServiceError('quota_exceeded');
  if (error || !data) throw new ReviewServiceError('not_found');
  return data;
}

async function generateAndRecordReview(
  supabase: SupabaseClient,
  input: {
    usageId: string;
    userId: string;
    reviewType: string;
    submissionId: string;
    role: ReviewRole;
    context: Awaited<ReturnType<typeof loadContext>>;
    messages: { system: string; user: string };
    promptTokens: number;
    cacheKey: string;
    promptVersion?: string;
  },
) {
  const started = Date.now();
  try {
    const provider = await requestSoCLaaS(input.messages);
    const result = readModelResult(
      provider.content,
      input.role,
      input.context.rubric?.criteria ?? [],
    );
    await storeReview(supabase, input, provider.model, result);
    const counts = resolveTokenCounts(
      provider.inputTokens,
      provider.outputTokens,
      input.promptTokens,
      provider.content,
    );
    await finishUsage(supabase, {
      usageId: input.usageId,
      succeeded: true,
      latencyMs: Date.now() - started,
      ...counts,
    });
    return { result, cacheHit: false };
  } catch (error) {
    await finishUsage(supabase, {
      usageId: input.usageId,
      succeeded: false,
      latencyMs: Date.now() - started,
      inputTokens: input.promptTokens,
      tokenSource: 'estimate',
      errorCategory:
        error instanceof ReviewServiceError
          ? error.code
          : error instanceof SoCLaaSError
            ? error.category
            : 'provider_error',
    });
    throw asFailure(error);
  }
}

function resolveTokenCounts(
  providerInput: number | undefined,
  providerOutput: number | undefined,
  estimatedInput: number,
  output: string,
) {
  if (providerInput !== undefined && providerOutput !== undefined) {
    return {
      inputTokens: providerInput,
      outputTokens: providerOutput,
      tokenSource: 'provider',
    };
  }
  return {
    inputTokens: estimatedInput,
    outputTokens: Math.ceil(new TextEncoder().encode(output).byteLength / 3),
    tokenSource: 'estimate',
  };
}

async function storeReview(
  supabase: SupabaseClient,
  input: Parameters<typeof generateAndRecordReview>[1],
  model: string,
  result: unknown,
) {
  const { error } = await supabase.from('ai_reviews').insert({
    submission_id: input.submissionId,
    requester_id: input.userId,
    review_type: input.reviewType,
    assignment_version: input.context.assignment.version,
    rubric_version: input.context.rubric?.version ?? null,
    prompt_version: input.promptVersion ?? PROMPT_VERSION,
    model,
    cache_key: input.cacheKey,
    result,
  });
  if (error) throw new ReviewServiceError('provider_error');
}

async function finishUsage(
  supabase: SupabaseClient,
  input: {
    usageId: string;
    succeeded: boolean;
    latencyMs: number;
    inputTokens?: number;
    outputTokens?: number;
    tokenSource?: string;
    errorCategory?: string;
  },
) {
  await supabase.rpc('finish_ai_request', {
    p_usage_id: input.usageId,
    p_succeeded: input.succeeded,
    p_error_category: input.errorCategory,
    p_latency_ms: input.latencyMs,
    p_input_tokens: input.inputTokens,
    p_output_tokens: input.outputTokens,
    p_token_source: input.tokenSource,
  });
}

function readCachedResult(
  value: unknown,
  role: ReviewRole,
  criteria: PrivateRubricContext['criteria'],
) {
  const result =
    role === 'student'
      ? validateModelFeedback(value)
      : validateModelEvaluation(value, criteria);
  if (!result) throw new ReviewServiceError('invalid_model_output');
  return result;
}
