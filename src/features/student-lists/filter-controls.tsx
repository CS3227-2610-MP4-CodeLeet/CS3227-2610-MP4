import { FormSubmitButton } from '@/components/ui/pending-button';
import Link from 'next/link';
import Form from 'next/form';
import { hasListFilters, type ListFilters } from './filters';

export function ListFilterControls({
  path,
  filters,
  courseId,
}: {
  path: string;
  filters: ListFilters;
  courseId?: string;
}) {
  const clearPath = courseId
    ? `${path}?courseId=${encodeURIComponent(courseId)}`
    : path;
  return (
    <Form
      action={path}
      role="search"
      aria-label="Filter by assignment title and language"
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
    >
      {courseId && <input type="hidden" name="courseId" value={courseId} />}
      <div className="min-w-0 flex-[2_1_14rem] space-y-1.5 text-sm">
        <label htmlFor="list-title-search" className="block font-medium">
          Search by assignment title
        </label>
        <input
          id="list-title-search"
          key={filters.q}
          type="search"
          name="q"
          defaultValue={filters.q}
          maxLength={160}
          placeholder="Enter a title"
          className="w-full rounded-md border bg-background px-3 py-2 text-foreground"
        />
      </div>
      <div className="min-w-0 flex-[1_1_10rem] space-y-1.5 text-sm">
        <label htmlFor="list-language" className="block font-medium">
          Language
        </label>
        <select
          id="list-language"
          key={filters.language}
          name="language"
          defaultValue={filters.language}
          className="w-full rounded-md border bg-background px-3 py-2 text-foreground"
        >
          <option value="">All languages</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
      </div>
      <FormSubmitButton
        pendingLabel="Applying…"
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Apply filters
      </FormSubmitButton>
      {hasListFilters(filters) && (
        <Link
          href={clearPath}
          className="rounded-md px-3 py-2 text-sm font-medium underline underline-offset-4"
        >
          Clear filters
        </Link>
      )}
    </Form>
  );
}

export function FilteredListEmpty({
  kind,
  page = 1,
}: {
  kind: 'assignments' | 'submissions' | 'grades';
  page?: number;
}) {
  return (
    <div className="space-y-2 rounded-xl border bg-card p-8">
      <h2 className="text-lg font-semibold">
        {page > 1 ? 'No matches on this page' : `No matching ${kind}`}
      </h2>
      <p className="text-sm text-muted-foreground">
        Try a different search or language, or clear your filters.
      </p>
    </div>
  );
}
