import { AssignmentForm } from '@/features/codementor/assignment-form';
import { requireRole } from '@/lib/auth/verified-user';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NewAssignmentPage() {
  await requireRole('instructor');
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Link className="text-sm underline" href="/instructor">
        Back to assignments
      </Link>
      <h1 className="text-3xl font-semibold">Create assignment</h1>
      <AssignmentForm />
    </main>
  );
}
