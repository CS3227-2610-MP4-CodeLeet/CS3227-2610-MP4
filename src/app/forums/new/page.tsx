import Link from 'next/link';
import {
  requireDiscussionCourse,
  requireForumMember,
} from '@/features/forums/access.server';
import { ForumForm } from '@/features/forums/forum-form';

export default async function NewDiscussionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, supabase } = await requireForumMember();
  const params = await searchParams;
  const { courseId } = await requireDiscussionCourse(
    user.id,
    supabase,
    params.courseId,
    true,
  );
  return (
    <>
      <Link
        href={`/forums?courseId=${courseId}`}
        className="text-sm text-cyan-800 underline dark:text-cyan-300"
      >
        Back to forums
      </Link>
      <section className="space-y-5 rounded-xl border bg-background p-5 sm:p-6">
        <h1 className="text-2xl font-semibold">New discussion</h1>
        <ForumForm courseId={courseId} />
      </section>
    </>
  );
}
