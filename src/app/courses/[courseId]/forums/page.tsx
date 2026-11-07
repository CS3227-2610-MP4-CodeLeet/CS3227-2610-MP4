import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  requireDiscussionCourse,
  requireForumMember,
} from '@/features/forums/access.server';
import { forumPage } from '@/features/forums/contracts';
import { loadThreads } from '@/features/forums/data.server';
import { ForumPager, PostAuthor } from '@/features/forums/components';
import { parseForumSearch } from '@/features/forums/search';
import { ForumSearchControls } from '@/features/forums/search-controls';

export default async function CourseForumsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, supabase } = await requireForumMember();
  const { courseId } = await params;
  const urlParams = await searchParams;

  const { access } = await requireDiscussionCourse(user.id, supabase, courseId);
  const page = forumPage(urlParams.page);
  const query = parseForumSearch(urlParams.q);
  if (page === null || query === null) notFound();

  const threads = await loadThreads(supabase, courseId, page, query);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discussions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask questions and learn together.
          </p>
        </div>
        {access.lifecycle === 'active' && (
          <Link
            href={`/courses/${courseId}/forums/new`}
            className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
          >
            New discussion
          </Link>
        )}
      </div>
      <ForumSearchControls query={query} courseId={courseId} />
      <section
        aria-label="Discussions"
        className="divide-y overflow-hidden rounded-xl border bg-background"
      >
        {!threads.rows.length && (
          <p className="px-5 py-10 text-sm text-muted-foreground">
            {emptyMessage(query, page)}
          </p>
        )}
        {threads.rows.map((thread) => (
          <article key={thread.id} className="space-y-2 px-5 py-4">
            <h2 className="break-words font-semibold">
              <Link
                href={`/courses/${courseId}/forums/${thread.id}`}
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
      <ForumPager
        hasNext={threads.hasNext}
        page={page}
        path={`/courses/${courseId}/forums`}
        query={query}
      />
    </main>
  );
}

function emptyMessage(query: string, page: number): string {
  if (page > 1) return 'No more discussions on this page.';
  return query
    ? 'No discussions matched your search.'
    : 'No discussions yet. Start the conversation!';
}
