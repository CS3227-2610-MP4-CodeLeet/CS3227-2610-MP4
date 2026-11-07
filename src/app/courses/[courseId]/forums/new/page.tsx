import Link from 'next/link';
import {
  requireDiscussionCourse,
  requireForumMember,
} from '@/features/forums/access.server';
import { ForumForm } from '@/features/forums/forum-form';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';

export default async function CourseNewDiscussionPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { user, supabase } = await requireForumMember();
  const { courseId } = await params;
  await requireDiscussionCourse(user.id, supabase, courseId, true);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <BreadcrumbSetter title="New Discussion" />
      <Link
        href={`/courses/${courseId}/forums`}
        className="text-sm text-cyan-800 underline dark:text-cyan-300"
      >
        ← Back to discussions
      </Link>
      <section className="space-y-5 rounded-xl border bg-background p-5 sm:p-6">
        <h1 className="text-2xl font-semibold">New discussion</h1>
        <ForumForm courseId={courseId} />
      </section>
    </div>
  );
}
