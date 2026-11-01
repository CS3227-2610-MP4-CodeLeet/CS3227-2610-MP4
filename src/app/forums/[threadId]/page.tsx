import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireForumMember } from '@/features/forums/access.server';
import { forumPage } from '@/features/forums/contracts';
import { loadReplies, loadThread } from '@/features/forums/data.server';
import { ForumPager, PostAuthor } from '@/features/forums/components';
import { ForumForm } from '@/features/forums/forum-form';

export default async function DiscussionPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireForumMember();
  const { threadId } = await params;
  const page = forumPage((await searchParams).page);
  if (!z.uuid().safeParse(threadId).success || page === null) notFound();
  const thread = await loadThread(supabase, threadId);
  if (!thread) notFound();
  const replies = await loadReplies(supabase, threadId, page);
  return (
    <>
      <Link
        href="/forums"
        className="text-sm text-cyan-800 underline dark:text-cyan-300"
      >
        Back to forums
      </Link>
      <article className="space-y-4 rounded-xl border bg-background p-5 sm:p-6">
        <h1 className="break-words text-2xl font-semibold tracking-tight">
          {thread.title}
        </h1>
        <PostAuthor post={thread} />
        <p className="whitespace-pre-wrap break-words text-sm leading-7">
          {thread.body}
        </p>
      </article>
      <section aria-label="Replies" className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-lg font-semibold">Replies</h2>
          <span className="text-xs text-muted-foreground">Newest first</span>
        </div>
        {!replies.rows.length && (
          <p className="rounded-xl border bg-background p-5 text-sm text-muted-foreground">
            {page === 1
              ? 'No replies yet. Join the conversation.'
              : 'No replies on this page.'}
          </p>
        )}
        {replies.rows.map((reply) => (
          <article
            key={reply.id}
            className="space-y-3 rounded-xl border bg-background p-5"
          >
            <PostAuthor post={reply} />
            <p className="whitespace-pre-wrap break-words text-sm leading-7">
              {reply.body}
            </p>
          </article>
        ))}
        <ForumPager
          page={page}
          hasNext={replies.hasNext}
          path={`/forums/${threadId}`}
        />
      </section>
      <section className="space-y-4 rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Add a reply</h2>
        <ForumForm key={threadId} threadId={threadId} />
      </section>
    </>
  );
}
