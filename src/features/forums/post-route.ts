import { z } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { isAppRole } from '@/lib/auth/roles';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';
import { forumInput } from './contracts';
import { readCourseAccess } from '@/lib/courses/access';

function failure(code: string, message: string, status: number) {
  return privateJson({ error: { code, message } }, status);
}

async function verifiedForumPoster() {
  const { user, role, supabase } = await getVerifiedUserRole();
  if (!user || !supabase)
    return {
      ok: false as const,
      response: failure('unauthorized', 'Sign in to post.', 401),
    };
  if (!isAppRole(role))
    return {
      ok: false as const,
      response: failure('forbidden', 'Account access required.', 403),
    };
  return { ok: true as const, user, supabase };
}

async function readForumInput(request: Request) {
  const body = await readJsonBody(request, 34000);
  if (!body.ok)
    return {
      ok: false as const,
      response: failure(
        'invalid_body',
        'Send a message within the allowed size.',
        body.reason === 'too-large' ? 413 : 400,
      ),
    };
  const parsed = forumInput.safeParse(body.value);
  if (!parsed.success)
    return {
      ok: false as const,
      response: failure(
        'invalid_post',
        'Use a title of 1–160 characters and a message of 1–8,000 characters.',
        400,
      ),
    };
  return { ok: true as const, value: parsed.data };
}

function postingError(error: { code: string; message: string }) {
  if (error.code === 'P0001' && error.message === 'forum_rate_limited') {
    const response = failure(
      'rate_limited',
      'You’re posting quickly. Try again in a minute.',
      429,
    );
    response.headers.set('Retry-After', '60');
    return response;
  }
  if (error.code === '23505')
    return failure(
      'retry_conflict',
      'This request conflicts with an earlier post. Edit your message and try again.',
      409,
    );
  if (error.code === 'P0002')
    return failure('unavailable', 'This discussion is unavailable.', 404);
  if (error.code === '42501')
    return failure('forbidden', 'Forum access is required.', 403);
  if (error.code === '22023')
    return failure('invalid_post', 'Check the title and message lengths.', 400);
  return failure(
    'post_failed',
    'Your post could not be saved. Try again.',
    503,
  );
}

async function createPost(request: Request): Promise<Response> {
  const poster = await verifiedForumPoster();
  if (!poster.ok) return poster.response;
  const { user, supabase } = poster;
  const parsed = await readForumInput(request);
  if (!parsed.ok) return parsed.response;
  const value = parsed.value;
  const access = await readCourseAccess(
    supabase,
    user.id,
    value.courseId,
    'discussions',
  );
  if (!access || access.lifecycle !== 'active' || !access.featureEnabled)
    return failure(
      'unavailable',
      'This course discussion is unavailable.',
      404,
    );
  const { data, error } = await supabase.rpc('create_forum_post', {
    p_course_id: value.courseId,
    p_thread_id: 'threadId' in value ? value.threadId : null,
    p_title: 'title' in value ? value.title : null,
    p_body: value.body,
    p_request_id: value.requestId,
  });
  if (error) return postingError(error);
  const result = z.object({ threadId: z.uuid(), postId: z.uuid() }).parse(data);
  return privateJson({ post: result }, 201);
}

export async function postForum(request: Request): Promise<Response> {
  if (!sameOriginRequest(request))
    return failure(
      'origin_rejected',
      'Request origin could not be verified.',
      403,
    );
  try {
    return await createPost(request);
  } catch {
    return failure(
      'post_failed',
      'Your post could not be saved. Try again.',
      503,
    );
  }
}
