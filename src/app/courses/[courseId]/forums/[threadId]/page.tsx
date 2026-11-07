import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import {
  requireDiscussionCourse,
  requireForumMember,
} from '@/features/forums/access.server';
import { forumPage } from '@/features/forums/contracts';
import { loadReplies, loadThread } from '@/features/forums/data.server';
import { ForumPager, PostAuthor } from '@/features/forums/components';
import { ForumForm } from '@/features/forums/forum-form';
import type { ForumThread } from '@/features/forums/contracts';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';

export default async function CourseDiscussionPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; threadId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, supabase } = await requireForumMember();
  const { courseId, threadId } = await params;
  const query = await searchParams;

  const { access } = await requireDiscussionCourse(
    user.id,
    supabase,
    courseId,
  );
  const page = forumPage(query.page);
  if (!z.uuid().safeParse(threadId).success || page === null) notFound();

  const thread = await loadThread(supabase, courseId, threadId);
  if (!thread) notFound();

  const replies = await loadReplies(supabase, threadId, page);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <BreadcrumbSetter title={thread.title} />
      <DiscussionContent
        courseId={courseId}
        threadId={threadId}
        thread={thread}
        replies={replies}
        page={page}
        canReply={access.lifecycle === 'active' && access.featureEnabled}
      />
    </div>
  );
}

function DiscussionContent({
  courseId,
  threadId,
  thread,
  replies,
  page,
  canReply,
}: {
  courseId: string;
  threadId: string;
  thread: ForumThread;
  replies: Awaited<ReturnType<typeof loadReplies>>;
  page: number;
  canReply: boolean;
}) {
  return (
    <>
      <Link
        href={`/courses/${courseId}/forums`}
        className="text-sm text-cyan-800 underline dark:text-cyan-300"
      >
        ← Back to discussions
      </Link>
      <article className="space-y-4 rounded-xl border bg-background p-5 sm:p-6">
        <h1 className="break-words text-2xl font-semibold tracking-tight">
          {thread.title}
        </h1>
        <PostAuthor post={thread} />
        <p className="whitespace-pre-wrap break-words text-sm leading-6">
          {thread.body}
        </p>
      </article>
      <section aria-label="Replies" className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Replies</h2>
        {!replies.rows.length && (
          <p className="rounded-xl border bg-background px-5 py-8 text-sm text-muted-foreground">
            {page > 1
              ? 'No more replies on this page.'
              : 'No replies yet. Be the first to join the conversation!'}
          </p>
        )}
        <div className="divide-y overflow-hidden rounded-xl border bg-background">
          {replies.rows.map((reply) => (
            <article key={reply.id} className="space-y-2 px-5 py-4">
              <PostAuthor post={reply} />
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {reply.body}
              </p>
            </article>
          ))}
        </div>
        <ForumPager
          hasNext={replies.hasNext}
          page={page}
          path={`/courses/${courseId}/forums/${threadId}`}
        />
        {canReply ? (
          <section className="space-y-3 rounded-xl border bg-background p-5 sm:p-6">
            <h3 className="font-semibold">Write a reply</h3>
            <ForumForm key={threadId} courseId={courseId} threadId={threadId} />
          </section>
        ) : (
          <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
            This discussion is read-only.
          </p>
        )}
      </section>
    </>
  );
}
