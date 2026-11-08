export default function SubmissionsLoading() {
  return (
    <section
      role="status"
      aria-label="Loading submissions"
      className="space-y-4 rounded-xl border bg-card p-8"
    >
      <p className="text-sm text-muted-foreground">Loading submissions…</p>
      <div
        aria-hidden="true"
        className="h-6 max-w-sm animate-pulse rounded bg-muted"
      />
      <div aria-hidden="true" className="h-32 animate-pulse rounded bg-muted" />
    </section>
  );
}
