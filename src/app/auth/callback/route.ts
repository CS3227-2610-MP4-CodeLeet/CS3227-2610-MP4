import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function redirect(request: NextRequest, target: string) {
  const response = NextResponse.redirect(new URL(target, request.url));
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

function failure(request: NextRequest, recovery: boolean) {
  const target = recovery
    ? '/forgot-password?error=invalid-link'
    : '/sign-in?confirmed=error';
  return redirect(request, target);
}

async function roleDestination(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.role === 'instructor' ||
    data?.role === 'admin' ||
    data?.role === 'student'
    ? '/courses'
    : '/sign-in';
}

async function acceptCourseInvitation(
  request: NextRequest,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  token: string,
) {
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) return failure(request, false);
  const { data: courseId, error } = await supabase.rpc(
    'accept_course_invitation',
    { p_token: token },
  );
  if (
    error ||
    typeof courseId !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(courseId)
  )
    return failure(request, false);
  return redirect(request, `/courses/${courseId}`);
}

export async function GET(request: NextRequest) {
  const recovery =
    request.nextUrl.searchParams.get('next') === '/reset-password';
  const code = request.nextUrl.searchParams.get('code');
  if (!code)
    return recovery ? failure(request, true) : redirect(request, '/sign-in');
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return failure(request, recovery);
    const {
      data: { user },
      error: identityError,
    } = await supabase.auth.getUser();
    if (!user || identityError) return failure(request, recovery);
    if (recovery) return redirect(request, '/reset-password');
    const inviteToken = request.nextUrl.searchParams.get('course_invite');
    if (inviteToken)
      return acceptCourseInvitation(request, supabase, inviteToken);
    return redirect(request, await roleDestination(supabase, user.id));
  } catch {
    return failure(request, recovery);
  }
}
