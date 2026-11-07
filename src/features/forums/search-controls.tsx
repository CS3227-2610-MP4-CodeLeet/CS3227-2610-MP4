import { FormSubmitButton } from '@/components/ui/pending-button';
import Form from 'next/form';
import Link from 'next/link';

export function ForumSearchControls({
  query,
  courseId,
}: {
  query: string;
  courseId: string;
}) {
  return (
    <Form
      action={`/courses/${courseId}/forums`}
      role="search"
      aria-label="Search discussions"
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-background p-4"
    >
      <div className="min-w-0 flex-1 basis-56 space-y-2">
        <label htmlFor="forum-search" className="block text-sm font-medium">
          Search discussions
        </label>
        <input
          id="forum-search"
          key={query}
          type="search"
          name="q"
          defaultValue={query}
          maxLength={160}
          placeholder="Search titles and opening posts"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <FormSubmitButton
        pendingLabel="Searching…"
        type="submit"
        className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
      >
        Search
      </FormSubmitButton>
      {query && (
        <Link
          href={`/courses/${courseId}/forums`}
          className="px-3 py-2 text-sm font-medium underline underline-offset-4"
        >
          Clear search
        </Link>
      )}
    </Form>
  );
}
