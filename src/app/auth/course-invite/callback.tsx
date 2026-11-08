'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInviteBrowserClient } from '@/lib/supabase/invite-browser';

type State = 'checking' | 'failed';
const tokenPattern = /^[A-Za-z0-9_-]{40,128}$/;
type InviteClient = ReturnType<typeof createInviteBrowserClient>;

async function acceptCourseInvite(supabase: InviteClient, token: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user.email_confirmed_at) return null;
  const response = await fetch('/api/courses/invitations/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    }),
  });
  if (!response.ok) return null;
  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== 'object' ||
    !('courseId' in result) ||
    typeof result.courseId !== 'string'
  )
    return null;
  return zUuid(result.courseId) ? result.courseId : null;
}

export function CourseInviteCallback() {
  const router = useRouter();
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get(
      'course_invite',
    );
    let cancelled = false;
    void Promise.resolve().then(async () => {
      try {
        const courseId =
          token && tokenPattern.test(token)
            ? await acceptCourseInvite(createInviteBrowserClient(), token)
            : null;
        if (cancelled) return;
        if (courseId) router.replace(`/courses/${courseId}`);
        else setState('failed');
      } catch {
        if (!cancelled) setState('failed');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Join your course</h1>
      {state === 'checking' ? (
        <p className="mt-3 text-muted-foreground">
          Verifying your email and joining the course…
        </p>
      ) : (
        <p className="mt-3 text-muted-foreground">
          This invitation could not be accepted. Sign in with the invited email
          or ask the instructor for a new invitation.
        </p>
      )}
    </main>
  );
}

function zUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
