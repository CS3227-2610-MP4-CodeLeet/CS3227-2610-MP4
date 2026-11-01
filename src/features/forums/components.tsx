import Link from 'next/link';
import type { ForumPost } from './contracts';
import { forumSearchUrl } from './search';

export function PostAuthor({ post }: { post: ForumPost }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{post.author_name}</span>
      <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
        {post.author_role}
      </span>
      <time dateTime={post.created_at}>
        {new Intl.DateTimeFormat('en-SG', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Singapore',
        }).format(new Date(post.created_at))}{' '}
        SGT
      </time>
    </p>
  );
}

export function ForumPager({
  page,
  hasNext,
  path,
  query = '',
}: {
  page: number;
  hasNext: boolean;
  path: string;
  query?: string;
}) {
  if (page === 1 && !hasNext) return null;
  return (
    <nav
      aria-label="Discussion pages"
      className="flex items-center gap-4 text-sm"
    >
      {page > 1 && (
        <Link
          className="underline"
          href={forumSearchUrl(path, page - 1, query)}
        >
          Previous
        </Link>
      )}
      <span className="text-muted-foreground">Page {page}</span>
      {hasNext && (
        <Link
          className="underline"
          href={forumSearchUrl(path, page + 1, query)}
        >
          Next
        </Link>
      )}
    </nav>
  );
}
