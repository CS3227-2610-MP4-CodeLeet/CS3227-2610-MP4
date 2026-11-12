import { ButtonLink } from '@/components/ui/pending-link';
import {
  buildListUrl,
  type ListFilters,
} from '@/features/student-lists/filters';
import { buildHistoryUrl } from './history-cursor';
import type { HistoryPage } from './history';

export function HistoryPagination({
  history,
  page,
  path,
  filters,
}: {
  history: HistoryPage;
  page: number;
  path: string;
  filters: ListFilters;
}) {
  if (page === 1 && !history.hasNext) return null;
  const first = history.rows[0];
  const last = history.rows.at(-1);
  const latest = buildListUrl(path, filters);
  return (
    <nav
      aria-label="Submission history pages"
      className="flex flex-wrap items-center gap-3"
    >
      {page > 1 && (
        <ButtonLink
          prefetch={false}
          href={
            first
              ? buildHistoryUrl(path, filters, {
                  page: page - 1,
                  cursor: first,
                  backwards: true,
                })
              : latest
          }
        >
          Previous
        </ButtonLink>
      )}
      <span className="text-sm text-muted-foreground">Page {page}</span>
      {history.hasNext && last && (
        <ButtonLink
          prefetch={false}
          href={buildHistoryUrl(path, filters, {
            page: page + 1,
            cursor: last,
          })}
        >
          Next
        </ButtonLink>
      )}
      <ButtonLink prefetch={false} href={latest}>
        Latest submissions
      </ButtonLink>
    </nav>
  );
}
