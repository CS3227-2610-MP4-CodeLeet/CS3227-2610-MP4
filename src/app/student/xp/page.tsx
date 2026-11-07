import { notFound, redirect } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';

export default async function XpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMember();
  const params = await searchParams;
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  if (!courseId) notFound();

  const search = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (key !== 'courseId' && typeof val === 'string') {
      search.set(key, val);
    }
  }
  const queryStr = search.toString();
  redirect(
    `/courses/${encodeURIComponent(courseId)}/xp${queryStr ? `?${queryStr}` : ''}`,
  );
}
