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
  if (data?.role === 'instructor') return '/instructor';
  return data?.role === 'student' ? '/student/assignments' : '/sign-in';
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
    const destination = recovery
      ? '/reset-password'
      : await roleDestination(supabase, user.id);
    return redirect(request, destination);
  } catch {
    return failure(request, recovery);
  }
}
