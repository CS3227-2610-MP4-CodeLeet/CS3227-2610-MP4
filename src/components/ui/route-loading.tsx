import { LoaderCircle } from 'lucide-react';

/**
 * Shared route-level fallback used by `loading.tsx` files. Next.js shows it
 * immediately on navigation, so every route gives the same progress cue
 * while its server data loads.
 */
export function RouteLoading({
  label,
  rows = 2,
}: {
  /** What is loading, e.g. "courses"; announced as "Loading courses". */
  label: string;
  /** Number of skeleton rows below the heading. */
  rows?: number;
}) {
  const message = `Loading ${label}`;
  return (
    <div
      role="status"
      aria-label={message}
      className="mx-auto w-full max-w-6xl space-y-4 rounded-xl border bg-card p-8"
    >
      <p className="flex items-center gap-2 text-muted-foreground">
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
        {message}…
      </p>
      <div
        aria-hidden="true"
        className="h-6 max-w-sm animate-pulse rounded bg-muted motion-reduce:animate-none"
      />
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-20 animate-pulse rounded bg-muted motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
