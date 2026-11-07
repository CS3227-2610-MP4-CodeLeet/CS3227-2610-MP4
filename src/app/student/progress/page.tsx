import { notFound, redirect } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMember();
  const params = await searchParams;
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  if (!courseId) notFound();

  redirect(`/courses/${encodeURIComponent(courseId)}/progress`);
}
