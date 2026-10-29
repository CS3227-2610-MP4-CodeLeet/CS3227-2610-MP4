import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/sign-in', request.url));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(
      new URL('/sign-in?confirmed=error', request.url),
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: roleRecord } = user
    ? await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };
  const destination =
    roleRecord?.role === 'instructor'
      ? '/instructor'
      : roleRecord?.role === 'student'
        ? '/student/assignments'
        : '/sign-in';
  return NextResponse.redirect(new URL(destination, request.url));
}
