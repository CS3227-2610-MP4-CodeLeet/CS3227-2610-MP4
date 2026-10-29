import { z } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { privateJson } from '@/lib/http/responses';

const NOT_FOUND = {
  error: { code: 'not_found', message: 'Submission not found.' },
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return privateJson(NOT_FOUND, 404);
  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id,assignment_id,student_id,source,revision,created_at,assignments(title,instructions,language),grades(id,scores,feedback,total_score,published_at,version)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return privateJson(NOT_FOUND, 404);
  if (role === 'student' && data.student_id !== user.id)
    return privateJson(NOT_FOUND, 404);
  return privateJson({ submission: data });
}
