import { notFound, redirect } from 'next/navigation';
import { requireForumMember } from '@/features/forums/access.server';

export default async function NewDiscussionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireForumMember();
  const params = await searchParams;
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  if (!courseId) notFound();

  redirect(`/courses/${encodeURIComponent(courseId)}/forums/new`);
}
