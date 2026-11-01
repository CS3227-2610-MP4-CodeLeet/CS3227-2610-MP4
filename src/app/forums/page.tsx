import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireForumMember } from '@/features/forums/access.server';
import { forumPage } from '@/features/forums/contracts';
import { loadThreads } from '@/features/forums/data.server';
import { ForumPager, PostAuthor } from '@/features/forums/components';

export default async function ForumsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireForumMember();
  const page = forumPage((await searchParams).page);
  if (page === null) notFound();
  const threads = await loadThreads(supabase, page);
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forums</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask questions and learn together.
          </p>
        </div>
        <Link
          href="/forums/new"
          className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
        >
          New discussion
        </Link>
      </div>
      <section
        aria-label="Discussions"
        className="divide-y overflow-hidden rounded-xl border bg-background"
      >
        {!threads.rows.length && (
          <p className="px-5 py-10 text-sm text-muted-foreground">
            {page === 1
              ? 'No discussions yet. Start the first one.'
              : 'No discussions on this page.'}
          </p>
        )}
        {threads.rows.map((thread) => (
          <article key={thread.id} className="space-y-2 px-5 py-4">
            <h2 className="break-words font-semibold">
              <Link
                href={`/forums/${thread.id}`}
                className="text-cyan-800 hover:underline dark:text-cyan-300"
              >
                {thread.title}
              </Link>
            </h2>
            <PostAuthor post={thread} />
            <p className="line-clamp-2 break-words text-sm leading-6 text-muted-foreground">
              {thread.body}
            </p>
          </article>
        ))}
      </section>
      <ForumPager page={page} hasNext={threads.hasNext} path="/forums" />
    </>
  );
}
