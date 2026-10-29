import type { ReactNode } from 'react';
import Link from 'next/link';
import { SignOutButton } from '@/features/auth/auth-form';
import { requireRole } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

export default async function InstructorLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole('instructor');
  return (
    <div>
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/instructor" className="font-semibold">
            CodeMentor · Instructor
          </Link>
          <Link className="text-sm underline" href="/ai/usage">
            AI usage
          </Link>
          <Link className="text-sm underline" href="/instructor/ai-context">
            Context comparison
          </Link>
        </div>
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
