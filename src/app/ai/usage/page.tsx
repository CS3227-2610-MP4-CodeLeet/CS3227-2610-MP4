import { redirect, notFound } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

export default async function AIUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { user, role } = await getVerifiedUserRole();
  if (!user || !role) redirect('/sign-in');

  const courseId = (await searchParams).courseId;
  if (!courseId) notFound();

  redirect(`/courses/${encodeURIComponent(courseId)}/ai-usage`);
}
