import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/verified-user';
import { loadOwnerCases } from '@/features/practice-test-authoring/queries.server';
import { PracticeTestEditor } from '@/features/practice-test-authoring/editor';
export default async function PracticeTestsPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { supabase } = await requireRole('instructor');
  const { assignmentId } = await params;
  if (!z.uuid().safeParse(assignmentId).success) notFound();
  const data = await loadOwnerCases(supabase, assignmentId);
  if (!data) notFound();
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Link className="text-sm underline" href="/instructor">
        Back to assignments
      </Link>
      <h1 className="text-2xl font-semibold">Practice tests</h1>
      <p>{data.title}</p>
      <PracticeTestEditor initial={data} />
    </main>
  );
}
