import { notFound, redirect } from 'next/navigation';
import { requireForumMember } from '@/features/forums/access.server';

export default async function DiscussionPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireForumMember();
  const [{ threadId }, query] = await Promise.all([params, searchParams]);
  const courseId = typeof query.courseId === 'string' ? query.courseId : '';
  if (!courseId) notFound();

  const search = new URLSearchParams();
  for (const [key, val] of Object.entries(query)) {
    if (key !== 'courseId' && typeof val === 'string') {
      search.set(key, val);
    }
  }
  const queryStr = search.toString();
  redirect(
    `/courses/${encodeURIComponent(courseId)}/forums/${encodeURIComponent(threadId)}${queryStr ? `?${queryStr}` : ''}`,
  );
}
