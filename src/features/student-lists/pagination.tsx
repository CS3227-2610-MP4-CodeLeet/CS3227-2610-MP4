import Link from 'next/link';
import { buildListUrl, type ListFilters } from './filters';

export function ListPagination({
  path,
  label,
  page,
  hasNext,
  filters,
}: {
  path: string;
  label: string;
  page: number;
  hasNext: boolean;
  filters: ListFilters;
}) {
  if (page === 1 && !hasNext) return null;
  const linkStyle =
    'inline-flex rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring';
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-3">
      {page > 1 && (
        <Link
          href={buildListUrl(path, filters, page - 1)}
          className={linkStyle}
        >
          Previous
        </Link>
      )}
      <span className="text-sm text-muted-foreground">Page {page}</span>
      {hasNext && (
        <Link
          href={buildListUrl(path, filters, page + 1)}
          className={linkStyle}
        >
          Next
        </Link>
      )}
    </nav>
  );
}
