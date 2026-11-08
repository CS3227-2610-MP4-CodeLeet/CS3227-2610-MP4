import { ButtonLink } from '@/components/ui/pending-link';
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
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-3">
      {page > 1 && (
        <ButtonLink href={buildListUrl(path, filters, page - 1)}>
          Previous
        </ButtonLink>
      )}
      <span className="text-sm text-muted-foreground">Page {page}</span>
      {hasNext && (
        <ButtonLink href={buildListUrl(path, filters, page + 1)}>
          Next
        </ButtonLink>
      )}
    </nav>
  );
}
