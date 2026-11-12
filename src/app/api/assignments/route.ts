import { type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  assignmentInputSchema,
  assignmentRequestMaxBytes,
} from '@/features/codementor/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';

const courseIdSchema = z.uuid();
function unavailable() {
  return privateJson(
    { error: { code: 'not_found', message: 'Course is unavailable.' } },
    404,
  );
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getVerifiedUserRole();
  if (!user)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  const courseId = courseIdSchema.safeParse(
    request.nextUrl.searchParams.get('courseId'),
  );
  if (!courseId.success) return unavailable();
  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId.data,
    'assessments',
  );
  if (!access || (access.lifecycle === 'active' && !access.featureEnabled))
    return unavailable();
  let query = supabase
    .from('assignments')
    .select(
      'id,course_id,title,language,publication_status,instructions,version,created_at,updated_at,due_at',
    )
    .eq('course_id', courseId.data);
  if (access.role === 'student')
    query = query.eq('publication_status', 'published');
  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error)
    return privateJson(
      {
        error: {
          code: 'read_failed',
          message: 'Assignments could not be loaded.',
        },
      },
      500,
    );
  return privateJson({ assignments: data });
}

export async function saveCourseAssignment(
  supabase: NonNullable<
    Awaited<ReturnType<typeof getVerifiedUserRole>>['supabase']
  >,
  options: {
    courseId: string;
    assignmentId: string | null;
    expectedVersion: number;
    input: z.infer<typeof assignmentInputSchema>;
    status: number;
  },
) {
  const { courseId, assignmentId, expectedVersion, input, status } = options;
  const { data, error } = await supabase.rpc('save_course_assignment', {
    p_course_id: courseId,
    p_assignment_id: assignmentId,
    p_expected_version: expectedVersion,
    p_title: input.title,
    p_instructions: input.instructions,
    p_criteria: input.rubric,
    p_publication_status: input.publicationStatus,
    p_language: input.language,
    p_due_at: input.dueAt ?? null,
    p_update_due_at: input.dueAt !== undefined,
    p_max_xp: input.maxXp ?? null,
    p_update_max_xp: input.maxXp !== undefined,
    p_cases: input.cases ? JSON.parse(JSON.stringify(input.cases)) : null,
  });
  if (error)
    return privateJson(
      {
        error: {
          code: 'save_failed',
          message:
            error.message === 'assignment_language_locked'
              ? 'Language cannot change after students have submitted code.'
              : 'Assignment could not be saved.',
        },
      },
      error.code === '40001' ? 409 : 400,
    );
  return privateJson({ assignment: data }, status);
}

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request))
    return privateJson(
      {
        error: {
          code: 'origin_rejected',
          message: 'Request origin could not be verified.',
        },
      },
      403,
    );
  const { supabase, user } = await getVerifiedUserRole();
  if (!user)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  const body = await readJsonBody(request, assignmentRequestMaxBytes);
  if (!body.ok)
    return privateJson(
      {
        error: {
          code: 'invalid_body',
          message: 'Request must be bounded JSON.',
        },
      },
      400,
    );
  const parsed = assignmentInputSchema.safeParse(body.value);
  if (!parsed.success)
    return privateJson(
      {
        error: {
          code: 'invalid_assignment',
          message: 'Assignment details are invalid.',
        },
      },
      400,
    );
  const access = await readCourseAccess(
    supabase,
    user.id,
    parsed.data.courseId,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'instructor' ||
    access.lifecycle !== 'active' ||
    !access.featureEnabled
  )
    return unavailable();
  return saveCourseAssignment(supabase, {
    courseId: parsed.data.courseId,
    assignmentId: null,
    expectedVersion: 0,
    input: parsed.data,
    status: 201,
  });
}
