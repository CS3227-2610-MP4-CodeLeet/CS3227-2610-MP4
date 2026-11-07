import { notFound, redirect } from 'next/navigation';
import { requireForumMember } from '@/features/forums/access.server';

export default async function ForumsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireForumMember();
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
    `/courses/${encodeURIComponent(courseId)}/forums${queryStr ? `?${queryStr}` : ''}`,
  );
}
