'use client';

export default function ForumsError({ reset }: { reset: () => void }) {
  return (
    <section
      className="space-y-3 rounded-xl border bg-background p-6"
      role="alert"
    >
      <h1 className="text-xl font-semibold">Forums are unavailable</h1>
      <p className="text-sm text-muted-foreground">
        We couldn’t load this discussion. Please try again.
      </p>
      <button onClick={reset} className="rounded-md border px-3 py-2 text-sm">
        Try again
      </button>
    </section>
  );
}
